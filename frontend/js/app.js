let currentUser = null;
let currentMember = null;
let currentTab = 'dashboard';

const adminTabs = ['dashboard', 'members', 'meals', 'billing', 'payments', 'menu', 'notices', 'complaints', 'expenses', 'settings'];
const memberTabs = ['dashboard', 'meals', 'billing', 'menu', 'notices', 'complaints'];
const icons = {
  dashboard: 'layout-dashboard',
  members: 'users',
  meals: 'utensils',
  billing: 'receipt',
  payments: 'credit-card',
  menu: 'book-open',
  notices: 'megaphone',
  complaints: 'message-circle',
  expenses: 'dollar-sign',
  settings: 'sliders'
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('register-btn').addEventListener('click', handleRegister);
  document.getElementById('show-register-btn').addEventListener('click', showRegisterForm);
  document.getElementById('show-login-btn').addEventListener('click', showLoginForm);
  document.getElementById('logout-btn').addEventListener('click', logout);
  initApp();
});

async function initApp() {
  if (!api.token) {
    showLoginScreen();
    return;
  }

  try {
    const result = await api.getCurrentUser();
    currentUser = result.data;
    if (currentUser.role === 'member') {
      await loadMemberProfile();
    }
    showMainApp();
    buildNav();
    await switchTab('dashboard');
  } catch (err) {
    api.logout();
    showLoginScreen();
  }
}

async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    showToast('Please fill in all fields');
    return;
  }

  try {
    await api.login(username, password);
    const currentUserResp = await api.getCurrentUser();
    currentUser = currentUserResp.data;
    currentUser.displayName = currentUser.displayName || currentUser.username || currentUser.email;

    if (currentUser.role === 'member') {
      await loadMemberProfile();
    }

    showMainApp();
    buildNav();
    await switchTab('dashboard');
  } catch (err) {
    showToast(err.message || 'Login failed');
  }
}

async function handleRegister() {
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const fullName = document.getElementById('register-fullname').value.trim();
  const password = document.getElementById('register-password').value;

  if (!username || !email || !fullName || !password) {
    showToast('Please fill in all fields');
    return;
  }

  try {
    await api.register(username, email, password, fullName);
    const currentUserResp = await api.getCurrentUser();
    currentUser = currentUserResp.data;
    currentUser.displayName = fullName || currentUser.username || currentUser.email;
    if (currentUser.role === 'member') {
      await loadMemberProfile();
    }
    showMainApp();
    buildNav();
    await switchTab('dashboard');
  } catch (err) {
    showToast(err.message || 'Registration failed');
  }
}

function showRegisterForm() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.remove('hidden');
}

function showLoginForm() {
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
}

async function loadMemberProfile() {
  try {
    const memberResponse = await api.getCurrentMember();
    currentMember = memberResponse.data;
  } catch (err) {
    console.warn('Unable to load member profile', err);
  }
}

function showMainApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  document.getElementById('user-badge').textContent = `${currentUser.displayName || currentUser.username || currentUser.email} (${currentUser.role})`;
  document.getElementById('header-title').textContent = 'MealNest';
}

function showLoginScreen() {
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  showLoginForm();
}

function logout() {
  api.logout();
  currentUser = null;
  currentMember = null;
  showLoginScreen();
  showToast('Logged out');
}

function buildNav() {
  const tabs = currentUser.role !== 'member' ? adminTabs : memberTabs;
  const nav = document.getElementById('nav-tabs');
  nav.innerHTML = tabs
    .map(
      (tab) => `<button data-tab="${tab}" class="tab-btn flex items-center gap-1 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
        tab === currentTab ? 'tab-active' : 'text-[#8a8a9a] hover:text-[#e8e8e8]'
      }"><i data-lucide="${icons[tab]}" style="width:14px;height:14px;"></i><span class="capitalize">${tab}</span></button>`
    )
    .join('');

  nav.querySelectorAll('.tab-btn').forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  lucide.createIcons();
}

async function switchTab(tab) {
  currentTab = tab;
  buildNav();
  await renderCurrentTab();
}

async function renderCurrentTab() {
  const area = document.getElementById('content-area');
  area.innerHTML = '';
  const renderers = {
    dashboard: renderDashboard,
    members: renderMembers,
    meals: renderMeals,
    billing: renderBilling,
    payments: renderPayments,
    menu: renderMenu,
    notices: renderNotices,
    complaints: renderComplaints,
    expenses: renderExpenses,
    settings: renderSettings
  };
  if (renderers[currentTab]) {
    await renderers[currentTab](area);
  }
  lucide.createIcons();
}

