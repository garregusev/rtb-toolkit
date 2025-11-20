# Technical Specification: RTB Bidding Toolkit

## Project Overview
Web-based tool for validating OpenRTB 2.6 bid requests against campaign targeting rules and generating test bid requests from campaign data.

## Technology Stack
- Pure HTML5/CSS3/JavaScript (no frameworks)
- Client-side only (no backend)
- Modular architecture with separate JS files per feature
- IAB OpenRTB 2.6 compliant

## File Structure
```
/rtb-toolkit/
├── index.html              # Main page with tab navigation
├── css/
│   └── style.css          # Styling and responsive design
└── js/
    ├── core.js            # Utility functions and IAB dictionaries
    ├── tab1-validator.js  # Bid Request Validator
    ├── tab2-generator.js  # Bid Request Generator
    └── tab3-tests.js      # Automated Tests (console only)
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
| test_flag | boolean | NO | false | Is test campaign (inverted: false → test=0) |

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
| device_type_allowlist | varchar[] | YES | OpenRTB device types (strings or codes) |
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
- **lquery**: PostgreSQL ltree query type for pattern matching (e.g., `{DE.*.*}`, `{Android.*}`)
- **inetmultirange**: PostgreSQL multirange of inet types for IP ranges

## IAB OpenRTB 2.6 Reference Dictionaries

The toolkit includes complete IAB reference dictionaries for displaying human-readable names alongside numeric codes:

### Device Type (IAB_DEVICE_TYPE)
| Code | Name |
|------|------|
| 1 | Mobile/Tablet |
| 2 | PC |
| 3 | TV |
| 4 | Phone |
| 5 | Tablet |
| 6 | Connected Device |
| 7 | Set Top Box |

### Connection Type (IAB_CONNECTION_TYPE)
| Code | Name |
|------|------|
| 0 | Unknown |
| 1 | Ethernet |
| 2 | WiFi |
| 3 | Cellular (Unknown) |
| 4 | Cellular 2G |
| 5 | Cellular 3G |
| 6 | Cellular 4G |
| 7 | Cellular 5G |

### API Framework (IAB_API_FRAMEWORK)
| Code | Name |
|------|------|
| 1 | VPAID 1.0 |
| 2 | VPAID 2.0 |
| 3 | MRAID-1 |
| 4 | ORMMA |
| 5 | MRAID-2 |
| 6 | MRAID-3 |
| 7 | OMID-1 |

### Protocol (IAB_PROTOCOL)
| Code | Name |
|------|------|
| 1-3 | VAST 1.0, 2.0, 3.0 |
| 4-6 | VAST 1.0-3.0 Wrapper |
| 7-8 | VAST 4.0, 4.0 Wrapper |
| 9-10 | DAAST 1.0, 1.0 Wrapper |
| 11-14 | VAST 4.1-4.2 and Wrappers |

### Playback Method (IAB_PLAYBACK_METHOD)
| Code | Name |
|------|------|
| 1 | Auto-play, Sound On |
| 2 | Auto-play, Sound Off |
| 3 | Click-to-play |
| 4 | Mouse-over |
| 5 | Auto-play, Sound Unknown |
| 6 | Click-to-play, Sound On |

## Feature 1: Bid Request Validator

### Input
- Campaign JSON (single object or array with one object from `bid_entities` table)
- Bid Request JSON (OpenRTB 2.6 format)

### Processing
Validates 36 targeting rules:
1. **test_flag** - Inverted boolean logic (false → test=0, true → test=1)
2. media_type
3. width
4. height
5. interstitial
6. price vs bidfloor
7. currency
8. date_range
9. domain (allowlist/blocklist)
10. inventory_type (allowlist/blocklist)
11. supply_source (allowlist/blocklist)
12. postal_code (allowlist/blocklist)
13. iab_categories
14. site_id (allowlist/blocklist)
15. site_name (allowlist/blocklist)
16. publisher_id (allowlist/blocklist)
17. publisher_name (allowlist/blocklist)
18. ad_unit_id/tagid (allowlist/blocklist)
19. os (allowlist/blocklist with lquery pattern matching)
20. browser/UA (allowlist/blocklist with pattern matching)
21. device make/model (allowlist/blocklist with lquery pattern matching)
22. **device_type** (allowlist/blocklist with string-to-code mapping)
23. **connection_type** (allowlist/blocklist with IAB display names)
24. language (allowlist/blocklist)
25. geo/country (allowlist/blocklist with lquery pattern matching)
26. isp (allowlist/blocklist)
27. ip_address (allowlist/blocklist - display only)
28. delivery_schedule (allowlist/blocklist - display only)
29. deal_code
30. mime_types
31. **api_frameworks** (with IAB display names)
32. **protocols** (video, with IAB display names)
33. **playback_methods** (video, with IAB display names)
34. duration (video)
35. is_skippable (video)
36. ad_unit_ratio (blocklist)

### Output
HTML table with columns:
- **Field**: Targeting parameter name
- **Campaign Value**: Value/rules from campaign (with full array display)
- **Bid Request Value**: Actual value from bid request with IAB names (e.g., "4 (Phone)")
- **Match**: ✓ (pass), ✗ (fail), or — (N/A)

**Sorting**: Failed checks first → Passed checks → N/A checks

**Summary**: Count of passed/failed/N/A checks

### Key Logic
- **Allowlist**: Value must be IN the list to pass
- **Blocklist**: Value must NOT be in the list to pass
- **NULL/empty campaign field**: Treated as "any allowed" (N/A match)
- **Multiple impressions**: ANY impression matching = pass
- **Pattern matching** (lquery fields): Extracted base values using `parseLquery()`
  - `{DE.*.*}` → `DE`
  - `{Android.*}` → `Android`
- **Device type matching**: Supports both string names ("Phone", "Tablet") and numeric codes (4, 5)
- **IAB code display**: Shows both code and human-readable name for all IAB fields

### UI Features
- **URL Routing**: Direct tab access via `#validator` and `#generator` hash URLs
- **Clear Button**: Clears all inputs with confirmation dialog
- **No Auto-Load**: Sample data removed to start with clean slate

