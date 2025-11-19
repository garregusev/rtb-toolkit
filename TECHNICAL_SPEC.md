# Technical Specification: RTB Bidding Toolkit

## Project Overview
Web-based tool for validating OpenRTB 2.6 bid requests against campaign targeting rules and generating test bid requests from campaign data.

## Technology Stack
- Pure HTML5/CSS3/JavaScript (no frameworks)
- Client-side only (no backend)
- Modular architecture with separate JS files per feature

## File Structure
```
/rtb-toolkit/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── core.js              # Utility functions
    ├── tab1-validator.js    # Bid Request Validator
    ├── tab2-generator.js    # Bid Request Generator
    └── tab3-tests.js        # Automated Tests
```

## Database Schema: `bid_entities` Table

### Core Fields
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | Primary key |
| order_id | integer | NO | Order reference |
| line_item_id | integer | NO | Campaign line item ID |
| creative_id | integer | NO | Creative reference |
| variant_id | integer | NO | Creative variant |
| business_rule_id | integer | NO | Business rule reference |
| agency_id | integer | NO | Agency reference |
| advertiser_id | integer | NO | Advertiser reference |
| company_id | integer | NO | Company reference |

### Campaign Configuration
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| media_type | enum | YES | - | DISPLAY, VIDEO_INSTREAM, VIDEO_OUTSTREAM |
| width | integer | NO | - | Creative width in pixels |
| height | integer | NO | - | Creative height in pixels |
| interstitial | boolean | NO | false | Is interstitial ad |
| price | double precision | YES | - | Bid price |
| price_type | enum | NO | - | CPM, CPV, CPC, CPCV, CPE, CPVS |
| currency | varchar | NO | - | ISO currency code |
| start_date | timestamptz | NO | - | Campaign start |
| end_date | timestamptz | NO | - | Campaign end |
| goal | integer | YES | - | Campaign goal value |
| goal_type | enum | YES | - | impressions, viewable_impressions, clicks, video_complete_views, engagements, video_starts |
| priority | integer | NO | - | Campaign priority (1-16) |
| pacing_type | enum | NO | Evenly | Evenly, ASAP |

### Targeting: Domain & Inventory
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| domain_allowlist | varchar[] | YES | Allowed domains |
| domain_blocklist | varchar[] | YES | Blocked domains |
| inventory_type_allowlist | varchar[] | YES | WEB, MOBILE_APP |
| inventory_type_blocklist | varchar[] | YES | Blocked inventory types |
| site_id_allowlist | integer[] | YES | Allowed site IDs |
| site_id_blocklist | integer[] | YES | Blocked site IDs |
| site_name_allowlist | varchar[] | YES | Allowed site names |
| site_name_blocklist | varchar[] | YES | Blocked site names |
| publisher_id_allowlist | integer[] | YES | Allowed publisher IDs |
| publisher_id_blocklist | integer[] | YES | Blocked publisher IDs |
| publisher_name_allowlist | varchar[] | YES | Allowed publisher names |
| publisher_name_blocklist | varchar[] | YES | Blocked publisher names |
| ad_unit_id_allowlist | bigint[] | YES | Allowed ad unit IDs (tagid) |
| ad_unit_id_blocklist | bigint[] | YES | Blocked ad unit IDs |

### Targeting: Device & OS
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| os_allowlist | lquery[] | YES | OS patterns (lquery type) |
| os_blocklist | lquery[] | YES | Blocked OS patterns |
| browser_allowlist | lquery[] | YES | Browser UA patterns |
| browser_blocklist | lquery[] | YES | Blocked browser patterns |
| device_allowlist | lquery[] | YES | Device make/model patterns |
| device_blocklist | lquery[] | YES | Blocked device patterns |
| device_type_allowlist | varchar[] | YES | OpenRTB device types |
| device_type_blocklist | varchar[] | YES | Blocked device types |

