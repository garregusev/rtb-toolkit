// Tab 4: SQL Analyzer - Gemini API integration

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.5-flash'; // Use only this model as requested

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
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 16384, // Increased to allow longer responses
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

    // Check for MAX_TOKENS finish reason
    if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'MAX_TOKENS') {
      console.warn('⚠️ Response was truncated due to MAX_TOKENS');
      throw new Error('Response was too long and got truncated. Please try with a shorter SQL query or less campaign data.');
    }

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
    console.log('✅ Analysis completed successfully');

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
