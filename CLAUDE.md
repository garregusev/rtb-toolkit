# RTB Bidding Toolkit — Developer Reference

## Project Overview

Browser-based toolkit for Real-Time Bidding (RTB) development. Three tabs:

1. **🔄 Bid Request Generator** — generates a valid OpenRTB 2.6 bid request from a campaign row (`bid_entities`) 
2. **🔬 SQL Analyzer** — parses a filtering SQL query, extracts its conditions, and compares them against a campaign JSON row (no external API)
3. **📊 Bid Request Validator** — validates an OpenRTB 2.6 bid request against campaign targeting rules

---

## File Structure

```
rtb-toolkit/
├── index.html                  # Tab layout, forms, script loading
├── css/
│   └── style.css               # All styles (shared classes: .validation-table, .match-true/false/na, etc.)
├── js/
│   ├── core.js                 # Shared utilities (parsePgArray, parseLquery, IAB dicts, tab routing)
│   ├── tab1-validator.js       # Bid Request Validator (~1700 lines, 36 checks)
│   ├── tab2-generator.js       # Bid Request Generator (OpenRTB 2.6 builder)
│   ├── tab3-tests.js           # Automated test suite (console-only output)
│   └── tab4-sql-analyzer.js    # SQL Analyzer (local regex-based SQL parsing)
├── prompts/
│   └── sql-analyzer.txt        # Legacy Gemini prompt (no longer used)
├── CLAUDE.md                   # This file
├── README.md                   # User-facing documentation
└── TECHNICAL_SPEC.md           # Technical specification
```

---

## Key Utilities (core.js)

| Function | Description |
|---|---|
| `parsePgArray(str)` | Parses PostgreSQL array strings `{val1,val2}` → `['val1','val2']`. Returns `null` for null/empty/`{}`. Handles quoted strings and escaped values. |
| `parseLquery(str)` | Extracts the root node from an lquery array: `{DE.*.*}` → `'DE'`. |
| `formatArrayForDisplay(arr, max=10)` | Joins array for display, truncates with `...+N more`. |
| `convertDeviceType(str)` | Maps device type strings (`'Phone'`) to OpenRTB codes (`4`). |
| `getNestedValue(obj, path)` | Dot-notation access: `getNestedValue(br, 'device.geo.country')`. |
| `parseBoolean(v)` | Converts string/boolean to bool (`'true'`, `true`, `'t'`, `'1'` → `true`). |
| `showStatus(type, msg)` | Shows a temporary status bar in the active tab (types: `success`, `error`, `info`). |
| `initializeTabs()` | Hash-based tab routing (`#generator`, `#sql-analyzer`, `#validator`). |

---

## PostgreSQL Array / Null Equivalences

In `bid_entities`, these are all treated as "field not set" (= any value allowed):

```
NULL  ≡  ''  ≡  '{}'  ≡  'null'
```

`parsePgArray` returns `null` for all of them. Validation and SQL analysis both treat `null` result as N/A (any allowed / nothing blocked).

---

## Postal Code Format

**New format (current):** `"CC.postal_code"` — country prefix + dot + postal code string.

Examples:
- `"CZ.390 03"` — Czech Republic, postal code `390 03`
- `"HR.10290"` — Croatia, postal code `10290`

**Legacy format:** bare postal code string `"390 03"`, `"10290"`.

### Generator behavior (`tab2-generator.js → buildGeo()`)

If `postal_code_allowlist` entries have the `CC.` prefix:
- Strips prefix → sets `geo.zip` to the bare postal code
- Uses the country code to override `geo.country` (and sets matching city/region/lat/lon via `applyCountryDefaults()`)
- Overrides any country previously set from `geo_allowlist`

### Validator behavior (`tab1-validator.js → validatePostalCode()`)

Strips `CC.` prefix from allowlist/blocklist entries before comparing with `device.geo.zip`, so both old and new formats validate correctly.

---

## geo_allowlist / geo_blocklist Format

These columns are PostgreSQL `lquery[]` arrays. Values are ltree path patterns:

```
{DE.*.*}          → matches Germany (country level)
{DE.Bavaria.*}    → matches Bavaria region in Germany
{US.*.*}          → matches USA
```

`parseLquery()` extracts the root node (`DE`, `US`, etc.) for use as `geo.country`.

---

## SQL Analyzer — Parsing Logic (`tab4-sql-analyzer.js`)

The analyzer parses SQL WHERE conditions for known `bid_entities` field names and compares them against campaign JSON values. **No external API required.**

### Supported SQL patterns

