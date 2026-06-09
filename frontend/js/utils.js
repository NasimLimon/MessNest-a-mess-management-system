// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <span class="toast-close" onclick="this.parentElement.style.display='none';">&times;</span>
  `;
  container.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Alert Display
function showAlert(elementId, message, type = 'info') {
  const alertElement = document.getElementById(elementId);
  if (alertElement) {
    alertElement.className = `alert alert-${type}`;
    alertElement.textContent = message;
    alertElement.style.display = 'block';
  }
}

function hideAlert(elementId) {
  const alertElement = document.getElementById(elementId);
  if (alertElement) {
    alertElement.style.display = 'none';
  }
}

// Tab Switching
function switchTab(tabName) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.classList.remove('active');
  });

  // Remove active class from all tab buttons
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(btn => {
    btn.classList.remove('active');
  });

  // Show the selected tab
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  // Mark the clicked button as active
  if (event && event.target) {
    event.target.classList.add('active');
  }

  if (tabName === 'activity' && typeof loadActivityLogs === 'function') {
    loadActivityLogs();
  }
}

// Modal Functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Format Currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Format Date
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format Date Time
function formatDateTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Get Month-Year String
function getMonthYear(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short'
  });
}

// Status Badge HTML
function getStatusBadge(status) {
  const statusMap = {
    'paid': { class: 'badge-success', text: 'Paid' },
    'unpaid': { class: 'badge-warning', text: 'Unpaid' },
    'pending': { class: 'badge-warning', text: 'Pending' },
    'resolved': { class: 'badge-success', text: 'Resolved' },
    'active': { class: 'badge-success', text: 'Active' },
    'inactive': { class: 'badge-danger', text: 'Inactive' },
    'deactivated': { class: 'badge-danger', text: 'Deactivated' },
    'open': { class: 'badge-info', text: 'Open' },
    'closed': { class: 'badge-success', text: 'Closed' },
    'low': { class: 'badge-info', text: 'Low' },
    'medium': { class: 'badge-warning', text: 'Medium' },
    'high': { class: 'badge-danger', text: 'High' }
  };

  const info = statusMap[status] || { class: 'badge-info', text: status };
  return `<span class="badge ${info.class}">${info.text}</span>`;
}

// Debounce Function
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Search Filter
function filterTable(tableId, searchValue) {
  const table = document.getElementById(tableId);
  const rows = table.querySelectorAll('tbody tr');
  const searchLower = searchValue.toLowerCase();

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchLower) ? '' : 'none';
  });
}

// Sort Table
function sortTable(tableId, columnIndex, isNumeric = false) {
  const table = document.getElementById(tableId);
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));

  rows.sort((a, b) => {
    const aValue = a.cells[columnIndex].textContent;
    const bValue = b.cells[columnIndex].textContent;

    if (isNumeric) {
      return parseFloat(aValue) - parseFloat(bValue);
    }
    return aValue.localeCompare(bValue);
  });

  tbody.innerHTML = '';
  rows.forEach(row => tbody.appendChild(row));
}

// Validate Email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate Phone
function isValidPhone(phone) {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

// Show Loading Spinner
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<div class="loading-spinner"></div>';
  }
}

// Clear Loading Spinner
function clearLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '';
  }
}

// Download CSV
function downloadCSV(data, filename) {
  let csv = [];
  
  // Headers
  if (data.length > 0) {
    csv.push(Object.keys(data[0]).join(','));
  }
  
  // Rows
  data.forEach(row => {
    const values = Object.values(row).map(v => {
      if (typeof v === 'string' && v.includes(',')) {
        return `"${v}"`;
      }
      return v;
    });
    csv.push(values.join(','));
  });

  // Create blob and download
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Print
function printElement(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(element.innerHTML);
  printWindow.document.close();
  printWindow.print();
}

// Get Initials
function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Format Phone Number
function formatPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
}

// Calculate Days Until Date
function daysUntilDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Check if Date is in Past
function isDateInPast(dateString) {
  return new Date(dateString) < new Date();
}

// Get Full Month Name
function getMonthName(monthIndex) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthIndex];
}

const themeStorageKey = 'messnestTheme';

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'light') {
    html.classList.add('light-mode');
  } else {
    html.classList.remove('light-mode');
  }

  const toggleButton = document.getElementById('themeToggleButton');
  if (toggleButton) {
    toggleButton.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }
}

function toggleTheme() {
  const isLight = document.documentElement.classList.contains('light-mode');
  const nextTheme = isLight ? 'dark' : 'light';
  localStorage.setItem(themeStorageKey, nextTheme);
  applyTheme(nextTheme);
}

function initTheme() {
  const storedTheme = localStorage.getItem(themeStorageKey) || 'dark';
  applyTheme(storedTheme);
}
