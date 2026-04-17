// Tab 4: SQL Analyzer — local SQL parsing, no external API required

// All campaign field names from bid_entities table
const CAMPAIGN_FIELD_NAMES = [
  // Geo / location
  'geo_allowlist', 'geo_blocklist',
  'postal_code_allowlist', 'postal_code_blocklist',
  'ip_allowlist', 'ip_blocklist',
  // Device & browser
  'device_type_allowlist', 'device_type_blocklist',
  'browser_allowlist', 'browser_blocklist',
  'browser_language_allowlist', 'browser_language_blocklist',
  'device_allowlist', 'device_blocklist',
  'os_allowlist', 'os_blocklist',
  'connection_type_allowlist', 'connection_type_blocklist',
  'isp_allowlist', 'isp_blocklist',
  // Inventory
  'inventory_type_allowlist', 'inventory_type_blocklist',
  'domain_allowlist', 'domain_blocklist',
  'supply_source_allowlist', 'supply_source_blocklist',
  'publisher_id_allowlist', 'publisher_id_blocklist',
  'publisher_name_allowlist', 'publisher_name_blocklist',
  'site_id_allowlist', 'site_id_blocklist',
  'site_name_allowlist', 'site_name_blocklist',
  'ad_unit_id_allowlist', 'ad_unit_id_blocklist',
  'ad_unit_ratio_blocklist',
  'inventory_allowlist', 'inventory_blocklist',
  // Campaign scalars
  'media_type', 'price', 'price_type', 'currency', 'pacing_type',
  'test_flag', 'interstitial', 'width', 'height', 'priority',
  'start_date', 'end_date', 'deal_code', 'deal_id',
  'duration', 'is_skippable',
  // Video / formats
  'protocols', 'playback_methods', 'api_frameworks', 'mime_types',
  'iab_categories',
];

// Parse ARRAY literal values, stripping PostgreSQL type casts
// Input: "'DE.*.*', 'IT.*.*'::lquery[]" → ['DE.*.*', 'IT.*.*']
function parseArrayLiteral(str) {
  const cleaned = str.replace(/::[a-zA-Z_\[\]]+/g, '');
  const values = [];
  const re = /'([^']+)'|\b(\d+)\b/g;
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    values.push(m[1] !== undefined ? m[1] : m[2]);
  }
  return values;
}

// Scan SQL for conditions on all known campaign fields
function parseFilteringSQL(sql) {
  const conditions = [];
  for (const field of CAMPAIGN_FIELD_NAMES) {
    if (!new RegExp(`\\b${field}\\b`, 'i').test(sql)) continue;
    const cond = extractFieldCondition(sql, field);
    if (cond) conditions.push({ field, ...cond });
  }
  return conditions;
}