function showToast(message) {
  const t = document.createElement('div');
  t.className = 'fixed top-4 right-4 bg-[#e94560] text-white px-4 py-2 rounded-lg shadow-lg z-50 fade-in text-sm';
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function renderLoading(area) {
  area.innerHTML = '<div class="p-6 text-center text-[#8a8a9a]">Loading...</div>';
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
}

function statCard(label, value, icon) {
  return `<div class="bg-[#1a1a2e] rounded-xl p-4 card-hover"><div class="flex items-center gap-2 mb-2"><i data-lucide="${icon}" style="width:16px;height:16px;color:#e94560;"></i><span class="text-xs text-[#8a8a9a]">${label}</span></div><div class="text-xl font-bold">${value}</div></div>`;
}

async function renderDashboard(area) {
  renderLoading(area);
  try {
    const [membersResp, mealsResp, paymentsResp, noticesResp, statsResp, settingsResp] = await Promise.all([
      api.getMembers(),
      api.getMealHistory(),
      api.getPayments(),
      api.getNotices(),
      api.getMessStats(),
      api.getSettings()
    ]);

    const members = membersResp.data || [];
    const meals = mealsResp.data || [];
    const payments = paymentsResp.data || [];
    const notices = noticesResp.data || [];
    const stats = statsResp.data || {};
    const settings = settingsResp.data || {};

    if (currentUser.role !== 'member') {
      area.innerHTML = `<div class="fade-in"><h2 class="font-display text-2xl mb-6">Dashboard</h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          ${statCard('Members', members.length, 'users')}
          ${statCard('Meals', stats.total_meals || meals.length, 'utensils')}
          ${statCard('Collected', '₹' + (stats.total_collected || 0), 'indian-rupee')}
          ${statCard('Due', '₹' + (stats.total_due || 0), 'alert-circle')}
          ${statCard('Meal Rate', '₹' + (settings.meal_rate || 0), 'dollar-sign')}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="bg-[#1a1a2e] rounded-xl p-4">
            <h3 class="text-sm text-[#8a8a9a] mb-2">Mess Name</h3>
            <p class="text-lg font-semibold">${settings.mess_name || 'MealNest Mess'}</p>
          </div>
          <div class="bg-[#1a1a2e] rounded-xl p-4">
            <h3 class="text-sm text-[#8a8a9a] mb-2">Fixed Cost</h3>
            <p class="text-lg font-semibold">₹${settings.monthly_fixed_cost || 0}</p>
          </div>
        </div>
        <div class="bg-[#1a1a2e] rounded-xl p-4"><h3 class="text-sm text-[#8a8a9a] mb-3">Recent Notices</h3>
          ${notices.slice(0, 5).map((n) => `<div class="py-2 border-b border-[#2a2a4a] text-sm"><strong>${n.title}</strong> - ${n.content} <span class="text-[#8a8a9a] text-xs">${formatDate(n.created_at)}</span></div>`).join('') || '<p class="text-[#8a8a9a] text-sm">No activity yet</p>'}
        </div></div>`;
    } else {
      if (!currentMember?.id) {
        area.innerHTML = `<div class="p-6 text-red-400">Member profile not found. Please contact your administrator.</div>`;
        return;
      }
      const mealsResp = await api.getMealHistory(currentMember.id);
      const billsResp = await api.getMemberBillStatus(currentMember.id);
      const paymentsResp = await api.getPaymentHistory(currentMember.id);
      const totalPaid = paymentsResp.data.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalMeals = mealsResp.data.length;
      const dueAmount = billsResp.data.reduce((sum, bill) => sum + Number(bill.due_amount || 0), 0);

      area.innerHTML = `<div class="fade-in"><h2 class="font-display text-2xl mb-6">My Dashboard</h2>
        <div class="grid grid-cols-2 gap-4 mb-6">
          ${statCard('My Meals', totalMeals, 'utensils')}
          ${statCard('Paid', '₹' + totalPaid, 'indian-rupee')}
          ${statCard('Due', '₹' + dueAmount, 'alert-circle')}
          ${statCard('Bills', billsResp.data.length, 'receipt')}
        </div></div>`;
    }
  } catch (err) {
    area.innerHTML = `<div class="p-6 text-red-400">Unable to load dashboard: ${err.message}</div>`;
  }
}

async function renderMembers(area) {
  if (currentUser.role !== 'admin') {
    area.innerHTML = `<div class="fade-in"><h2 class="font-display text-2xl mb-4">Members</h2><p class="text-[#8a8a9a]">Only administrators can manage members.</p></div>`;
    return;
  }

  renderLoading(area);
  try {
    const response = await api.getMembers();
    const members = response.data || [];
    area.innerHTML = `<div class="fade-in"><div class="flex items-center justify-between mb-4"><h2 class="font-display text-2xl">Members</h2><button id="add-member-btn" class="bg-[#e94560] hover:bg-[#d63d56] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><i data-lucide="plus" style="width:14px;height:14px;"></i>Add</button></div>
      <div id="member-form" class="hidden bg-[#1a1a2e] rounded-xl p-4 mb-4 space-y-3">
        <input id="mem-username" placeholder="Username" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
        <input id="mem-email" placeholder="Email" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
        <input id="mem-fullname" placeholder="Full name" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
        <input id="mem-password" type="password" placeholder="Password" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
        <button id="save-member-btn" class="bg-[#e94560] text-white px-4 py-2 rounded-lg text-sm">Save</button>
      </div>
      <div class="space-y-2">${members
        .map(
          (member) => `<div class="bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between"><div><div class="font-medium text-sm">${member.full_name || member.username}</div><div class="text-xs text-[#8a8a9a]">${member.email || ''}</div></div><button class="del-member text-[#8a8a9a] hover:text-[#e94560]" data-id="${member.id}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button></div>`
        )
        .join('') || '<p class="text-[#8a8a9a] text-sm">No members yet</p>'}</div></div>`;

    document.getElementById('add-member-btn').addEventListener('click', () => document.getElementById('member-form').classList.toggle('hidden'));
    document.getElementById('save-member-btn').addEventListener('click', async () => {
      const username = document.getElementById('mem-username').value.trim();
      const email = document.getElementById('mem-email').value.trim();
      const fullName = document.getElementById('mem-fullname').value.trim();
      const password = document.getElementById('mem-password').value;
      if (!username || !email || !password) {
        showToast('Username, email, and password are required');
        return;
      }
      try {
        await api.addMember(username, email, password, fullName);
        showToast('Member added');
        await renderMembers(area);
      } catch (err) {
        showToast(err.message || 'Unable to add member');
      }
    });

    area.querySelectorAll('.del-member').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const memberId = btn.dataset.id;
        try {
          await api.removeMember(memberId);
          showToast('Member removed');
          await renderMembers(area);
        } catch (err) {
          showToast(err.message || 'Unable to remove member');
        }
      });
    });
  } catch (err) {
    area.innerHTML = `<div class="p-6 text-red-400">Unable to load members: ${err.message}</div>`;
  }
}

async function renderMeals(area) {
  renderLoading(area);
  try {
    if (currentUser.role === 'member' && !currentMember?.id) {
      area.innerHTML = `<div class="p-6 text-red-400">Member profile not found. Please contact your administrator.</div>`;
      return;
    }
    const mealsResponse = await api.getMealHistory(currentUser.role !== 'member' ? null : currentMember.id);
    const meals = mealsResponse.data || [];

    if (currentUser.role !== 'member') {
      area.innerHTML = `<div class="fade-in"><div class="flex items-center justify-between mb-4"><h2 class="font-display text-2xl">Meal Tracking</h2><button id="add-meal-btn" class="bg-[#e94560] hover:bg-[#d63d56] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><i data-lucide="plus" style="width:14px;height:14px;"></i>Log Meal</button></div>
        <div id="meal-form" class="hidden bg-[#1a1a2e] rounded-xl p-4 mb-4 space-y-3">
          <input id="meal-member" placeholder="Member ID" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
          <select id="meal-type-sel" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8]"><option>Breakfast</option><option>Lunch</option><option>Dinner</option></select>
          <input id="meal-date" type="date" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
          <button id="save-meal-btn" class="bg-[#e94560] text-white px-4 py-2 rounded-lg text-sm">Save</button>
        </div>
        <div class="overflow-x-auto bg-[#1a1a2e] rounded-xl">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[#2a2a4a]">
                <th class="px-4 py-3 text-left text-[#e94560]">Member</th>
                <th class="px-4 py-3 text-center text-[#e94560]">Type</th>
                <th class="px-4 py-3 text-center text-[#e94560]">Date</th>
                <th class="px-4 py-3 text-center text-[#e94560]">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${meals
                .map(
                  (meal) => `<tr class="border-b border-[#2a2a4a] hover:bg-[#16162a] transition"><td class="px-4 py-3"><div class="font-medium">${meal.member_id}</div></td><td class="px-4 py-3 text-center">${meal.meal_type}</td><td class="px-4 py-3 text-center">${formatDate(meal.meal_date)}</td><td class="px-4 py-3 text-center">${meal.quantity || 1}</td></tr>`
                )
                .join('') || '<tr><td colspan="4" class="px-4 py-3 text-center text-[#8a8a9a]">No meals recorded</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;

      document.getElementById('add-meal-btn').addEventListener('click', () => document.getElementById('meal-form').classList.toggle('hidden'));
      document.getElementById('save-meal-btn').addEventListener('click', async () => {
        const memberId = document.getElementById('meal-member').value.trim();
        const mealType = document.getElementById('meal-type-sel').value;
        const mealDate = document.getElementById('meal-date').value;
        if (!memberId || !mealDate) {
          showToast('Fill all fields');
          return;
        }
        try {
          await api.recordMeal(memberId, mealDate, mealType);
          showToast('Meal logged');
          await renderMeals(area);
        } catch (err) {
          showToast(err.message || 'Unable to record meal');
        }
      });
    } else {
      area.innerHTML = `<div class="fade-in"><h2 class="font-display text-2xl mb-4">My Meals</h2>
        <div class="space-y-2">${meals
          .slice(-20)
          .reverse()
          .map(
            (meal) => `<div class="bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between"><div><span class="text-sm font-medium">${meal.meal_type || 'Meal'}</span></div><span class="text-xs text-[#8a8a9a]">${formatDate(meal.meal_date)}</span></div>`
          )
          .join('') || '<p class="text-[#8a8a9a] text-sm">No meals recorded</p>'}</div></div>`;
    }
  } catch (err) {
    area.innerHTML = `<div class="p-6 text-red-400">Unable to load meals: ${err.message}</div>`;
  }
}

