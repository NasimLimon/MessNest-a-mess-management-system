let currentUser = null;

async function checkAuth() {
  try {
    if (!api.token) {
      redirectToLogin();
      return false;
    }
    currentUser = await api.getCurrentUser();
    return true;
  } catch (err) {
    console.error('Auth check failed:', err);
    redirectToLogin();
    return false;
  }
}

function redirectToLogin() {
  window.location.href = '/pages/login.html';
}

function redirectToDashboard() {
  if (currentUser?.role === 'admin') {
    window.location.href = '/pages/admin-dashboard.html';
  } else {
    window.location.href = '/pages/member-dashboard.html';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const result = await api.login(username, password);
    currentUser = result.user;
    redirectToDashboard();
  } catch (err) {
    showAlert('errorAlert', 'Login failed: ' + err.message, 'error');
    showToast('Login failed: ' + err.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const fullName = document.getElementById('fullName').value;

  try {
    const result = await api.register(username, email, password, fullName);
    currentUser = result.user;
    redirectToDashboard();
  } catch (err) {
    showAlert('errorAlert', 'Registration failed: ' + err.message, 'error');
    showToast('Registration failed: ' + err.message, 'error');
  }
}

function logout() {
  api.logout();
  showToast('Logged out successfully!', 'success');
  redirectToLogin();
}

function isAdmin() {
  return currentUser?.role === 'admin';
}

function isMember() {
  return currentUser?.role === 'member';
}

function getCurrentUserId() {
  return currentUser?.id;
}