// Extract the condition type and value(s) for a single field from SQL text.
// Field references may use an optional table alias: li.field, b.field, etc.
function extractFieldCondition(sql, field) {
  const fp = `(?:[a-zA-Z_][a-zA-Z0-9_]*\\.)?${field}`;

  let m;

  // 1. Blocklist: NOT field @> ARRAY[...] — must check before plain @>
  m = sql.match(new RegExp(`NOT\\s+${fp}\\s*@>\\s*ARRAY\\[([^\\]]+)\\]`, 'i'));
  if (m) {
    const values = parseArrayLiteral(m[1]);
    return { type: 'blocklist', values, sqlSnippet: `NOT ${field} @> ARRAY[${values.join(', ')}]` };
  }

  // 2. Allowlist: field @> ARRAY[...]
  m = sql.match(new RegExp(`${fp}\\s*@>\\s*ARRAY\\[([^\\]]+)\\]`, 'i'));
  if (m) {
    const values = parseArrayLiteral(m[1]);
    return { type: 'allowlist', values, sqlSnippet: `${field} @> ARRAY[${values.join(', ')}]` };
  }

  // 3. Overlap: field && ARRAY[...]
  m = sql.match(new RegExp(`${fp}\\s*&&\\s*ARRAY\\[([^\\]]+)\\]`, 'i'));
  if (m) {
    const values = parseArrayLiteral(m[1]);
    return { type: 'allowlist', values, sqlSnippet: `${field} && ARRAY[${values.join(', ')}]` };
  }

  // 4. ANY operator: 'value' = ANY(field)
  m = sql.match(new RegExp(`'([^']+)'\\s*=\\s*ANY\\s*\\(\\s*${fp}\\s*\\)`, 'i'));
  if (m) {
    return { type: 'allowlist', values: [m[1]], sqlSnippet: `'${m[1]}' = ANY(${field})` };
  }

  // 5. Date/timestamp comparison: field <= 'date-string' or field >= 'date-string'
  //    Minimum 8 chars in quoted value to distinguish from short enum strings
  const dateMatches = [...sql.matchAll(
    new RegExp(`${fp}\\s*([<>]=?)\\s*'([^']{8,})'`, 'gi')
  )];
  if (dateMatches.length > 0) {
    const comparisons = dateMatches.map(dm => ({ op: dm[1], val: dm[2] }));
    return {
      type: 'date',
      comparisons,
      sqlSnippet: comparisons.map(c => `${field} ${c.op} '${c.val}'`).join(' AND '),
    };
  }

  // 6. String equality: field = 'value'
  m = sql.match(new RegExp(`${fp}\\s*=\\s*'([^']*)'`, 'i'));
  if (m) {
    return { type: 'equals', value: m[1], sqlSnippet: `${field} = '${m[1]}'` };
  }

  // 7. Boolean equality: field = true / field = false
  m = sql.match(new RegExp(`${fp}\\s*=\\s*(true|false)(?![a-zA-Z0-9_])`, 'i'));
  if (m) {
    return {
      type: 'boolean',
      value: m[1].toLowerCase() === 'true',
      sqlSnippet: `${field} = ${m[1].toLowerCase()}`,
    };
  }

  // 8. Numeric comparison: field >= 1.5, field <= 2.0 (collects all occurrences)
  const numMatches = [...sql.matchAll(
    new RegExp(`${fp}\\s*([<>]=?)\\s*(\\d+(?:\\.\\d+)?)\\b`, 'gi')
  )];
  if (numMatches.length > 0) {
    const comparisons = numMatches.map(nm => ({ op: nm[1], val: parseFloat(nm[2]) }));
    return {
      type: 'numeric',
      comparisons,
      sqlSnippet: comparisons.map(c => `${field} ${c.op} ${c.val}`).join(' AND '),
    };
  }

  // 9. IS NULL only — field is referenced but has no extractable filter value
  if (new RegExp(`${fp}\\s+IS\\s+NULL`, 'i').test(sql)) {
    return { type: 'is_null', sqlSnippet: `${field} IS NULL` };
  }

  return null;
}

// ─── Comparison logic ────────────────────────────────────────────────────────

function isEmpty(v) {
  return v === null || v === undefined || v === '' || v === '{}' || v === 'null';
}

