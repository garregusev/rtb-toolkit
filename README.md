# RTB Bidding Toolkit

A web-based tool for validating and generating OpenRTB 2.6 bid requests for programmatic advertising campaigns.

## What is this?

The RTB Bidding Toolkit helps programmatic advertising teams test and debug campaign targeting by:
- **Validating** bid requests against campaign targeting rules
- **Generating** test bid requests from campaign configurations
- Supporting PostgreSQL `bid_entities` table format

Perfect for DSP developers, campaign managers, and QA teams working with real-time bidding.

## Features

### 📊 Bid Request Validator
Compare a campaign's targeting rules against an actual bid request to see what matches and what doesn't.

**What it checks (36 validation rules):**
- Media type, dimensions, interstitial
- Price vs bidfloor, currency
- Domain, inventory type, supply source
- Device type, OS, browser, connection type
- Geo-targeting, postal codes, language
- IAB categories, site/publisher IDs
- Video-specific: protocols, playback methods, duration
- Deal codes and private marketplace

**Output:**
- Color-coded table (✓ pass, ✗ fail, — N/A)
- Automatic sorting: failed checks first
- Summary statistics
- IAB code names displayed (e.g., "4 (Phone)" instead of just "4")

### 🔄 Bid Request Generator
Automatically generate valid OpenRTB 2.6 bid requests from campaign data.

**What it does:**
- Reads campaign targeting from PostgreSQL JSON
- Creates matching bid request with all required fields
- Includes supply chain (schain), GDPR consent, geo data
- Sets bidfloor at 5% of campaign price
- Handles ltree patterns (`{DE.*.*}` → `DE`)
- Converts device type strings to codes (`Phone` → 4)

**Output:**
- Valid OpenRTB 2.6 JSON
- Copy to clipboard button
- Passes validation when tested against input campaign

### ✅ Automated Tests
23 automated tests run on page load (check browser console):
- Core utility functions
- Validation logic
- Generator logic
- Full end-to-end workflows

## Quick Start

1. **Open `index.html`** in your browser (no server required)
2. **Choose a tab:**
   - `#validator` - Validate bid requests
   - `#generator` - Generate bid requests

Currently the project is hosted via Github Pages here: https://garregusev.github.io/rtb-toolkit/

### Using the Validator

1. Paste your campaign JSON (from `bid_entities` table):
   - It is a query like `select * from bid_entities where ...`
   - Each query should select **only one bid entity**
3. Paste the bid request JSON you want to validate
4. Click **"Validate Bid Request"**
5. Review the results table:
   - Red ✗ = Failed targeting check
   - Green ✓ = Passed targeting check
   - Gray — = Not applicable (no targeting rule set)

### Using the Generator

1. Paste your campaign JSON (from `bid_entities` table)
2. Click **"Generate Bid Request"**
3. Copy the generated bid request
4. Test it against DSP endpoints or use in the validator

## Input Format

### Campaign JSON
Export from your `bid_entities` PostgreSQL table. Example:

```json
{
  "line_item_id": "100000334",
  "media_type": "DISPLAY",
  "width": "320",
  "height": "480",
  "price": "3.5",
  "currency": "EUR",
  "test_flag": "false",
  "start_date": "2025-11-20T00:00:00Z",
  "end_date": "2025-12-31T23:59:00Z",
  "inventory_type_allowlist": "{WEB}",
  "domain_allowlist": "{yle.fi,iltalehti.fi}",
  "geo_allowlist": "{FI.*.*}",
  "device_type_allowlist": "{Phone,Tablet}",
  "supply_source_allowlist": "{Equativ}",
  "browser_language_allowlist": "{fi,sv}",
  "postal_code_allowlist": "{00100,00500}"
}
```

**PostgreSQL array format:**
- Arrays: `{value1,value2,value3}`
- Empty: `{}`
- Null: `""` or `null`
- Escaped: `{\"value1\",\"value2\"}`

**ltree/lquery patterns:**
- `{DE.*.*}` - Germany (any region, any city)
- `{Android.*}` - Android (any version)
- `{Samsung.*}` - Samsung (any model)

### Bid Request JSON
Standard OpenRTB 2.6 format:

```json
{
  "id": "test-123",
  "test": 0,
  "cur": ["EUR"],
  "imp": [{
    "id": "1",
    "banner": {"w": 320, "h": 480},
    "bidfloor": 0.175,
    "instl": 0
  }],
  "site": {
    "domain": "yle.fi",
    "publisher": {"id": "pub-456"}
  },
  "device": {
    "os": "iOS",
    "devicetype": 4,
    "language": "fi",
    "geo": {"country": "FI", "zip": "00100"}
  },
  "source": {
    "ext": {"supply_source": "Equativ"}
  }
}
```

## Understanding the Results

### Validation Table Columns

| Column | Description |
|--------|-------------|
| **Field** | Targeting parameter being checked |
| **Campaign Value** | The targeting rule from your campaign |
| **Bid Request Value** | The actual value from the bid request |
| **Match** | ✓ = pass, ✗ = fail, — = N/A |