| Pattern | Type | Example |
|---|---|---|
| `field @> ARRAY[...]` | allowlist | `geo_allowlist @> ARRAY['DE.*.*']::lquery[]` |
| `NOT field @> ARRAY[...]` | blocklist | `NOT geo_blocklist @> ARRAY['DE.*.*']::lquery[]` |
| `field && ARRAY[...]` | allowlist (overlap) | `supply_source_allowlist && ARRAY['Equativ']` |
| `'val' = ANY(field)` | allowlist | `'WEB' = ANY(inventory_type_allowlist)` |
| `field = 'value'` | equality | `media_type = 'DISPLAY'` |
| `field = true/false` | boolean | `test_flag = false` |
| `field >= N` / `field <= N` | numeric | `price <= 2.5` |
| `field <= 'date'` / `field >= 'date'` | date | `start_date <= '2025-06-15T10:00:00Z'` |
| `field IS NULL` | is_null | `geo_allowlist IS NULL` |

Table aliases are handled transparently (`li.field`, `b.field`, `bid_entities.field`, `field`).

### Match semantics

- **allowlist**: campaign field is `null`/empty (any allowed) → N/A; otherwise must contain all SQL values → ✓/✗
- **blocklist**: campaign field is `null`/empty (none blocked) → N/A; otherwise must NOT contain any SQL values → ✓/✗
- **equals**: campaign value must equal SQL string value
- **boolean**: campaign value (handling `'true'`, `'t'`, `true`) must match SQL boolean
- **numeric**: campaign value must satisfy all comparison operators found for the field
- **date**: campaign date must satisfy all comparison operators
- **is_null**: campaign field must be null/empty

---

## Bid Request Generator — Key Functions (`tab2-generator.js`)

| Function | Description |
|---|---|
| `buildBidRequestFromCampaign(campaign)` | Main orchestrator, returns full OpenRTB 2.6 object |
| `buildImpression(campaign)` | Builds `imp[]` with banner or video object |
| `buildDevice(campaign)` | Builds `device` object (UA, language, IP, geo) |
| `buildGeo(campaign)` | Builds `geo` object; handles postal code country prefix |
| `applyCountryDefaults(geo, cc)` | Sets country/city/region/lat/lon from 2-letter country code |
| `buildSite(campaign)` | Builds `site` object |
| `buildUser(campaign)` | Builds `user` object |
| `buildPmp(campaign)` | Builds `pmp` with deal if `deal_code` is set |

Supported countries in `applyCountryDefaults`: `IT`, `DE`, `US`, `GB`, `FR`, `CZ`, `HR`. Unknown countries get `city: 'Unknown'`.

---

## Bid Request Validator — Checks (`tab1-validator.js`)

36 checks, each returning `{ field, campaignValue, bidRequestValue, match }` where `match` is `true | false | null` (null = N/A, field not set in campaign).

Key checks include: `test_flag`, `media_type`, `width`/`height`, `interstitial`, `price` vs `bidfloor`, `currency`, date range, `domain`, `inventory_type`, `supply_source`, `postal_code`, `geo` (country), `os`, `browser`, `device_type`, `connection_type`, `language`, `ip_address`, `isp`, `deal_code`, video fields (`mime_types`, `api_frameworks`, `protocols`, `playback_methods`, `duration`, `is_skippable`).

---

