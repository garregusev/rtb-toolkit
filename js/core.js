// Core utilities and shared functions

// Parse PostgreSQL array format - improved version
function parsePgArray(pgArrayString) {
  if (!pgArrayString || pgArrayString === '' || pgArrayString === 'null' || pgArrayString === '""') {
    return null;
  }

  // Handle empty arrays
  if (pgArrayString === '{}') return [];

  try {
    // Remove outer braces
    let cleaned = pgArrayString.trim();
    if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }

    if (cleaned === '') return [];

    // Handle escaped quotes and complex nested structures
    const result = [];
    let current = '';
    let inQuotes = false;
    let escapeNext = false;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === ',' && !inQuotes) {
        if (current.trim()) {
          result.push(current.trim());
        }
        current = '';
        continue;
      }

      current += char;
    }

    // Add last element
    if (current.trim()) {
      result.push(current.trim());
    }

    return result.length > 0 ? result : null;
  } catch (err) {
    console.error('Error parsing PG array:', pgArrayString, err);
    return null;
  }
}

// Parse lquery patterns to extract base value for bid request
// Examples: "{DE.*.*}" -> "DE", "{Android.*}" -> "Android"
function parseLquery(lqueryString) {
  const arr = parsePgArray(lqueryString);
  if (!arr || arr.length === 0) return null;

  // Extract base value from first pattern
  const pattern = arr[0];

  // Remove wildcard patterns: "DE.*.*" -> "DE", "Android.*" -> "Android"
  const baseValue = pattern.split('.')[0].replace(/\*/g, '');

  return baseValue || null;
}

// Convert device type strings to OpenRTB integers
// OpenRTB 2.6 device types: 1=Mobile/Tablet, 2=PC, 3=TV, 4=Phone, 5=Tablet, 6=Connected Device, 7=Set Top Box
function convertDeviceType(deviceTypeStr) {
  const map = {
    'phone': 4,
    'tablet': 5,
    'pc': 2,
    'desktop': 2,
    'tv': 3,
    'ctv': 3,
    'connected tv': 3,
    'connected device': 6,
    'set top box': 7,
    'mobile': 1
  };

  const normalized = deviceTypeStr.toLowerCase().trim();
  return map[normalized] || null;
}

// IAB OpenRTB 2.6 Reference Dictionaries for reverse mapping
const IAB_DEVICE_TYPE = {
  1: 'Mobile/Tablet',
  2: 'PC',
  3: 'TV',
  4: 'Phone',
  5: 'Tablet',
  6: 'Connected Device',
  7: 'Set Top Box'
};

const IAB_CONNECTION_TYPE = {
  0: 'Unknown',
  1: 'Ethernet',
  2: 'WiFi',
  3: 'Cellular (Unknown)',
  4: 'Cellular 2G',
  5: 'Cellular 3G',
  6: 'Cellular 4G',
  7: 'Cellular 5G'
};

const IAB_API_FRAMEWORK = {
  1: 'VPAID 1.0',
  2: 'VPAID 2.0',
  3: 'MRAID-1',
  4: 'ORMMA',
  5: 'MRAID-2',
  6: 'MRAID-3',
  7: 'OMID-1'
};

const IAB_PROTOCOL = {
  1: 'VAST 1.0',
  2: 'VAST 2.0',
  3: 'VAST 3.0',
  4: 'VAST 1.0 Wrapper',
  5: 'VAST 2.0 Wrapper',
  6: 'VAST 3.0 Wrapper',
  7: 'VAST 4.0',
  8: 'VAST 4.0 Wrapper',
  9: 'DAAST 1.0',
  10: 'DAAST 1.0 Wrapper',
  11: 'VAST 4.1',
  12: 'VAST 4.1 Wrapper',
  13: 'VAST 4.2',
  14: 'VAST 4.2 Wrapper'
};

const IAB_PLAYBACK_METHOD = {
  1: 'Auto-play, Sound On',
  2: 'Auto-play, Sound Off',
  3: 'Click-to-play',
  4: 'Mouse-over',
  5: 'Auto-play, Sound Unknown',
  6: 'Click-to-play, Sound On'
};

// Get IAB name for device type code
function getDeviceTypeName(code) {
  return IAB_DEVICE_TYPE[code] || code;
}

// Get IAB name for connection type code
function getConnectionTypeName(code) {
  return IAB_CONNECTION_TYPE[code] || code;
}

// Get IAB name for API framework code
function getApiFrameworkName(code) {
  return IAB_API_FRAMEWORK[code] || code;
}

// Get IAB name for protocol code
function getProtocolName(code) {
  return IAB_PROTOCOL[code] || code;
}

// Get IAB name for playback method code
function getPlaybackMethodName(code) {
  return IAB_PLAYBACK_METHOD[code] || code;
}

// Convert string boolean to actual boolean
function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 't' || value === '1') return true;
  if (value === 'false' || value === 'f' || value === '0') return false;
  return null;
}

// Get nested value from object using dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

// Escape SQL string
function escapeSqlString(value) {
  if (value === null || value === undefined) return null;
  return String(value).replace(/'/g, "''");
}

// Format array for display - show all values or summary
function formatArrayForDisplay(arr, maxItems = 10) {
  if (!arr || arr.length === 0) return 'empty';
  if (arr.length <= maxItems) {
    return `[${arr.join(', ')}]`;
  }
  return `[${arr.slice(0, maxItems).join(', ')}, ... +${arr.length - maxItems} more]`;
}

// Show status message
function showStatus(type, message) {
  const existingStatus = document.querySelector('.status');
  if (existingStatus) existingStatus.remove();
  
  const status = document.createElement('div');
  status.className = `status ${type}`;
  status.textContent = message;
  
  const activeContent = document.querySelector('.tab-content.active');
  if (activeContent) {
    activeContent.insertBefore(status, activeContent.firstChild);
    setTimeout(() => status.remove(), 4000);
  }
}

// Initialize tab switching with URL hash support
function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  function switchTab(targetId) {
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));

    const activeTab = document.querySelector(`.tab[data-tab="${targetId}"]`);
    const targetContent = document.getElementById(targetId);

    if (activeTab && targetContent) {
      activeTab.classList.add('active');
      targetContent.classList.add('active');
    }
  }

  // Handle click events
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetId = tab.getAttribute('data-tab');
      switchTab(targetId);
    });
  });

  // Handle hash changes (back/forward navigation)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash && (hash === 'validator' || hash === 'generator' || hash === 'sql-analyzer')) {
      switchTab(hash);
    }
  });

  // Handle initial hash on page load
  const initialHash = window.location.hash.substring(1);
  if (initialHash && (initialHash === 'validator' || initialHash === 'generator' || initialHash === 'sql-analyzer')) {
    switchTab(initialHash);
  }
}

// Copy text to clipboard
function copyToClipboard(text) {
  return navigator.clipboard.writeText(text)
    .then(() => {
      showStatus('success', '✓ Copied to clipboard!');
      return true;
    })
    .catch(err => {
      showStatus('error', 'Failed to copy: ' + err.message);
      return false;
    });
}
