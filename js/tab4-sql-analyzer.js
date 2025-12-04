// Tab 4: SQL Analyzer - Gemini API integration

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.5-flash'; // Use only this model as requested

// Load prompt template from external file
let SQL_ANALYZER_PROMPT_TEMPLATE = '';

// Load prompt on page load
async function loadSQLAnalyzerPrompt() {
  try {
    const response = await fetch('prompts/sql-analyzer.txt');
    if (response.ok) {
      SQL_ANALYZER_PROMPT_TEMPLATE = await response.text();
      console.log('✅ SQL Analyzer prompt loaded');
    } else {
      console.warn('⚠️ Failed to load prompt template, using fallback');
      SQL_ANALYZER_PROMPT_TEMPLATE = `Compare SQL query to campaign JSON. List mismatches.

IMPORTANT PostgreSQL Notes:
- Array fields: "" (empty string) = {} (empty array) = NULL for checking
- SQL uses: field IS NULL OR field = '{}' OR field = ''
- Don't report mismatch if SQL expects NULL and campaign has ""
- lquery arrays: {pattern1,pattern2} format

SQL:
{SQL_QUERY}

Campaign:
{CAMPAIGN_JSON}

Format (ONLY actual mismatches):
• Field: [name] | Expected: [value] | Got: [value] | Fix: [action]

NO explanations. Skip fields where "" equals NULL/{}.`;
    }
  } catch (err) {
    console.error('Error loading prompt template:', err);
    // Use fallback prompt
    SQL_ANALYZER_PROMPT_TEMPLATE = `Compare SQL query to campaign JSON. List mismatches.

IMPORTANT PostgreSQL Notes:
- Array fields: "" (empty string) = {} (empty array) = NULL for checking
- SQL uses: field IS NULL OR field = '{}' OR field = ''
- Don't report mismatch if SQL expects NULL and campaign has ""
- lquery arrays: {pattern1,pattern2} format

SQL:
{SQL_QUERY}

Campaign:
{CAMPAIGN_JSON}

Format (ONLY actual mismatches):
• Field: [name] | Expected: [value] | Got: [value] | Fix: [action]

NO explanations. Skip fields where "" equals NULL/{}.`;
  }
}

// Initialize prompt on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSQLAnalyzerPrompt);
} else {
  loadSQLAnalyzerPrompt();
}

async function analyzeSQLMismatch() {
  const compareButton = event.target;
  const resultsDiv = document.getElementById('sqlAnalysisResults');
  const originalButtonText = compareButton.innerHTML;

  try {
    // Get inputs
    const campaignJson = document.getElementById('sqlCampaignJson').value.trim();
    const sqlQuery = document.getElementById('sqlQuery').value.trim();
    const apiKey = document.getElementById('geminiApiKey').value.trim();
    const language = document.getElementById('responseLanguage').value;

    if (!apiKey) {
      throw new Error('Please enter your Gemini API key. Get one free at https://aistudio.google.com/apikey');
    }

    if (!campaignJson) {
      throw new Error('Please enter campaign data');
    }

    if (!sqlQuery) {
      throw new Error('Please enter SQL query');
    }

    // Save API key to localStorage for next time
    localStorage.setItem('gemini_api_key', apiKey);

    // Validate JSON
    let campaign;
    try {
      campaign = JSON.parse(campaignJson);
      if (Array.isArray(campaign)) {
        campaign = campaign[0];
      }
    } catch (err) {
      throw new Error('Invalid campaign JSON: ' + err.message);
    }

    // Disable button and show loading state
    compareButton.disabled = true;
    compareButton.innerHTML = '⏳ Analyzing...';
    resultsDiv.innerHTML = '<div class="status info">🔬 Analyzing with Gemini AI... Please wait, this may take 5-15 seconds.</div>';
    showStatus('info', 'Analyzing...');

    // Language names for prompt
    const languageNames = {
      'en': 'English',
      'ru': 'Russian',
      'de': 'German',
      'es': 'Spanish',
      'fr': 'French',
      'tr': 'Turkish',
      'hi': 'Hindi'
    };

    // Build prompt from template
    const prompt = SQL_ANALYZER_PROMPT_TEMPLATE
      .replace('{SQL_QUERY}', sqlQuery)
      .replace('{CAMPAIGN_JSON}', JSON.stringify(campaign, null, 2))
      + `\n\nAnswer in ${languageNames[language]}.`;

    // Call Gemini API
    const apiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent`;
    console.log(`📡 Calling Gemini API (${GEMINI_MODEL})...`);

    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1, // Lower temperature for more focused output
          topK: 20,
          topP: 0.9,
          maxOutputTokens: 16384, // Increased to handle thinking tokens + output
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error?.message || 'Unknown error';
      console.error('❌ Gemini API error:', response.status, errorMsg);
      throw new Error(`Gemini API error (${response.status}): ${errorMsg}`);
    }

    const data = await response.json();
    console.log('📦 Received response from Gemini');

    // Validate response structure
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Invalid response structure:', data);
      throw new Error('Invalid response from Gemini API - missing candidates or content');
    }

    if (!data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('❌ Invalid response structure - missing parts:', data);
      throw new Error('Invalid response from Gemini API - missing parts array');
    }

    const analysisText = data.candidates[0].content.parts[0].text;

    // Check for MAX_TOKENS finish reason - show warning but still display results
    const wasTruncated = data.candidates[0].finishReason === 'MAX_TOKENS';
    if (wasTruncated) {
      console.warn('⚠️ Response was truncated due to MAX_TOKENS');
    }

    console.log('✅ Analysis completed successfully');

    // Display results with markdown formatting
    displayAnalysisResults(analysisText, null, wasTruncated);
    showStatus('success', '✓ Analysis complete!' + (wasTruncated ? ' (response was truncated)' : ''));

  } catch (err) {
    console.error('SQL Analysis error:', err);
    showStatus('error', 'Error: ' + err.message);
    resultsDiv.innerHTML =
      `<div class="status error">Error: ${err.message}</div>`;
  } finally {
    // Re-enable button
    compareButton.disabled = false;
    compareButton.innerHTML = originalButtonText;
  }
}

function displayAnalysisResults(markdown, targetElement, wasTruncated = false) {
  // Allow passing custom element (for tests) or use default
  const resultsDiv = targetElement || document.getElementById('sqlAnalysisResults');

  // Simple markdown to HTML conversion
  let html = markdown
    // Code blocks (must be before inline code)
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Headers (order matters: h3 before h2 before h1)
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap lists in ul tags
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Add truncation warning if needed
  let finalHtml = '';
  if (wasTruncated) {
    finalHtml += '<div class="status warning" style="background-color: #fff3cd; color: #856404; margin-bottom: 15px;">⚠️ <strong>Note:</strong> Response was truncated due to length. Showing partial analysis.</div>';
  }

  // Wrap everything in analysis-result div
  finalHtml += '<div class="analysis-result">' + html + '</div>';

  resultsDiv.innerHTML = finalHtml;
}

function clearSQLAnalyzer() {
  if (confirm('Are you sure you want to clear all inputs? (API key will be kept)')) {
    document.getElementById('sqlCampaignJson').value = '';
    document.getElementById('sqlQuery').value = '';
    document.getElementById('sqlAnalysisResults').innerHTML = '';
    showStatus('info', 'Inputs cleared');
  }
}