async function renderBilling(area) {
  renderLoading(area);
  try {
    if (currentUser.role !== 'member') {
      const statsResp = await api.getMessStats();
      const settingsResp = await api.getSettings();
      const billsResp = await api.getBills();
      const stats = statsResp.data || {};
      const settings = settingsResp.data || {};
      const bills = billsResp.data || [];
      const defaultMonth = new Date().toISOString().slice(0, 7);
      area.innerHTML = `<div class="fade-in"><h2 class="font-display text-2xl mb-4">Billing</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          ${statCard('Total Meals', stats.total_meals || 0, 'utensils')}
          ${statCard('Collected', '₹' + (stats.total_collected || 0), 'indian-rupee')}
          ${statCard('Due', '₹' + (stats.total_due || 0), 'alert-circle')}
          ${statCard('Expenses', '₹' + (stats.total_expenses || 0), 'credit-card')}
        </div>
        <div class="bg-[#1a1a2e] rounded-xl p-4 mb-6">
          <h3 class="font-semibold text-lg mb-3">Generate monthly bills</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input id="bill-month" type="month" value="${defaultMonth}" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]" />
            <input id="meal-rate" type="number" value="${settings.meal_rate || 50}" placeholder="Meal rate" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]" />
            <input id="fixed-cost" type="number" value="${settings.monthly_fixed_cost || 500}" placeholder="Fixed cost" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]" />
          </div>
          <button id="generate-bills-btn" class="mt-3 bg-[#e94560] hover:bg-[#d63d56] text-white px-4 py-2 rounded-lg text-sm">Generate Bills</button>
        </div>
        <div class="space-y-2">${bills
          .slice(0, 10)
          .map(
            (bill) => `<div class="bg-[#1a1a2e] rounded-lg p-3 flex justify-between"><div><span class="text-sm">${bill.full_name}</span><div class="text-xs text-[#8a8a9a]">${bill.month}</div></div><span class="text-sm font-bold text-[#e94560]">₹${bill.due_amount}</span></div>`
          )
          .join('') || '<p class="text-[#8a8a9a] text-sm">No billing data</p>'}</div></div>`;
      document.getElementById('generate-bills-btn').addEventListener('click', async () => {
        const month = document.getElementById('bill-month').value;
        const mealRate = Number(document.getElementById('meal-rate').value);
        const fixedCost = Number(document.getElementById('fixed-cost').value);
        if (!month || !mealRate || isNaN(fixedCost)) {
          showToast('Fill all bill generation fields');
          return;
        }
        try {
          await api.generateBills(month, mealRate, fixedCost);
          showToast('Bills generated successfully');
          await renderBilling(area);
        } catch (err) {
          showToast(err.message || 'Unable to generate bills');
        }
      });
    } else {
      if (!currentMember?.id) {
        area.innerHTML = `<div class="p-6 text-red-400">Member profile not found. Please contact your administrator.</div>`;
        return;
      }
      const billsResp = await api.getMemberBillStatus(currentMember.id);
      const bills = billsResp.data || [];
      area.innerHTML = `<div class="fade-in"><h2 class="font-display text-2xl mb-4">My Bills</h2>
        <div class="space-y-3">${bills
          .map(
            (bill) => `<div class="bg-[#1a1a2e] rounded-xl p-4"><div class="flex justify-between items-center"><div><p class="text-sm font-medium">${bill.month}</p><p class="text-xs text-[#8a8a9a]">Total ₹${bill.total_amount}</p></div><span class="text-sm font-bold text-[#e94560]">${bill.status}</span></div><p class="text-xs text-[#8a8a9a] mt-2">Due ₹${bill.due_amount}</p></div>`
          )
          .join('') || '<p class="text-[#8a8a9a] text-sm">No bills found</p>'}</div></div>`;
    }
  } catch (err) {
    area.innerHTML = `<div class="p-6 text-red-400">Unable to load billing: ${err.message}</div>`;
  }
}