## Database Schema — `bid_entities` Table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, auto-generated |
| `order_id` | int4 | |
| `line_item_id` | int4 | |
| `creative_id` | int4 | |
| `variant_id` | int4 | |
| `business_rule_id` | int4 | |
| `agency_id` | int4 | |
| `advertiser_id` | int4 | |
| `advertiser_domains` | varchar[] | |
| `company_id` | int4 | |
| `test_flag` | bool | default `false` |
| `mime_types` | varchar[] | |
| `media_type` | media_type | enum |
| `api_frameworks` | int4[] | IAB framework codes |
| `pacing_type` | pacing_type | enum, default `'Evenly'` |
| `width` | int4 | |
| `height` | int4 | |
| `creative_code` | text | |
| `custom_options` | varchar[] | |
| `is_skippable` | bool | |
| `start_date` | timestamptz | |
| `end_date` | timestamptz | |
| `price` | float8 | |
| `price_type` | price_type | enum |
| `goal` | int4 | |
| `goal_type` | goal_type | enum |
| `priority` | int4 | |
| `currency` | varchar | |
| `delivery_optimization_enabled` | bool | default `false` |
| `delivery_schedule_enabled` | bool | |
| `timebox_capping_enabled` | bool | |
| `timebox_capping` | jsonb | |
| `frequency_capping_enabled` | bool | |
| `frequency_capping` | jsonb | |
| `schedule` | jsonb | |
| `daily_cap` | int4 | |
| `daily_cap_kpi` | float8 | |
| `buying_strategy_formula` | text | |
| `buying_strategy_name` | text | |
| `buying_strategy_version` | text | |
| `ip_allowlist` | inetmultirange | |
| `ip_blocklist` | inetmultirange | |
| `browser_language_allowlist` | varchar[] | |
| `browser_language_blocklist` | varchar[] | |
| `device_type_allowlist` | varchar[] | |
| `device_type_blocklist` | varchar[] | |
| `postal_code_allowlist` | varchar[] | Format: `CC.postal` or bare postal |
| `postal_code_blocklist` | varchar[] | Format: `CC.postal` or bare postal |
| `inventory_type_allowlist` | varchar[] | |
| `inventory_type_blocklist` | varchar[] | |
| `domain_allowlist` | varchar[] | |
| `domain_blocklist` | varchar[] | |
| `deal_code` | varchar | |
| `deal_ask_price` | numeric | |
| `deal_auction_type` | auction_type | enum |
| `connection_type_allowlist` | int4[] | IAB connection type codes |
| `connection_type_blocklist` | int4[] | IAB connection type codes |
| `isp_allowlist` | varchar[] | |
| `isp_blocklist` | varchar[] | |
| `supply_source_allowlist` | varchar[] | |
| `supply_source_blocklist` | varchar[] | |
| `publisher_id_allowlist` | int4[] | |
| `publisher_id_blocklist` | int4[] | |
| `publisher_name_allowlist` | varchar[] | |
| `publisher_name_blocklist` | varchar[] | |
| `site_id_allowlist` | int4[] | |
| `site_id_blocklist` | int4[] | |
| `site_name_allowlist` | varchar[] | |
| `site_name_blocklist` | varchar[] | |
| `ad_unit_id_allowlist` | int8[] | |
| `ad_unit_id_blocklist` | int8[] | |
| `ad_unit_ratio_blocklist` | int8[] | |
| `tcf_vendor_id` | int4 | |
| `iab_categories` | varchar[] | |
| `interstitial` | bool | default `false` |
| `cpm_factor` | float8 | default `1.0` |
| `to_cpm_factor` | float8 | default `1.0` |
| `company_platform_fee` | float8 | default `0.0` |
| `company_data_cost` | float8 | default `0.0` |
| `duration` | int4 | video duration seconds |
| `playback_methods` | int4[] | IAB playback method codes |
| `protocols` | int4[] | IAB video protocol codes |
| `po_number` | varchar | |
| `browser_allowlist` | lquery[] | |
| `browser_blocklist` | lquery[] | |
| `device_allowlist` | lquery[] | |
| `device_blocklist` | lquery[] | |
| `os_allowlist` | lquery[] | |
| `os_blocklist` | lquery[] | |
| `geo_allowlist` | lquery[] | ltree path patterns, e.g. `{DE.*.*}` |
| `geo_blocklist` | lquery[] | ltree path patterns |
| `delivery_schedule_allowlist` | _delivery_schedule[] | |
| `delivery_schedule_blocklist` | _delivery_schedule[] | |
| `deal_id` | int4 | |
| `deal_name` | varchar | |
| `deal_currency` | varchar | |
| `delivery_optimization` | jsonb | |
| `data_targeting_expressions` | jsonb | |
| `data_targeting_segments` | jsonb | |
| `advertiser_name` | text | default `''` |
| `creative_tcf_vendors` | int4[] | default `'{}'` |
| `product_id` | int4 | |
| `effect_id` | int4[] | |
| `best_product_selection` | varchar | |
| `inventory_allowlist` | varchar[] | |
| `inventory_blocklist` | varchar[] | |

---

## Custom Enum Types

### `media_type`
`DISPLAY`, `VIDEO_INSTREAM`, `VIDEO_OUTSTREAM`

### `pacing_type`
`Evenly`, `ASAP`

### `price_type`
`CPM`, `CPV`, `CPC`, `CPCV`, `CPE`, `CPVS`

### `goal_type`
`impressions`, `viewable_impressions`, `clicks`, `video_complete_views`, `engagements`, `video_starts`

### `auction_type`
`FIRST_PRICE`, `FIXED_PRICE`, `NONE`

---

## Adding a New Field Check

### To Validator (`tab1-validator.js`)
1. Write a `validateXxx(campaign, bidRequest)` function returning `{ field, campaignValue, bidRequestValue, match }`
2. Add a call to it inside `validateBidRequest()` in the results array

### To SQL Analyzer (`tab4-sql-analyzer.js`)
1. Add the field name to `CAMPAIGN_FIELD_NAMES`
2. The field will be auto-detected in SQL; add a custom pattern to `extractFieldCondition` only if the default patterns don't cover the SQL syntax used

### To Generator (`tab2-generator.js`)
1. Add generation logic in the appropriate `build*` function
2. For new countries: add a `case 'XX':` block in `applyCountryDefaults()`