### Targeting: Geo & Network
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| geo_allowlist | lquery[] | YES | Country/region patterns |
| geo_blocklist | lquery[] | YES | Blocked geo patterns |
| postal_code_allowlist | varchar[] | YES | Allowed postal codes |
| postal_code_blocklist | varchar[] | YES | Blocked postal codes |
| connection_type_allowlist | integer[] | YES | OpenRTB connection types |
| connection_type_blocklist | integer[] | YES | Blocked connection types |
| isp_allowlist | varchar[] | YES | Allowed ISPs |
| isp_blocklist | varchar[] | YES | Blocked ISPs |
| ip_allowlist | inetmultirange | YES | Allowed IP ranges |
| ip_blocklist | inetmultirange | YES | Blocked IP ranges |

### Targeting: Language & Supply
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| browser_language_allowlist | varchar[] | YES | Allowed languages (ISO codes) |
| browser_language_blocklist | varchar[] | YES | Blocked languages |
| supply_source_allowlist | varchar[] | YES | Allowed supply sources |
| supply_source_blocklist | varchar[] | YES | Blocked supply sources |
| iab_categories | varchar[] | YES | IAB content categories |

### Video-Specific Fields
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| duration | integer | YES | Video duration in seconds |
| is_skippable | boolean | YES | Is video skippable |
| protocols | integer[] | YES | OpenRTB video protocols |
| playback_methods | integer[] | YES | OpenRTB playback methods |
| mime_types | varchar[] | YES | Supported MIME types |
| api_frameworks | integer[] | YES | OpenRTB API frameworks |

### Deal Fields
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| deal_id | integer | YES | Deal reference ID |
| deal_code | varchar | YES | Deal identifier |
| deal_name | varchar | YES | Deal name |
| deal_ask_price | numeric | YES | Deal floor price |
| deal_currency | varchar | YES | Deal currency |
| deal_auction_type | enum | YES | FIRST_PRICE, FIXED_PRICE, NONE |

### Other Fields
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| ad_unit_ratio_blocklist | bigint[] | YES | Blocked aspect ratios |
| delivery_schedule_allowlist | delivery_schedule[] | YES | Allowed time schedules |
| delivery_schedule_blocklist | delivery_schedule[] | YES | Blocked time schedules |
| test_flag | boolean | NO | Is test campaign |
| advertiser_domains | varchar[] | YES | Advertiser domains |
| advertiser_name | text | NO | Advertiser name |

### Enums
```sql
-- media_type
DISPLAY
VIDEO_INSTREAM
VIDEO_OUTSTREAM

-- pacing_type
Evenly
ASAP

-- price_type
CPM
CPV
CPC
CPCV
CPE
CPVS

-- goal_type
impressions
viewable_impressions
clicks
video_complete_views
engagements
video_starts

-- auction_type
FIRST_PRICE
FIXED_PRICE
NONE
```

### PostgreSQL Array Format
Arrays are stored as PostgreSQL arrays in format: `{value1,value2,value3}`
- Empty: `{}`
- Null: `""` or `null`
- With escaping: `{\"value1\",\"value2\"}`

### Special Types
- **lquery**: PostgreSQL ltree query type for pattern matching (used for OS, browser, device, geo)
- **inetmultirange**: PostgreSQL multirange of inet types for IP ranges

## Feature 1: Bid Request Validator

### Input
- Campaign JSON (single object or array with one object from `bid_entities` table)
- Bid Request JSON (OpenRTB 2.6 format)