## Feature 2: Bid Request Generator

### Input
- Campaign JSON (from `bid_entities` table)

### Output
- Valid OpenRTB 2.6 Bid Request JSON that MATCHES the campaign targeting

### Logic
1. **Use first value from allowlists** for all fields
2. **Set bidfloor to 5% of campaign price** (changed from 80%)
3. **Handle test_flag with inverted logic**:
   - campaign.test_flag = false → bidRequest.test = 0
   - campaign.test_flag = true → bidRequest.test = 1
4. **Parse lquery patterns** using `parseLquery()` for ltree fields:
   - geo_allowlist: `{DE.*.*}` → country: `"DE"`
   - os_allowlist: `{Android.*}` → os: `"Android"`
   - device_allowlist: `{Samsung.*}` → make: `"Samsung"`
5. **Convert device type strings to OpenRTB codes**:
   - "Phone" → 4, "Tablet" → 5, "PC" → 2, etc.
6. **Build impression based on media_type**:
   - DISPLAY → banner object with w/h
   - VIDEO_INSTREAM → video object with placement=1, linearity=1
   - VIDEO_OUTSTREAM → video object with placement=3, linearity=2
7. **Build site OR app** based on inventory_type_allowlist
8. **Add all available targeting values** from allowlists
9. **Include deal if deal_code exists**
10. **Add complete OpenRTB objects**:
    - source.ext.schain (supply chain transparency)
    - user object with IAB TCF v2.2 consent string
    - regs object with GDPR/COPPA/CCPA flags
    - Complete geo object (lat, lon, city, region, metro, utcoffset)
    - Enhanced device, site, app, banner, video objects