async function renderPayments(area) {
  renderLoading(area);
  try {
    if (currentUser.role !== 'member') {
      const response = await api.getPayments();
      const payments = response.data || [];
      area.innerHTML = `<div class="fade-in"><div class="flex items-center justify-between mb-4"><h2 class="font-display text-2xl">Payments</h2><button id="add-pay-btn" class="bg-[#e94560] hover:bg-[#d63d56] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><i data-lucide="plus" style="width:14px;height:14px;"></i>Record</button></div>
        <div id="pay-form" class="hidden bg-[#1a1a2e] rounded-xl p-4 mb-4 space-y-3">
          <input id="pay-member" placeholder="Member ID" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
          <input id="pay-bill" placeholder="Bill ID" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
          <input id="pay-amount" type="number" placeholder="Amount" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
          <button id="save-pay-btn" class="bg-[#e94560] text-white px-4 py-2 rounded-lg text-sm">Save</button>
        </div>
        <div class="space-y-2">${payments
          .map(
            (payment) => `<div class="bg-[#1a1a2e] rounded-lg p-3 flex justify-between"><div><span class="text-sm">${payment.full_name || payment.member_id}</span><div class="text-xs text-[#8a8a9a]">${payment.month || ''}</div></div><span class="text-sm font-bold text-green-400">₹${payment.amount}</span></div>`
          )
          .join('') || '<p class="text-[#8a8a9a] text-sm">No payments</p>'}</div></div>`;

      document.getElementById('add-pay-btn').addEventListener('click', () => document.getElementById('pay-form').classList.toggle('hidden'));
      document.getElementById('save-pay-btn').addEventListener('click', async () => {
        const memberId = document.getElementById('pay-member').value.trim();
        const billId = document.getElementById('pay-bill').value.trim();
        const amount = Number(document.getElementById('pay-amount').value);
        if (!memberId || !billId || !amount) {
          showToast('Fill all fields');
          return;
        }
        try {
          await api.recordPayment(memberId, billId, amount);
          showToast('Payment recorded');
          await renderPayments(area);
        } catch (err) {
          showToast(err.message || 'Unable to record payment');
        }
      });
    } else {
      if (!currentMember?.id) {
        area.innerHTML = `<div class="p-6 text-red-400">Member profile not found. Please contact your administrator.</div>`;
        return;
      }
      const response = await api.getPaymentHistory(currentMember.id);
      const payments = response.data || [];
      area.innerHTML = `<div class="fade-in"><h2 class="font-display text-2xl mb-4">Payment History</h2>
        <div class="space-y-2">${payments
          .map(
            (payment) => `<div class="bg-[#1a1a2e] rounded-lg p-3 flex justify-between"><div><span class="text-sm">${payment.month || ''}</span><div class="text-xs text-[#8a8a9a]">${payment.payment_method || 'cash'}</div></div><span class="text-sm font-bold text-green-400">₹${payment.amount}</span></div>`
          )
          .join('') || '<p class="text-[#8a8a9a] text-sm">No payments recorded</p>'}</div></div>`;
    }
  } catch (err) {
    area.innerHTML = `<div class="p-6 text-red-400">Unable to load payments: ${err.message}</div>`;
  }
}