### Processing
Validates 35+ targeting rules:
1. media_type
2. width
3. height
4. interstitial
5. price vs bidfloor
6. currency
7. date_range
8. domain (allowlist/blocklist)
9. inventory_type (allowlist/blocklist)
10. supply_source (allowlist/blocklist)
11. postal_code (allowlist/blocklist)
12. iab_categories
13. site_id (allowlist/blocklist)
14. site_name (allowlist/blocklist)
15. publisher_id (allowlist/blocklist)
16. publisher_name (allowlist/blocklist)
17. ad_unit_id/tagid (allowlist/blocklist)
18. os (allowlist/blocklist with pattern matching)
19. browser/UA (allowlist/blocklist with pattern matching)
20. device make/model (allowlist/blocklist with pattern matching)
21. device_type (allowlist/blocklist)
22. connection_type (allowlist/blocklist)
23. language (allowlist/blocklist)
24. geo/country (allowlist/blocklist with pattern matching)
25. isp (allowlist/blocklist)
26. ip_address (allowlist/blocklist - display only)
27. delivery_schedule (allowlist/blocklist - display only)
28. deal_code
29. mime_types
30. api_frameworks
31. protocols (video)
32. playback_methods (video)
33. duration (video)
34. is_skippable (video)
35. ad_unit_ratio (blocklist)

### Output
HTML table with columns:
- **Field**: Targeting parameter name
- **Campaign Value**: Value/rules from campaign (with full array display)
- **Bid Request Value**: Actual value from bid request
- **Match**: ✓ (pass), ✗ (fail), or — (N/A)

**Sorting**: Failed checks first → Passed checks → N/A checks

**Summary**: Count of passed/failed/N/A checks

### Key Logic
- **Allowlist**: Value must be IN the list to pass
- **Blocklist**: Value must NOT be in the list to pass
- **NULL/empty campaign field**: Treated as "any allowed" (N/A match)
- **Multiple impressions**: ANY impression matching = pass
- **Pattern matching** (lquery fields): Simple substring/prefix matching for OS, browser, device, geo

## Feature 2: Bid Request Generator

### Input
- Campaign JSON (from `bid_entities` table)

### Output
- Valid OpenRTB 2.6 Bid Request JSON that MATCHES the campaign targeting

### Logic
1. **Use first value from allowlists** for all fields
2. **Set bidfloor slightly below campaign price** (0.8x) to ensure match
3. **Build impression based on media_type**:
   - DISPLAY → banner object with w/h
   - VIDEO_INSTREAM → video object with placement=1, linearity=1
   - VIDEO_OUTSTREAM → video object with placement=3, linearity=2
4. **Build site OR app** based on inventory_type_allowlist
5. **Add all available targeting values** from allowlists
6. **Include deal if deal_code exists**

### Generated Structure
```json
{
  "id": "test-{timestamp}-{random}",
  "imp": [{
    "id": "1",
    "tagid": "{from ad_unit_id_allowlist[0]}",
    "banner/video": {...},
    "bidfloor": {campaign.price * 0.8},
    "bidfloorcur": "{campaign.currency}",
    "instl": {0 or 1},
    "secure": 1,
    "pmp": {...} // if deal exists
  }],
  "site/app": {
    "id": "{from site_id_allowlist[0]}",
    "domain/bundle": "{from domain_allowlist[0]}",
    "publisher": {
      "id": "{from publisher_id_allowlist[0]}"
    },
    "cat": [...] // iab_categories if set
  },
  "device": {
    "ua": "Mozilla/5.0...",
    "ip": "192.168.1.100",
    "os": "{from os_allowlist[0]}",
    "devicetype": {from device_type_allowlist[0]},
    "language": "{from browser_language_allowlist[0]}",
    "connectiontype": {from connection_type_allowlist[0]},
    "geo": {
      "country": "{from geo_allowlist[0]}",
      "zip": "{from postal_code_allowlist[0]}"
    }
  },
  "source": {
    "ext": {
      "supply_source": "{from supply_source_allowlist[0]}"
    }
  },
  "cur": ["{campaign.currency}"],
  "at": 1
}
```

## Feature 3: Automated Tests

### Test Categories
1. **Core Utilities** (8 tests)
   - PostgreSQL array parsing (simple, empty, null, complex)
   - Boolean parsing
   - Nested value extraction
   - Array formatting
   
2. **Validation Logic** (8 tests)
   - Media type validation
   - Width/height matching
   - Currency validation
   - Domain allowlist (match/no match)
   - Postal code validation
   - Interstitial validation
   
