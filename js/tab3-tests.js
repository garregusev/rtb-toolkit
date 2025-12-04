// Tab 3: Automated Tests

const testResults = [];

function runAllTests() {
  testResults.length = 0;
  console.log('\n========== RUNNING ALL TESTS ==========\n');

  // Category 1: Core Utilities (8 tests)
  runCoreUtilityTests();

  // Category 2: Validation Logic (8 tests)
  runValidationTests();

  // Category 3: Generator Logic (7 tests)
  runGeneratorTests();

  // Category 4: SQL Analyzer Logic (5 tests)
  runSQLAnalyzerTests();

  // Display results
  displayTestResults();

  // Summary
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  const total = testResults.length;

  console.log(`\n========== SUMMARY ==========`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Total: ${total}`);
  console.log('==============================\n');
}

// ========== CATEGORY 1: CORE UTILITIES ==========

function runCoreUtilityTests() {
  console.log('--- Category 1: Core Utilities ---\n');

  // Test 1: Parse simple PG array
  test('Parse simple PG array', () => {
    const result = parsePgArray('{value1,value2,value3}');
    return JSON.stringify(result) === JSON.stringify(['value1', 'value2', 'value3']);
  });

  // Test 2: Parse empty PG array
  test('Parse empty PG array', () => {
    const result = parsePgArray('{}');
    return Array.isArray(result) && result.length === 0;
  });

  // Test 3: Parse null PG array
  test('Parse null PG array', () => {
    const result1 = parsePgArray('');
    const result2 = parsePgArray('null');
    const result3 = parsePgArray('""');
    return result1 === null && result2 === null && result3 === null;
  });

  // Test 4: Parse complex PG array with escaping
  test('Parse PG array with quotes', () => {
    const result = parsePgArray('{"null"}');
    return JSON.stringify(result) === JSON.stringify(['null']);
  });

  // Test 5: Boolean parsing - true values
  test('Parse boolean true values', () => {
    return parseBoolean('true') === true &&
           parseBoolean('t') === true &&
           parseBoolean('1') === true &&
           parseBoolean(true) === true;
  });

  // Test 6: Boolean parsing - false values
  test('Parse boolean false values', () => {
    return parseBoolean('false') === false &&
           parseBoolean('f') === false &&
           parseBoolean('0') === false &&
           parseBoolean(false) === false;
  });

  // Test 7: Nested value extraction
  test('Extract nested object values', () => {
    const obj = { device: { geo: { country: 'US' } } };
    return getNestedValue(obj, 'device.geo.country') === 'US';
  });

  // Test 8: Array formatting
  test('Format array for display', () => {
    const arr = ['a', 'b', 'c'];
    const result = formatArrayForDisplay(arr, 10);
    return result === '[a, b, c]';
  });

  console.log('');
}

// ========== CATEGORY 2: VALIDATION LOGIC ==========

function runValidationTests() {
  console.log('--- Category 2: Validation Logic ---\n');

  // Test 9: Media type validation - match
  test('Validate media type - DISPLAY match', () => {
    const campaign = { media_type: 'DISPLAY' };
    const bidRequest = { imp: [{ banner: { w: 300, h: 250 } }] };
    const result = validateMediaType(campaign, bidRequest);
    return result.match === true;
  });

  // Test 10: Width validation - match
  test('Validate width - match', () => {
    const campaign = { width: '320' };
    const bidRequest = { imp: [{ banner: { w: 320, h: 480 } }] };
    const result = validateWidth(campaign, bidRequest);
    return result.match === true;
  });

  // Test 11: Height validation - match
  test('Validate height - match', () => {
    const campaign = { height: '480' };
    const bidRequest = { imp: [{ banner: { w: 320, h: 480 } }] };
    const result = validateHeight(campaign, bidRequest);
    return result.match === true;
  });

  // Test 12: Currency validation - match
  test('Validate currency - match', () => {
    const campaign = { currency: 'EUR' };
    const bidRequest = { cur: ['EUR'] };
    const result = validateCurrency(campaign, bidRequest);
    return result.match === true;
  });

  // Test 13: Domain allowlist - match
  test('Validate domain allowlist - match', () => {
    const campaign = { domain_allowlist: '{example.com,test.com}' };
    const bidRequest = { site: { domain: 'example.com' } };
    const result = validateDomain(campaign, bidRequest);
    return result.match === true;
  });

  // Test 14: Domain allowlist - no match
  test('Validate domain allowlist - no match', () => {
    const campaign = { domain_allowlist: '{example.com,test.com}' };
    const bidRequest = { site: { domain: 'other.com' } };
    const result = validateDomain(campaign, bidRequest);
    return result.match === false;
  });

  // Test 15: Postal code validation
  test('Validate postal code - match', () => {
    const campaign = { postal_code_allowlist: '{26100,36022,40017}' };
    const bidRequest = { device: { geo: { zip: '26100' } } };
    const result = validatePostalCode(campaign, bidRequest);
    return result.match === true;
  });

  // Test 16: Interstitial validation
  test('Validate interstitial - match', () => {
    const campaign = { interstitial: 'false' };
    const bidRequest = { imp: [{ instl: 0 }] };
    const result = validateInterstitial(campaign, bidRequest);
    return result.match === true;
  });

  console.log('');
}

// ========== CATEGORY 3: GENERATOR LOGIC ==========

function runGeneratorTests() {
  console.log('--- Category 3: Generator Logic ---\n');

  // Test 17: Generate basic DISPLAY bid request
  test('Generate DISPLAY bid request', () => {
    const campaign = {
      media_type: 'DISPLAY',
      width: '300',
      height: '250',
      price: '2.5',
      currency: 'USD',
      domain_allowlist: '{example.com}'
    };
    const bidRequest = buildBidRequestFromCampaign(campaign);
    return bidRequest.imp[0].banner &&
           bidRequest.imp[0].banner.w === 300 &&
           bidRequest.imp[0].banner.h === 250 &&
           bidRequest.cur[0] === 'USD';
  });

  // Test 18: Generate VIDEO_INSTREAM bid request
  test('Generate VIDEO_INSTREAM bid request', () => {
    const campaign = {
      media_type: 'VIDEO_INSTREAM',
      width: '640',
      height: '480',
      price: '5',
      currency: 'EUR'
    };
    const bidRequest = buildBidRequestFromCampaign(campaign);
    return bidRequest.imp[0].video &&
           bidRequest.imp[0].video.placement === 1 &&
           bidRequest.imp[0].video.linearity === 1;
  });

  // Test 19: Generate site object
  test('Generate site object with all fields', () => {
    const campaign = {
      media_type: 'DISPLAY',
      width: '300',
      height: '250',
      inventory_type_allowlist: '{WEB}',
      domain_allowlist: '{example.com}',
      site_id_allowlist: '{123}',
      publisher_id_allowlist: '{456}'
    };
    const bidRequest = buildBidRequestFromCampaign(campaign);
    return bidRequest.site &&
           bidRequest.site.domain === 'example.com' &&
           bidRequest.site.id === '123' &&
           bidRequest.site.publisher.id === '456';
  });

  // Test 20: Generate app object
  test('Generate app object', () => {
    const campaign = {
      media_type: 'DISPLAY',
      width: '300',
      height: '250',
      inventory_type_allowlist: '{MOBILE_APP}',
      domain_allowlist: '{com.example.app}'
    };
    const bidRequest = buildBidRequestFromCampaign(campaign);
    return bidRequest.app &&
           bidRequest.app.bundle === 'com.example.app';
  });

  // Test 21: Generate bid request with deal
  test('Generate bid request with deal', () => {
    const campaign = {
      media_type: 'DISPLAY',
      width: '300',
      height: '250',
      deal_code: 'DEAL-123'
    };
    const bidRequest = buildBidRequestFromCampaign(campaign);
    return bidRequest.imp[0].pmp &&
           bidRequest.imp[0].pmp.deals[0].id === 'DEAL-123';
  });

  // Test 22: Bidfloor is 5% of campaign price
  test('Bidfloor is 5% of campaign price', () => {
    const campaign = {
      media_type: 'DISPLAY',
      width: '300',
      height: '250',
      price: '2.5',
      currency: 'USD'
    };
    const bidRequest = buildBidRequestFromCampaign(campaign);
    const expectedBidfloor = 0.125; // 2.5 * 0.05
    return bidRequest.imp[0].bidfloor === expectedBidfloor;
  });

  // Test 23: Generated bid request passes validation
  test('Generated bid request passes validation', () => {
    const campaign = {
      line_item_id: '100000318',
      media_type: 'DISPLAY',
      width: '320',
      height: '480',
      price: '2',
      currency: 'EUR',
      interstitial: 'false',
      start_date: '2020-01-01T00:00:00Z',
      end_date: '2030-12-31T23:59:59Z',
      postal_code_allowlist: '{26100,36022,40017}',
      inventory_type_allowlist: '{WEB}',
      domain_allowlist: '{example.com}',
      supply_source_allowlist: '{VIS.X}'
    };

    const bidRequest = buildBidRequestFromCampaign(campaign);
    const results = performValidation(campaign, bidRequest);
    const failed = results.filter(r => r.match === false);

    return failed.length === 0;
  });

  console.log('');
}

// ========== CATEGORY 4: SQL ANALYZER LOGIC ==========

function runSQLAnalyzerTests() {
  console.log('--- Category 4: SQL Analyzer Logic ---\n');

  // Test 24: Markdown headers conversion
  test('Convert markdown headers to HTML', () => {
    const markdown = '## Heading 2\n### Heading 3';
    const tempDiv = document.createElement('div');
    tempDiv.id = 'sqlAnalysisResults';
    document.body.appendChild(tempDiv);

    displayAnalysisResults(markdown);
    const html = tempDiv.innerHTML;

    document.body.removeChild(tempDiv);
    return html.includes('<h2>Heading 2</h2>') && html.includes('<h3>Heading 3</h3>');
  });

  // Test 25: Markdown bold text conversion
  test('Convert markdown bold to HTML', () => {
    const markdown = 'This is **bold text** here';
    const tempDiv = document.createElement('div');
    tempDiv.id = 'sqlAnalysisResults';
    document.body.appendChild(tempDiv);

    displayAnalysisResults(markdown);
    const html = tempDiv.innerHTML;

    document.body.removeChild(tempDiv);
    return html.includes('<strong>bold text</strong>');
  });

  // Test 26: Markdown inline code conversion
  test('Convert markdown inline code to HTML', () => {
    const markdown = 'Use `SELECT * FROM table` query';
    const tempDiv = document.createElement('div');
    tempDiv.id = 'sqlAnalysisResults';
    document.body.appendChild(tempDiv);

    displayAnalysisResults(markdown);
    const html = tempDiv.innerHTML;

    document.body.removeChild(tempDiv);
    return html.includes('<code>SELECT * FROM table</code>');
  });

  // Test 27: Markdown code block conversion
  test('Convert markdown code blocks to HTML', () => {
    const markdown = '```sql\nSELECT * FROM bid_entities\n```';
    const tempDiv = document.createElement('div');
    tempDiv.id = 'sqlAnalysisResults';
    document.body.appendChild(tempDiv);

    displayAnalysisResults(markdown);
    const html = tempDiv.innerHTML;

    document.body.removeChild(tempDiv);
    return html.includes('<pre><code>') && html.includes('SELECT * FROM bid_entities');
  });

  // Test 28: Results wrapped in analysis-result div
  test('Results wrapped in analysis-result div', () => {
    const markdown = 'Test content';
    const tempDiv = document.createElement('div');
    tempDiv.id = 'sqlAnalysisResults';
    document.body.appendChild(tempDiv);

    displayAnalysisResults(markdown);
    const html = tempDiv.innerHTML;

    document.body.removeChild(tempDiv);
    return html.includes('class="analysis-result"');
  });

  console.log('');
}

// ========== TEST HELPER FUNCTIONS ==========

function test(name, testFn) {
  try {
    const passed = testFn();
    testResults.push({ name, passed });

    const symbol = passed ? '✓' : '✗';
    const color = passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${color}${symbol}${reset} ${name}`);

    return passed;
  } catch (err) {
    testResults.push({ name, passed: false, error: err.message });
    console.log(`\x1b[31m✗\x1b[0m ${name} - Error: ${err.message}`);
    return false;
  }
}

function displayTestResults() {
  // Results are only shown in console now
  // No UI container needed
}