async function renderMenu(area) {
  renderLoading(area);
  try {
    const response = await api.getMenu();
    const menus = response.data || [];
    area.innerHTML = `<div class="fade-in"><div class="flex items-center justify-between mb-4"><h2 class="font-display text-2xl">Menu</h2>${
      currentUser.role !== 'member'
        ? `<button id="add-menu-btn" class="bg-[#e94560] hover:bg-[#d63d56] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><i data-lucide="plus" style="width:14px;height:14px;"></i>Add</button>`
        : ''
    }</div>
      <div id="menu-form" class="hidden bg-[#1a1a2e] rounded-xl p-4 mb-4 space-y-3">
        <input id="menu-date" type="date" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
        <select id="menu-type" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8]"><option>Breakfast</option><option>Lunch</option><option>Dinner</option></select>
        <input id="menu-items-inp" placeholder="Items (comma separated)" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
        <button id="save-menu-btn" class="bg-[#e94560] text-white px-4 py-2 rounded-lg text-sm">Save</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${menus
        .map(
          (item) => `<div class="bg-[#1a1a2e] rounded-xl p-4 card-hover"><h3 class="font-semibold text-sm text-[#e94560] mb-1">${formatDate(item.menu_date)} · ${item.meal_type}</h3><p class="text-sm text-[#8a8a9a]">${item.items}</p></div>`
        )
        .join('') || '<p class="text-[#8a8a9a] text-sm">No menu set</p>'}</div></div>`;

    if (currentUser.role !== 'member') {
      document.getElementById('add-menu-btn').addEventListener('click', () => document.getElementById('menu-form').classList.toggle('hidden'));
      document.getElementById('save-menu-btn').addEventListener('click', async () => {
        const menuDate = document.getElementById('menu-date').value;
        const mealType = document.getElementById('menu-type').value;
        const items = document.getElementById('menu-items-inp').value.trim();
        if (!menuDate || !items) {
          showToast('Choose a date and add items');
          return;
        }
        try {
          await api.addMenuItems(menuDate, mealType, items);
          showToast('Menu item saved');
          await renderMenu(area);
        } catch (err) {
          showToast(err.message || 'Unable to save menu');
        }
      });
    }
  } catch (err) {
    area.innerHTML = `<div class="p-6 text-red-400">Unable to load menu: ${err.message}</div>`;
  }
}

async function renderExpenses(area) {
  renderLoading(area);
  try {
    const response = await api.getExpenses();
    const expenses = response.data || [];
    const categories = ['groceries', 'market', 'utilities', 'rent', 'salary', 'maintenance', 'other'];
    area.innerHTML = `<div class="fade-in"><div class="flex items-center justify-between mb-4"><h2 class="font-display text-2xl">Expenses</h2><button id="add-expense-btn" class="bg-[#e94560] hover:bg-[#d63d56] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><i data-lucide="plus" style="width:14px;height:14px;"></i>Add Expense</button></div>
      <div id="expense-form" class="hidden bg-[#1a1a2e] rounded-xl p-4 mb-4 space-y-3">
        <select id="expense-category" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
          ${categories.map((cat) => `<option value="${cat}">${cat}</option>`).join('')}
        </select>
        <input id="expense-amount" type="number" placeholder="Amount" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]" />
        <input id="expense-date" type="date" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]" />
        <textarea id="expense-desc" placeholder="Description" rows="3" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560] resize-none"></textarea>
        <button id="save-expense-btn" class="bg-[#e94560] text-white px-4 py-2 rounded-lg text-sm">Save Expense</button>
      </div>
      <div class="space-y-3">${expenses
        .map(
          (expense) => `<div class="bg-[#1a1a2e] rounded-xl p-4 card-hover"><div class="flex justify-between items-start gap-4"><div><div class="font-semibold text-sm text-[#e94560]">${expense.category}</div><p class="text-sm text-[#e8e8e8]">₹${expense.amount} · ${formatDate(expense.expense_date)}</p><p class="text-xs text-[#8a8a9a] mt-2">${expense.description || 'No description'}</p><p class="text-xs text-[#8a8a9a] mt-1">Entered by ${expense.entered_by || 'admin'}</p></div><button class="delete-expense text-[#8a8a9a] hover:text-[#e94560]" data-id="${expense.id}"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></button></div></div>`
        )
        .join('') || '<p class="text-[#8a8a9a] text-sm">No expenses recorded</p>'}</div></div>`;

    document.getElementById('add-expense-btn').addEventListener('click', () => document.getElementById('expense-form').classList.toggle('hidden'));
    document.getElementById('save-expense-btn').addEventListener('click', async () => {
      const category = document.getElementById('expense-category').value;
      const amount = Number(document.getElementById('expense-amount').value);
      const expenseDate = document.getElementById('expense-date').value;
      const description = document.getElementById('expense-desc').value.trim();
      if (!category || !amount) {
        showToast('Category and amount are required');
        return;
      }
      try {
        await api.addExpense(category, amount, description, expenseDate);
        showToast('Expense added');
        await renderExpenses(area);
      } catch (err) {
        showToast(err.message || 'Unable to add expense');
      }
    });

    area.querySelectorAll('.delete-expense').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api.deleteExpense(btn.dataset.id);
          showToast('Expense removed');
          await renderExpenses(area);
        } catch (err) {
          showToast(err.message || 'Unable to remove expense');
        }
      });
    });
  } catch (err) {
    area.innerHTML = `<div class="p-6 text-red-400">Unable to load expenses: ${err.message}</div>`;
  }
}

async function renderSettings(area) {
  renderLoading(area);
  try {
    const response = await api.getSettings();
    const settings = response.data || {};
    area.innerHTML = `<div class="fade-in"><h2 class="font-display text-2xl mb-4">Settings</h2>
      <div class="bg-[#1a1a2e] rounded-xl p-6 space-y-4">
        <div>
          <label class="block text-sm text-[#8a8a9a] mb-2">Mess Name</label>
          <input id="settings-mess-name" value="${settings.mess_name || 'MealNest Mess'}" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-4 py-3 text-[#e8e8e8] focus:outline-none focus:border-[#e94560]" />
        </div>
        <div>
          <label class="block text-sm text-[#8a8a9a] mb-2">Meal Rate</label>
          <input id="settings-meal-rate" type="number" value="${settings.meal_rate || 100}" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-4 py-3 text-[#e8e8e8] focus:outline-none focus:border-[#e94560]" />
        </div>
        <div>
          <label class="block text-sm text-[#8a8a9a] mb-2">Monthly Fixed Cost</label>
          <input id="settings-fixed-cost" type="number" value="${settings.monthly_fixed_cost || 500}" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-4 py-3 text-[#e8e8e8] focus:outline-none focus:border-[#e94560]" />
        </div>
        <button id="save-settings-btn" class="bg-[#e94560] hover:bg-[#d63d56] text-white px-4 py-3 rounded-lg text-sm">Save Settings</button>
      </div></div>`;

    document.getElementById('save-settings-btn').addEventListener('click', async () => {
      const messName = document.getElementById('settings-mess-name').value.trim();
      const mealRate = Number(document.getElementById('settings-meal-rate').value);
      const monthlyFixedCost = Number(document.getElementById('settings-fixed-cost').value);

      if (!messName || !mealRate || Number.isNaN(monthlyFixedCost)) {
        showToast('Please fill all settings fields');
        return;
      }

      try {
        await api.updateSettings({ messName, mealRate, monthlyFixedCost });
        showToast('Settings saved');
      } catch (err) {
        showToast(err.message || 'Unable to save settings');
      }
    });
  } catch (err) {
    area.innerHTML = `<div class="p-6 text-red-400">Unable to load settings: ${err.message}</div>`;
  }
}

async function renderNotices(area) {
  renderLoading(area);
  try {
    const response = await api.getNotices();
    const notices = response.data || [];
    area.innerHTML = `<div class="fade-in"><div class="flex items-center justify-between mb-4"><h2 class="font-display text-2xl">Notices</h2>${
      currentUser.role !== 'member'
        ? `<button id="add-notice-btn" class="bg-[#e94560] hover:bg-[#d63d56] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><i data-lucide="plus" style="width:14px;height:14px;"></i>Post</button>`
        : ''
    }</div>
      <div id="notice-form" class="hidden bg-[#1a1a2e] rounded-xl p-4 mb-4 space-y-3">
        <input id="notice-title" placeholder="Title" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
        <textarea id="notice-text" placeholder="Write notice..." rows="3" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560] resize-none"></textarea>
        <button id="save-notice-btn" class="bg-[#e94560] text-white px-4 py-2 rounded-lg text-sm">Post</button>
      </div>
      <div class="space-y-3">${notices
        .map(
          (notice) => `<div class="bg-[#1a1a2e] rounded-xl p-4 card-hover"><h3 class="font-semibold text-sm text-[#e94560] mb-1">${notice.title}</h3><p class="text-sm text-[#8a8a9a]">${notice.content}</p><p class="text-xs text-[#8a8a9a] mt-2">${formatDate(notice.created_at)}</p></div>`
        )
        .join('') || '<p class="text-[#8a8a9a] text-sm">No notices</p>'}</div></div>`;

    if (currentUser.role !== 'member') {
      document.getElementById('add-notice-btn').addEventListener('click', () => document.getElementById('notice-form').classList.toggle('hidden'));
      document.getElementById('save-notice-btn').addEventListener('click', async () => {
        const title = document.getElementById('notice-title').value.trim();
        const content = document.getElementById('notice-text').value.trim();
        if (!title || !content) {
          showToast('Write title and message');
          return;
        }
        try {
          await api.postNotice(title, content);
          showToast('Notice posted');
          await renderNotices(area);
        } catch (err) {
          showToast(err.message || 'Unable to post notice');
        }
      });
    }
  } catch (err) {
    area.innerHTML = `<div class="p-6 text-red-400">Unable to load notices: ${err.message}</div>`;
  }
}

async function renderComplaints(area) {
  renderLoading(area);
  try {
    const response = await api.getComplaints();
    const complaints = response.data || [];
    area.innerHTML = `<div class="fade-in"><div class="flex items-center justify-between mb-4"><h2 class="font-display text-2xl">Complaints</h2><button id="add-comp-btn" class="bg-[#e94560] hover:bg-[#d63d56] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><i data-lucide="plus" style="width:14px;height:14px;"></i>Submit</button></div>
      <div id="comp-form" class="hidden bg-[#1a1a2e] rounded-xl p-4 mb-4 space-y-3">
        <input id="comp-title" placeholder="Subject" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560]">
        <textarea id="comp-text" placeholder="Describe your issue..." rows="3" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#e94560] resize-none"></textarea>
        <select id="comp-type" class="w-full bg-[#16162a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#e8e8e8]"><option value="food">Food quality</option><option value="service">Service</option><option value="other">Other</option></select>
        <button id="save-comp-btn" class="bg-[#e94560] text-white px-4 py-2 rounded-lg text-sm">Submit</button>
      </div>
      <div class="space-y-3">${complaints
        .map(
          (complaint) => `<div class="bg-[#1a1a2e] rounded-xl p-4 card-hover"><h3 class="text-sm font-semibold">${complaint.title}</h3><p class="text-sm text-[#8a8a9a] mt-1">${complaint.description}</p><div class="flex justify-between items-center mt-3"><span class="text-xs text-[#8a8a9a]">${complaint.member_name || ''}</span><span class="text-xs px-2 py-0.5 rounded-full ${complaint.status === 'resolved' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}">${complaint.status || 'open'}</span></div>${
            currentUser.role !== 'member' && complaint.status !== 'resolved'
              ? `<button class="resolve-btn mt-2 text-xs text-[#e94560] hover:underline" data-id="${complaint.id}">Mark Resolved</button>`
              : ''
          }</div>`
        )
        .join('') || '<p class="text-[#8a8a9a] text-sm">No complaints</p>'}</div></div>`;

    document.getElementById('add-comp-btn').addEventListener('click', () => document.getElementById('comp-form').classList.toggle('hidden'));
    document.getElementById('save-comp-btn').addEventListener('click', async () => {
      const title = document.getElementById('comp-title').value.trim();
      const description = document.getElementById('comp-text').value.trim();
      const complaintType = document.getElementById('comp-type').value;
      if (!title || !description) {
        showToast('Please enter a title and description');
        return;
      }
      try {
        await api.submitComplaint(title, description, complaintType);
        showToast('Complaint submitted');
        await renderComplaints(area);
      } catch (err) {
        showToast(err.message || 'Unable to submit complaint');
      }
    });

    area.querySelectorAll('.resolve-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api.updateComplaintStatus(btn.dataset.id, 'resolved');
          showToast('Complaint resolved');
          await renderComplaints(area);
        } catch (err) {
          showToast(err.message || 'Unable to update complaint');
        }
      });
    });
  } catch (err) {
    area.innerHTML = `<div class="p-6 text-red-400">Unable to load complaints: ${err.message}</div>`;
  }
}