### Result Sorting
Results are automatically sorted to show problems first:
1. Failed checks (✗) - **Fix these first!**
2. Passed checks (✓) - Working correctly
3. N/A checks (—) - No targeting rule set

### IAB Code Display
The toolkit shows human-readable names for IAB codes:
- Device type: `4 (Phone)`, `5 (Tablet)`, `2 (PC)`
- Connection: `2 (WiFi)`, `6 (Cellular 4G)`
- API frameworks: `3 (MRAID-1)`, `5 (MRAID-2)`
- Protocols: `2 (VAST 2.0)`, `3 (VAST 3.0)`
- Playback: `1 (Auto-play, Sound On)`, `3 (Click-to-play)`

## Special Features

### URL Routing
Direct link to specific tabs:
- `http://localhost/rtb-toolkit/#validator` - Validator tab
- `http://localhost/rtb-toolkit/#generator` - Generator tab

Supports browser back/forward navigation.

### Device Type Matching
The validator intelligently matches device types:
- Campaign allowlist: `{Phone,Tablet}` (strings)
- Bid request: `"devicetype": 4` (numeric code)
- Result: ✓ Match (Phone = 4)

### Ltree Pattern Parsing
PostgreSQL ltree patterns are automatically parsed:
- Campaign: `geo_allowlist: "{DE.*.*}"`
- Generated bid request: `"country": "DE"`
- Validation: ✓ Match

### test_flag Logic
The `test_flag` uses inverted logic per OpenRTB spec:
- Campaign: `test_flag: false` → Bid request: `test: 0` (production)
- Campaign: `test_flag: true` → Bid request: `test: 1` (test mode)

### Bidfloor Calculation
Generator sets bidfloor at 5% of campaign price:
- Campaign price: €3.50
- Generated bidfloor: €0.175 (5%)
- This ensures the bid request passes price validation

## Technical Details

### Browser Requirements
- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript ES6+ support
- No plugins or extensions required

### No Backend Required
- Pure client-side HTML/CSS/JavaScript
- No server, database, or API calls
- All processing happens in your browser
- Data never leaves your machine

### File Structure
```
/rtb-toolkit/
├── index.html              # Main page
├── css/
│   └── style.css          # Styling
└── js/
    ├── core.js            # Utilities & IAB dictionaries
    ├── tab1-validator.js  # Validation logic
    ├── tab2-generator.js  # Generation logic
    └── tab3-tests.js      # Test suite
```

### IAB OpenRTB 2.6 Compliance
Full support for:
- Device types (1-7)
- Connection types (0-7)
- API frameworks (VPAID, MRAID, OMID)
- Video protocols (VAST 1.0-4.2, DAAST)
- Playback methods (1-6)
- Supply chain object (schain)
- IAB TCF v2.2 consent strings
- Complete geo, user, regs objects

## Common Use Cases

### 1. Debug Why Campaign Isn't Bidding
**Scenario:** Campaign not receiving bid requests

1. Get a sample bid request from your SSP
2. Export campaign config from database
3. Run validation
4. Fix any failed targeting rules (✗)

### 2. Test New Campaign Before Launch
**Scenario:** Want to verify targeting setup

1. Export new campaign from database
2. Generate test bid request
3. Send to DSP endpoint or QA environment
4. Verify bidding behavior

### 3. Create Test Data for QA
**Scenario:** Need realistic bid requests for testing

1. Use existing campaign as template
2. Generate bid request
3. Modify as needed (change device, geo, etc.)
4. Use in automated tests

### 4. Validate DSP Integration
**Scenario:** Integrating with new DSP

1. Generate bid requests with various targeting
2. Send to DSP test endpoint
3. Verify DSP accepts all required fields
4. Check bid responses match expectations

## Troubleshooting

### "Validation completed but all N/A"
- Your campaign has no targeting rules set
- Check that allowlist/blocklist fields contain values
- Verify PostgreSQL array format: `{value1,value2}`

### "Device type not matching"
- Check format: campaign uses strings (`Phone`) or codes (`4`)
- Both formats supported in allowlists
- Generator converts strings to codes automatically

### "Geo not matching"
- Campaign uses ltree patterns: `{DE.*.*}`
- Bid request needs base value: `"country": "DE"`
- Generator extracts base values automatically

### "Bidfloor failing"
- Campaign price must be ≥ bid request bidfloor
- Generator sets bidfloor at 5% of price
- Manually adjust if using custom bid request

### "JSON parse error"
- Check for trailing commas in JSON
- Verify quotes are properly escaped
- Use JSON validator (jsonlint.com)

## Contributing

This is a standalone tool with no external dependencies. To modify:

1. Edit HTML/CSS/JS files directly
2. Open `index.html` in browser to test
3. Check console for test results (23 tests should pass)

## License

Open source tool for internal use in programmatic advertising.

## Support

For issues or questions:
- Check TECHNICAL_SPEC.md for implementation details
- Review browser console for error messages
- Verify input JSON format matches examples
- Test with provided sample data first

---

**Version:** 1.0
**Last Updated:** November 2025
**OpenRTB Version:** 2.6
**IAB TCF Version:** 2.2