// Compare a parsed SQL condition against the campaign field's actual value.
// Returns: { campaignValue: string, sqlValue: string, match: true|false|null }
function compareSQLToCampaign(field, condition, campaign) {
  const rawValue = campaign[field];
  const empty = isEmpty(rawValue);
  const displayRaw = empty ? 'not set' : String(rawValue);

  switch (condition.type) {

    case 'allowlist': {
      const sqlDisp = `contains: ${condition.values.join(', ')}`;
      if (empty) return { campaignValue: 'not set (any allowed)', sqlValue: sqlDisp, match: null };
      const arr = parsePgArray(String(rawValue)) || [];
      return {
        campaignValue: formatArrayForDisplay(arr),
        sqlValue: sqlDisp,
        match: condition.values.every(v => arr.includes(v)),
      };
    }

    case 'blocklist': {
      const sqlDisp = `not contains: ${condition.values.join(', ')}`;
      if (empty) return { campaignValue: 'not set (none blocked)', sqlValue: sqlDisp, match: null };
      const arr = parsePgArray(String(rawValue)) || [];
      return {
        campaignValue: formatArrayForDisplay(arr),
        sqlValue: sqlDisp,
        match: !condition.values.some(v => arr.includes(v)),
      };
    }

    case 'equals': {
      if (empty) return { campaignValue: 'not set', sqlValue: `= ${condition.value}`, match: false };
      return {
        campaignValue: displayRaw,
        sqlValue: `= ${condition.value}`,
        match: String(rawValue) === condition.value,
      };
    }

    case 'boolean': {
      const campBool = rawValue === true || rawValue === 'true' || rawValue === 't';
      return {
        campaignValue: displayRaw,
        sqlValue: `= ${condition.value}`,
        match: campBool === condition.value,
      };
    }

    case 'numeric': {
      const sqlDisp = condition.comparisons.map(c => `${c.op} ${c.val}`).join(' AND ');
      if (empty) return { campaignValue: 'not set', sqlValue: sqlDisp, match: null };
      const num = parseFloat(rawValue);
      if (isNaN(num)) return { campaignValue: displayRaw, sqlValue: sqlDisp, match: false };
      const match = condition.comparisons.every(c => {
        switch (c.op) {
          case '>=': return num >= c.val;
          case '<=': return num <= c.val;
          case '>':  return num >  c.val;
          case '<':  return num <  c.val;
          default:   return false;
        }
      });
      return { campaignValue: displayRaw, sqlValue: sqlDisp, match };
    }

    case 'date': {
      const sqlDisp = condition.comparisons.map(c => `${c.op} '${c.val}'`).join(' AND ');
      if (empty) return { campaignValue: 'not set', sqlValue: sqlDisp, match: null };
      const campDate = new Date(rawValue);
      if (isNaN(campDate.getTime())) return { campaignValue: displayRaw, sqlValue: sqlDisp, match: false };
      const match = condition.comparisons.every(c => {
        const sqlDate = new Date(c.val);
        switch (c.op) {
          case '>=': return campDate >= sqlDate;
          case '<=': return campDate <= sqlDate;
          case '>':  return campDate >  sqlDate;
          case '<':  return campDate <  sqlDate;
          default:   return false;
        }
      });
      return { campaignValue: String(rawValue), sqlValue: sqlDisp, match };
    }

    case 'is_null': {
      return { campaignValue: displayRaw, sqlValue: 'IS NULL', match: empty };
    }

    default:
      return { campaignValue: displayRaw, sqlValue: '?', match: null };
  }
}

// ─── Main entry points ───────────────────────────────────────────────────────

function analyzeSQLMismatch() {
  const resultsDiv = document.getElementById('sqlAnalysisResults');

  try {
    const campaignJson = document.getElementById('sqlCampaignJson').value.trim();
    const sqlQuery = document.getElementById('sqlQuery').value.trim();

    if (!campaignJson) throw new Error('Please enter campaign data');
    if (!sqlQuery) throw new Error('Please enter SQL query');

    let campaign;
    try {
      campaign = JSON.parse(campaignJson);
      if (Array.isArray(campaign)) campaign = campaign[0];
    } catch (err) {
      throw new Error('Invalid campaign JSON: ' + err.message);
    }

    const conditions = parseFilteringSQL(sqlQuery);
    if (conditions.length === 0) {
      resultsDiv.innerHTML = '<div class="status info">No recognizable campaign field conditions found in SQL. Ensure field names match bid_entities column names.</div>';
      return;
    }

    const results = conditions.map(({ field, ...cond }) => {
      const cmp = compareSQLToCampaign(field, cond, campaign);
      return { field, campaignValue: cmp.campaignValue, sqlValue: cmp.sqlValue, match: cmp.match };
    });

    displaySQLResults(results);
    showStatus('success', '✓ Analysis complete');

  } catch (err) {
    showStatus('error', 'Error: ' + err.message);
    resultsDiv.innerHTML = `<div class="status error">Error: ${err.message}</div>`;
  }
}