### Generated Structure
```json
{
  "id": "test-{timestamp}-{random}",
  "test": 0,  // inverted from campaign.test_flag
  "imp": [{
    "id": "1",
    "tagid": "{from ad_unit_id_allowlist[0]}",
    "banner/video": {...},
    "bidfloor": {campaign.price * 0.05},  // 5% of price
    "bidfloorcur": "{campaign.currency}",
    "instl": {0 or 1},
    "secure": 1,
    "pmp": {...} // if deal exists
  }],
  "site/app": {
    "id": "{from site_id_allowlist[0]}",
    "name": "{from site_name_allowlist[0]}",
    "domain": "{from domain_allowlist[0]}",
    "ref": "https://example.com/page",
    "publisher": {
      "id": "{from publisher_id_allowlist[0]}",
      "name": "{from publisher_name_allowlist[0]}"
    },
    "cat": [...],  // iab_categories
    "pagecat": [...],
    "privacypolicy": 1
  },
  "device": {
    "ua": "Mozilla/5.0 ({OS}) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "ip": "192.168.1.100",
    "os": "{parseLquery(os_allowlist)}",
    "devicetype": {convertDeviceType(device_type_allowlist[0])},  // string → code
    "make": "{parseLquery(device_allowlist)}",
    "language": "{from browser_language_allowlist[0]}",
    "connectiontype": {from connection_type_allowlist[0]},
    "isp": "{from isp_allowlist[0]}",
    "geo": {
      "type": 2,
      "lat": 52.52,
      "lon": 13.405,
      "country": "{parseLquery(geo_allowlist)}",  // extracted base value
      "city": "Berlin",
      "region": "BE",
      "metro": "638",
      "zip": "{from postal_code_allowlist[0]}",
      "utcoffset": 60
    }
  },
  "user": {
    "id": "user-{random}",
    "buyeruid": "buyer-{random}",
    "ext": {
      "consent": "{IAB TCF v2.2 consent string}"
    }
  },
  "source": {
    "ext": {
      "supply_source": "{from supply_source_allowlist[0]}",
      "schain": {
        "complete": 1,
        "ver": "1.0",
        "nodes": [...]
      }
    }
  },
  "regs": {
    "coppa": 0,
    "ext": {
      "gdpr": 1,
      "us_privacy": "1---",
      "consent": "{IAB TCF v2.2 consent string}"
    }
  },
  "cur": ["{campaign.currency}"],
  "at": 1,
  "allimps": 0
}
```

### UI Features
- **URL Routing**: Direct access via `#generator` hash URL
- **Clear Button**: Clears all inputs with confirmation dialog
- **Copy to Clipboard**: One-click copy of generated bid request

## Feature 3: Automated Tests

### Test Categories
1. **Core Utilities** (8 tests)
   - PostgreSQL array parsing (simple, empty, null, complex)
   - Boolean parsing
   - Nested value extraction
   - Array formatting
   - lquery parsing

2. **Validation Logic** (8 tests)
   - test_flag validation (inverted logic)
   - Media type validation
   - Width/height matching
   - Currency validation
   - Domain allowlist (match/no match)
   - Postal code validation
   - Interstitial validation
   - Device type string-to-code matching

3. **Generator Logic** (7 tests)
   - Basic bid request generation
   - Video bid request
   - Site generation
   - App generation
   - Deal generation
   - Bidfloor calculation (5%)
   - Full validation flow

### Output
- **Console only** (no UI tab)
- Runs automatically on page load
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

### Lquery Pattern Parser
```javascript
function parseLquery(lqueryString) {
  // Extracts base value from ltree pattern
  // "{DE.*.*}" → "DE"
  // "{Android.*}" → "Android"
  const arr = parsePgArray(lqueryString);
  const pattern = arr[0];
  return pattern.split('.')[0].replace(/\*/g, '');
}
```

### Device Type Converter
```javascript
function convertDeviceType(deviceTypeStr) {
  // Maps string names to OpenRTB codes
  // "Phone" → 4, "Tablet" → 5, "PC" → 2
  const map = {
    'phone': 4, 'tablet': 5, 'pc': 2,
    'tv': 3, 'connected device': 6, 'set top box': 7
  };
  return map[deviceTypeStr.toLowerCase()];
}
```

### IAB Display Functions
```javascript
function getDeviceTypeName(code) {
  return IAB_DEVICE_TYPE[code] || code;
}
// Similar for: getConnectionTypeName, getApiFrameworkName,
//              getProtocolName, getPlaybackMethodName
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
- Tab-based navigation with URL hash routing
- Responsive (mobile-friendly)
- Monospace fonts for JSON/code
- Color coding:
  - Green (✓): Passed checks
  - Red (✗): Failed checks
  - Gray (—): N/A checks
  - Purple: Interactive elements

### User Flow
1. **Load page** → Tests run automatically in console
2. **Validator Tab** (#validator)
   - User pastes campaign + bid request → Click "Validate"
   - Results table appears with sorting (failed → passed → N/A)
   - Summary shows pass/fail counts
   - IAB codes displayed with human-readable names
   - Clear button to reset inputs
3. **Generator Tab** (#generator)
   - User pastes campaign → Click "Generate"
   - OpenRTB 2.6 bid request appears
   - Copy to clipboard button
   - Clear button to reset inputs

### URL Routing
- `http://example.com/#validator` - Direct link to validator tab
- `http://example.com/#generator` - Direct link to generator tab
- Supports browser back/forward navigation
- Tab state preserved in URL

## Sample Data

