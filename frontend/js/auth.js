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
    alert('Login failed: ' + err.message);
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
    alert('Registration failed: ' + err.message);
  }
}

function logout() {
  api.logout();
  redirectToLogin();
}