3. **Generator Logic** (7 tests)
   - Basic bid request generation
   - Video bid request
   - Site generation
   - App generation
   - Deal generation
   - Full validation flow

### Output
- Console log of all test results
- Summary: X passed, Y failed out of Z total
- Visual indicators: ✓ (pass) / ✗ (fail)

## Key Implementation Details

### PostgreSQL Array Parser
```javascript
function parsePgArray(pgArrayString) {
  // Handles: {val1,val2}, {}, "", null
  // Handles escaping: {\"val1\",\"val2\"}
  // Returns: ['val1', 'val2'] or null
}
```

### Pattern Matching (for lquery fields)
```javascript
// Simple substring/prefix matching
os.toLowerCase().includes(pattern.toLowerCase())
country.startsWith(pattern) || pattern.startsWith(country)
```

### Array Display Formatting
```javascript
// Show first 10 items, then "... +N more"
formatArrayForDisplay(arr, maxItems = 10)
```

## UI Requirements

### Design
- Clean, professional look
- Gradient purple header
- Tab-based navigation
- Responsive (mobile-friendly)
- Monospace fonts for JSON/code
- Color coding:
  - Green (✓): Passed checks
  - Red (✗): Failed checks
  - Gray (—): N/A checks

### User Flow
1. Load page → Auto-run tests
2. Tab 1 loads with sample data
3. User pastes campaign + bid request → Click "Validate"
4. Results table appears with sorting (failed → passed → N/A)
5. Summary shows pass/fail counts

## Sample Data

### Sample Campaign (for testing)
```json
{
  "line_item_id": "100000318",
  "media_type": "DISPLAY",
  "width": "320",
  "height": "480",
  "price": "2",
  "currency": "EUR",
  "interstitial": "false",
  "start_date": "2025-11-13T03:00:00Z",
  "end_date": "2025-11-25T20:59:00Z",
  "postal_code_allowlist": "{26100,36022,40017}",
  "inventory_type_allowlist": "{WEB}",
  "domain_allowlist": "{ansa.it,repubblica.it}",
  "supply_source_allowlist": "{VIS.X,Equativ}",
  "domain_blocklist": "{\"null\"}"
}
```

### Sample Bid Request (for testing)
```json
{
  "id": "test-123",
  "cur": ["EUR"],
  "imp": [{
    "id": "1",
    "banner": {"w": 320, "h": 480},
    "bidfloor": 1.5,
    "instl": 0,
    "secure": 1
  }],
  "site": {
    "id": "123",
    "domain": "ansa.it",
    "publisher": {"id": "456"}
  },
  "device": {
    "os": "Android",
    "devicetype": 1,
    "language": "it",
    "geo": {"country": "IT", "zip": "26100"}
  },
  "source": {
    "ext": {"supply_source": "VIS.X"}
  }
}
```

## Current Status

### Completed Files
- ✅ `index.html` - Main page structure with 3 tabs
- ✅ `css/style.css` - Complete styling
- ✅ `js/core.js` - All utility functions including improved PG array parser
- ✅ `js/tab1-validator.js` - Full validation with 35 checks, sorting, formatting

### Pending Files
- ⏳ `js/tab2-generator.js` - Bid request generator from campaign
- ⏳ `js/tab3-tests.js` - Automated test suite

### Known Issues & Requirements
1. All files must use the improved `parsePgArray()` function from `core.js`
2. Generator must create bid requests that PASS validation for the input campaign
3. All array fields must display full values (not "3 codes") using `formatArrayForDisplay()`
4. Test suite must validate both validator and generator functionality

## Development Notes

### User is located in
- Berlin, Germany
- Russian speaker
- Prefers concise responses without excessive praise
- Works with programmatic advertising (DSP/RTB systems)

### Communication Preferences
- Short, direct answers
- No repetition of context
- Ask questions before long coding sessions
- Provide code in compact format when possible