### Sample Campaign (Finnish Market)
```json
{
  "line_item_id": "100000334",
  "media_type": "DISPLAY",
  "width": "320",
  "height": "480",
  "price": "3.5",
  "price_type": "CPM",
  "currency": "EUR",
  "interstitial": "false",
  "test_flag": "false",
  "start_date": "2025-11-20T00:00:00Z",
  "end_date": "2025-12-31T23:59:00Z",
  "inventory_type_allowlist": "{WEB}",
  "domain_allowlist": "{yle.fi,iltalehti.fi,hs.fi}",
  "geo_allowlist": "{FI.*.*}",
  "device_type_allowlist": "{Phone,Tablet}",
  "supply_source_allowlist": "{Equativ}",
  "browser_language_allowlist": "{fi,sv}",
  "postal_code_allowlist": "{00100,00500}"
}
```

### Sample Bid Request (Matching)
```json
{
  "id": "test-1732089600-abc123",
  "test": 0,
  "cur": ["EUR"],
  "imp": [{
    "id": "1",
    "banner": {
      "w": 320,
      "h": 480,
      "mimes": ["image/jpeg", "image/png"]
    },
    "bidfloor": 0.175,
    "bidfloorcur": "EUR",
    "instl": 0,
    "secure": 1
  }],
  "site": {
    "id": "site-123",
    "domain": "yle.fi",
    "publisher": {"id": "pub-456"}
  },
  "device": {
    "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    "ip": "91.152.1.1",
    "os": "iOS",
    "devicetype": 4,
    "language": "fi",
    "geo": {
      "country": "FI",
      "city": "Helsinki",
      "zip": "00100"
    }
  },
  "source": {
    "ext": {"supply_source": "Equativ"}
  },
  "user": {
    "ext": {
      "consent": "CPzHb..."
    }
  },
  "regs": {
    "ext": {
      "gdpr": 1,
      "consent": "CPzHb..."
    }
  }
}
```

## Current Status

### Completed Features
- ✅ `index.html` - Main page with 2-tab navigation and URL routing
- ✅ `css/style.css` - Complete responsive styling
- ✅ `js/core.js` - All utilities including IAB dictionaries, lquery parser, device type converter
- ✅ `js/tab1-validator.js` - Full validation with 36 checks, IAB name display, device type string matching
- ✅ `js/tab2-generator.js` - Complete bid request generator with OpenRTB 2.6 compliance
- ✅ `js/tab3-tests.js` - Automated test suite (23 tests, console only)

### Key Features Implemented
1. ✅ test_flag inverted logic (false → 0, true → 1)
2. ✅ bidfloor calculation at 5% of campaign price
3. ✅ lquery parsing for ltree database types
4. ✅ device_type string-to-code conversion ("Phone" → 4)
5. ✅ IAB reference dictionaries with display names
6. ✅ Complete OpenRTB objects (schain, user, regs, geo)
7. ✅ IAB TCF v2.2 consent strings
8. ✅ URL hash-based tab routing
9. ✅ Clear buttons with confirmation dialogs
10. ✅ Responsive design for mobile/tablet/desktop

### Validation Enhancements
- Device type shows "4 (Phone)" instead of just "4"
- Connection type shows "2 (WiFi)" instead of just "2"
- API frameworks show "[3 (MRAID-1), 5 (MRAID-2)]" format
- Protocols show "[2 (VAST 2.0), 3 (VAST 3.0)]" format
- Playback methods show "[1 (Auto-play, Sound On)]" format
- Campaign allowlist with "Phone" correctly matches bidRequest devicetype=4

### Known Limitations
1. IP ranges (inetmultirange) are display-only (no validation logic)
2. Delivery schedules are display-only (no time zone validation)
3. lquery pattern matching uses simple prefix/substring logic (not full ltree query)
4. Tests run in console only (removed from UI)

## Development Notes

### Best Practices
1. Always use `parsePgArray()` for PostgreSQL array fields
2. Always use `parseLquery()` for ltree/lquery pattern fields
3. Always use `convertDeviceType()` for device type string conversion
4. Always use IAB display functions for showing human-readable names
5. Use `formatArrayForDisplay()` for consistent array formatting
6. Handle both string and numeric formats for IAB codes in validation

### DSP Compatibility
- Supply chain object (schain) included for transparency
- Real IAB TCF v2.2 consent strings for GDPR compliance
- Complete geo object with all standard fields
- Enhanced device, site, app objects with all common fields
- Works with major DSPs: Google DV360, Xandr, TheTradeDesk, etc.

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- No polyfills required
- Tested on desktop and mobile devices