function displaySQLResults(results) {
  const container = document.getElementById('sqlAnalysisResults');

  let html = '<div style="overflow-x: auto;"><table class="validation-table">';
  html += '<thead><tr><th>Field</th><th>Campaign Value</th><th>SQL Condition</th><th>Match</th></tr></thead><tbody>';

  results.forEach(r => {
    const cls = r.match === null ? 'match-na' : (r.match ? 'match-true' : 'match-false');
    const sym = r.match === null ? '—' : (r.match ? '✓' : '✗');
    html += `<tr>
      <td class="field-name">${r.field}</td>
      <td class="field-value">${r.campaignValue || '—'}</td>
      <td class="field-value">${r.sqlValue || '—'}</td>
      <td class="match-status ${cls}">${sym}</td>
    </tr>`;
  });

  html += '</tbody></table></div>';

  const passed = results.filter(r => r.match === true).length;
  const failed = results.filter(r => r.match === false).length;
  const na     = results.filter(r => r.match === null).length;

  html += `<div class="status info" style="margin-top: 16px;">
    <strong>Summary:</strong> ${passed} passed, ${failed} failed, ${na} N/A (out of ${results.length} total checks)
  </div>`;

  container.innerHTML = html;
}

function loadSQLAnalyzerSample() {
  const campaign = {
    "line_item_id": "100000500",
    "media_type": "DISPLAY",
    "width": "300",
    "height": "250",
    "price": "2.5",
    "price_type": "CPM",
    "currency": "EUR",
    "test_flag": "false",
    "interstitial": "false",
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2025-12-31T23:59:00Z",
    "geo_allowlist": "{CZ.*.*}",
    "postal_code_allowlist": "{CZ.110 00,CZ.120 00}",
    "domain_allowlist": "{example.com,test.cz}",
    "domain_blocklist": "{\"null\"}",
    "supply_source_allowlist": "{Equativ}"
  };

  const sql = `SELECT *
FROM bid_entities li
WHERE
  (li.geo_allowlist IS NULL OR li.geo_allowlist = '{}' OR li.geo_allowlist @> ARRAY['CZ.*.*']::lquery[])
  AND (li.geo_blocklist IS NULL OR li.geo_blocklist = '{}' OR NOT li.geo_blocklist @> ARRAY['CZ.*.*']::lquery[])
  AND (li.postal_code_allowlist IS NULL OR li.postal_code_allowlist = '{}' OR li.postal_code_allowlist @> ARRAY['CZ.110 00'])
  AND (li.postal_code_blocklist IS NULL OR li.postal_code_blocklist = '{}' OR NOT li.postal_code_blocklist @> ARRAY['CZ.110 00'])
  AND li.media_type = 'DISPLAY'
  AND (li.price IS NULL OR li.price <= 3.0)
  AND (li.test_flag = false OR li.test_flag IS NULL)
  AND (li.domain_allowlist IS NULL OR li.domain_allowlist = '{}' OR li.domain_allowlist @> ARRAY['example.com'])
  AND (li.domain_blocklist IS NULL OR li.domain_blocklist = '{}' OR NOT li.domain_blocklist @> ARRAY['example.com'])
  AND li.start_date <= '2025-06-15T10:00:00Z'
  AND li.end_date >= '2025-06-15T10:00:00Z'`;

  document.getElementById('sqlCampaignJson').value = JSON.stringify(campaign, null, 2);
  document.getElementById('sqlQuery').value = sql;
}

function clearSQLAnalyzer() {
  if (confirm('Are you sure you want to clear all inputs?')) {
    document.getElementById('sqlCampaignJson').value = '';
    document.getElementById('sqlQuery').value = '';
    document.getElementById('sqlAnalysisResults').innerHTML = '';
    showStatus('info', 'Inputs cleared');
  }
}
