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

// Initialize tab switching
function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
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