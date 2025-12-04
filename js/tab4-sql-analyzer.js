// Tab 4: SQL Analyzer - Gemini API integration

// Try multiple models in order of preference
const GEMINI_MODELS = [
  'gemini-2.5-flash',          // Latest (as requested)
  'gemini-2.0-flash-exp',      // Experimental
  'gemini-1.5-flash',          // Stable
  'gemini-1.5-pro'             // Fallback
];

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function analyzeSQLMismatch() {
  try {
    // Get inputs
    const campaignJson = document.getElementById('sqlCampaignJson').value.trim();
    const sqlQuery = document.getElementById('sqlQuery').value.trim();
    const apiKey = document.getElementById('geminiApiKey').value.trim();

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

    // Show loading state
    const resultsDiv = document.getElementById('sqlAnalysisResults');
    resultsDiv.innerHTML = '<div class="status info">🔬 Analyzing with Gemini AI...</div>';
    showStatus('info', 'Analyzing...');

    // Build prompt for Gemini
    const prompt = `You are an expert in PostgreSQL and Real-Time Bidding (RTB) systems. You are analyzing why a SQL query doesn't match a specific bid entity.

**Context:**
- The bidder uses a PostgreSQL database with a "bid_entities" table containing campaign targeting rules
- When a bid request arrives, the bidder runs a SQL query with WHERE conditions to find matching campaigns
- The SQL query below is failing to find the campaign (bid entity) provided

**Your task:**
Analyze why the SQL query doesn't match the bid entity. Find ALL mismatches between SQL conditions and campaign field values.

**SQL Query (conditions the bidder is checking):**
\`\`\`sql
${sqlQuery}
\`\`\`

**Bid Entity (campaign that should match but doesn't):**
\`\`\`json
${JSON.stringify(campaign, null, 2)}
\`\`\`

**Important PostgreSQL type notes:**
- Arrays: PostgreSQL format is {value1,value2}, empty is {}, null is ""
- lquery: Pattern matching type (e.g., {DE.*.*} matches Germany, {Android.*} matches Android OS)
- Operators: @> (contains), && (overlaps), IS NULL, IS NOT NULL

**Please provide:**
1. **List all mismatches** - which SQL conditions are failing and why
2. **Specific values** - show what the SQL expects vs what the campaign has
3. **Explain each mismatch** - why it's failing (wrong value, wrong type, missing field, etc.)
4. **Suggest fixes** - how to modify the campaign or SQL query to match

**Format your answer in English as a clear markdown list with sections.**`;

    // Try models in order until one works
    let data;
    let lastError;

    for (const model of GEMINI_MODELS) {
      try {
        const apiUrl = `${GEMINI_API_BASE}/${model}:generateContent`;
        console.log(`Trying model: ${model}`);

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
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          })
        });

        if (response.ok) {
          data = await response.json();
          console.log(`Success with model: ${model}`);
          break; // Success! Exit loop
        } else {
          const errorData = await response.json();
          lastError = `${model}: ${response.status} - ${errorData.error?.message || 'Unknown error'}`;
          console.warn(lastError);
          // Try next model
          continue;
        }
      } catch (err) {
        lastError = `${model}: ${err.message}`;
        console.warn(lastError);
        // Try next model
        continue;
      }
    }

    if (!data) {
      throw new Error(`All models failed. Last error: ${lastError}`);
    }

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const analysisText = data.candidates[0].content.parts[0].text;

    // Display results with markdown formatting
    displayAnalysisResults(analysisText);
    showStatus('success', '✓ Analysis complete!');

  } catch (err) {
    console.error('SQL Analysis error:', err);
    showStatus('error', 'Error: ' + err.message);
    document.getElementById('sqlAnalysisResults').innerHTML =
      `<div class="status error">Error: ${err.message}</div>`;
  }
}

function displayAnalysisResults(markdown) {
  const resultsDiv = document.getElementById('sqlAnalysisResults');

  // Simple markdown to HTML conversion
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
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

  // Wrap in paragraphs
  html = '<div class="analysis-result"><p>' + html + '</p></div>';

  resultsDiv.innerHTML = html;
}

function clearSQLAnalyzer() {
  if (confirm('Are you sure you want to clear all inputs? (API key will be kept)')) {
    document.getElementById('sqlCampaignJson').value = '';
    document.getElementById('sqlQuery').value = '';
    document.getElementById('sqlAnalysisResults').innerHTML = '';
    showStatus('info', 'Inputs cleared');
  }
}
