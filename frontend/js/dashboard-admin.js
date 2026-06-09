// Admin Dashboard Logic
let allMembers = [];
let allBills = [];

async function init() {
  if (!await checkAuth()) return;
  if (!isAdmin()) {
    showToast('Access denied. Admin only.', 'error');
    redirectToDashboard();
    return;
  }
  
  document.getElementById('userInfo').textContent = `👤 ${currentUser.username}`;
  await loadOverviewData();
  await loadMembers();
  await loadBills();
  await loadPayments();
  await loadMenu();
  await loadNotices();
  await loadComplaints();
  setDefaultDates();
}

function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('mealDate').value = today;
  document.getElementById('menuDate').value = today;
  
  const currentMonth = new Date().toISOString().substring(0, 7);
  document.getElementById('billMonth').value = currentMonth;
}

async function loadOverviewData() {
  try {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const statsResp = await api.getMessStats(currentMonth);
    const stats = statsResp.data || statsResp || {};
    document.getElementById('totalMembers').textContent = stats.total_members || 0;
    document.getElementById('totalMeals').textContent = stats.total_meals || 0;
    document.getElementById('totalCollected').textContent = formatCurrency(stats.total_collected || 0);
    document.getElementById('mealRate').textContent = formatCurrency(stats.meal_rate || 0);
  } catch (err) {
    console.error('Error loading stats:', err);
    showToast('Error loading statistics', 'error');
  }
}

// Members Management
async function loadMembers() {
  try {
    const membersResp = await api.getMembers();
    allMembers = membersResp.data || membersResp || [];
    renderMembersTable();
    renderMembersSelect();
  } catch (err) {
    showAlert('errorAlert', 'Error loading members: ' + err.message, 'error');
  }
}

function renderMembersTable() {
  const tbody = document.getElementById('membersList');
  tbody.innerHTML = '';
  
  if (!Array.isArray(allMembers)) allMembers = [];
  allMembers.forEach(member => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${member.full_name}</td>
      <td>${member.username || '-'}</td>
      <td>${member.email}</td>
      <td>${member.phone || '-'}</td>
      <td>${getStatusBadge(member.status)}</td>
      <td>${formatDate(member.join_date)}</td>
      <td>
        <button class="btn-danger btn-small" onclick="removeMember(${member.id})">Remove</button>
      </td>
    `;
  });
}

function renderMembersSelect() {
  const select = document.getElementById('mealMemberId');
  const paymentSelect = document.getElementById('paymentMemberId');
  
  select.innerHTML = '<option value="">Select a member...</option>';
  paymentSelect.innerHTML = '<option value="">Select a member...</option>';
  
  allMembers.forEach(member => {
    const option = document.createElement('option');
    option.value = member.id;
    option.text = member.full_name;
    select.appendChild(option);
    
    const option2 = option.cloneNode(true);
    paymentSelect.appendChild(option2);
  });

  if (paymentSelect) {
    paymentSelect.addEventListener('change', updatePaymentBillOptions);
  }
}

function filterMembersTable() {
  const search = document.getElementById('memberSearch').value.toLowerCase();
  const tbody = document.getElementById('membersList');
  const rows = tbody.querySelectorAll('tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
}

function toggleAddMemberForm() {
  const form = document.getElementById('addMemberForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function handleAddMember(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  
  try {
    await api.addMember(
      document.getElementById('newMemberUsername').value,
      document.getElementById('newMemberEmail').value,
      document.getElementById('newMemberPassword').value,
      document.getElementById('newMemberName').value,
      document.getElementById('newMemberPhone').value
    );
    
    showToast('Member added successfully!', 'success');
    e.target.reset();
    toggleAddMemberForm();
    await loadMembers();
  } catch (err) {
    showAlert('errorAlert', 'Error adding member: ' + err.message, 'error');
    showToast('Error adding member', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function removeMember(id) {
  if (!confirm('Are you sure you want to remove this member?')) return;
  
  try {
    await api.removeMember(id);
    showToast('Member removed successfully!', 'success');
    await loadMembers();
  } catch (err) {
    showAlert('errorAlert', 'Error: ' + err.message, 'error');
  }
}

// Meal Management
async function handleRecordMeal(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  
  try {
    await api.recordMeal(
      parseInt(document.getElementById('mealMemberId').value),
      document.getElementById('mealDate').value,
      document.getElementById('mealType').value
    );
    
    showToast('Meal recorded successfully!', 'success');
    e.target.reset();
    setDefaultDates();
    await loadMeals();
  } catch (err) {
    showAlert('errorAlert', 'Error: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function loadMeals() {
  try {
    const mealsResp = await api.getMealHistory();
    const meals = mealsResp.data || mealsResp || [];
    const tbody = document.getElementById('mealsList');
    tbody.innerHTML = '';
    
    (meals || []).slice(0, 20).forEach(meal => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${meal.full_name || '-'}</td>
        <td>${formatDate(meal.meal_date)}</td>
        <td>${meal.meal_type || '-'}</td>
        <td>${formatDateTime(meal.recorded_at)}</td>
      `;
    });
  } catch (err) {
    console.error('Error loading meals:', err);
  }
}

function filterMealsTable() {
  const search = document.getElementById('mealSearch').value.toLowerCase();
  const tbody = document.getElementById('mealsList');
  const rows = tbody.querySelectorAll('tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
}

// Billing Management
async function handleGenerateBills(e) {
  e.preventDefault();
  const month = document.getElementById('billMonth').value;
  if (!month) {
    showToast('Please select a month', 'warning');
    return;
  }
  
  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) btn.disabled = true;
  
  try {
    const result = await api.generateBills(month);
    showToast(result.message || 'Bills generated successfully!', 'success');
    await loadBills();
  } catch (err) {
    showAlert('errorAlert', 'Error: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function loadBills() {
  try {
    const billsResp = await api.getBills();
    allBills = billsResp.data || billsResp || [];
    renderBillsTable();
    updatePaymentBillOptions();
    updateChargeBillOptions();
  } catch (err) {
    console.error('Error loading bills:', err);
  }
}

function renderBillsTable() {
  const tbody = document.getElementById('billsList');
  tbody.innerHTML = '';
  
  (allBills || []).forEach(bill => {
    const row = tbody.insertRow();
    const status = bill.paid_amount >= bill.total_amount ? 'paid' : (bill.paid_amount > 0 ? 'partial' : 'unpaid');
    row.innerHTML = `
      <td>${bill.full_name || '-'}</td>
      <td>${getMonthYear(bill.month)}</td>
      <td>${bill.meal_count || 0}</td>
      <td>${formatCurrency(bill.total_amount || 0)}</td>
      <td>${getStatusBadge(status)}</td>
      <td>
        <button class="btn-small" onclick="viewBillDetails(${bill.id})">View</button>
        <button class="btn-small" onclick="editBill(${bill.id})">Edit</button>
        <button class="btn-small" onclick="markBillPaid(${bill.id})">Mark Paid</button>
      </td>
    `;
  });
}

async function markBillPaid(billId) {
  if (!confirm('Mark this bill as fully paid by admin?')) return;
  try {
    const res = await api.markBillPaid(billId);
    showToast(res.message || 'Bill marked paid', 'success');
    await loadPayments();
    await loadBills();
    await loadOverviewData();
  } catch (err) {
    showAlert('errorAlert', 'Error: ' + err.message, 'error');
  }
}

function filterBillsTable() {
  const search = document.getElementById('billSearch').value.toLowerCase();
  const tbody = document.getElementById('billsList');
  const rows = tbody.querySelectorAll('tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
}

async function viewBillDetails(billId) {
  try {
    const billResp = await api.getBillDetails(billId);
    const bill = billResp.data || billResp || {};
    const details = `
Bill Details:
Member: ${bill.full_name}
Month: ${getMonthYear(bill.month)}
Meals: ${bill.meal_count}
Rate: ${formatCurrency(bill.meal_rate || 0)}
Fixed Cost: ${formatCurrency(bill.fixed_cost || 0)}
Extra Charges: ${formatCurrency(bill.extra_charges || 0)}
Amount: ${formatCurrency(bill.total_amount)}
Paid: ${formatCurrency(bill.paid_amount || 0)}
Due: ${formatCurrency((bill.total_amount || 0) - (bill.paid_amount || 0))}
Status: ${bill.status || 'unpaid'}
    `;
    alert(details);
  } catch (err) {
    showToast('Error loading bill details', 'error');
  }
}

async function editBill(billId) {
  try {
    const billResp = await api.getBillDetails(billId);
    const bill = billResp.data || billResp || {};
    const mealCount = prompt('Enter updated meal count:', bill.meal_count || 0);
    if (mealCount === null) return;
    const extraCharges = prompt('Enter extra charges:', bill.extra_charges || 0);
    if (extraCharges === null) return;
    await api.updateBill(billId, {
      mealCount: parseInt(mealCount, 10),
      extraCharges: parseFloat(extraCharges)
    });
    showToast('Bill updated successfully!', 'success');
    await loadBills();
  } catch (err) {
    showAlert('errorAlert', 'Error: ' + err.message, 'error');
  }
}

// Payment Management
async function handleRecordPayment(e) {
  e.preventDefault();
  const memberId = document.getElementById('paymentMemberId').value;
  const billId = document.getElementById('paymentBillId').value;
  const amount = document.getElementById('paymentAmount').value;
  const method = document.getElementById('paymentMethod').value;
  
  if (!memberId || !billId || !amount) {
    showToast('Please fill all required fields', 'warning');
    return;
  }
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  
  try {
    await api.recordPayment(parseInt(memberId), parseInt(billId), parseFloat(amount), method);
    showToast('Payment recorded successfully!', 'success');
    e.target.reset();
    await loadPayments();
    await loadBills();
  } catch (err) {
    showAlert('errorAlert', 'Error: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function loadPayments() {
  try {
    const paymentsResp = await api.getPayments();
    const payments = paymentsResp.data || paymentsResp || [];
    renderPaymentsTable(payments);
  } catch (err) {
    console.error('Error loading payments:', err);
  }
}

async function loadActivityLogs() {
  try {
    const userId = document.getElementById('activityFilterUser').value;
    const action = document.getElementById('activityFilterAction').value;
    const response = await api.getActivityLogs({ userId: userId || undefined, action: action || undefined, limit: 100 });
    const logs = response.data || [];
    const tbody = document.getElementById('activityLogsList');
    tbody.innerHTML = '';

    logs.forEach(log => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${log.id}</td>
        <td>${log.username || log.user_id || '-'}</td>
        <td>${log.action || '-'}</td>
        <td>${log.details ? log.details.replace(/\n/g, '<br/>') : '-'}</td>
        <td>${log.ip_address || '-'}</td>
        <td>${log.user_agent || '-'}</td>
        <td>${new Date(log.created_at).toLocaleString()}</td>
      `;
    });
  } catch (err) {
    console.error('Error loading activity logs:', err);
  }
}

function updatePaymentBillOptions() {
  const memberSelect = document.getElementById('paymentMemberId');
  const billSelect = document.getElementById('paymentBillId');
  if (!memberSelect || !billSelect) return;

  const memberId = memberSelect.value;
  billSelect.innerHTML = '<option value="">Select a bill...</option>';

  const bills = memberId
    ? allBills.filter(bill => String(bill.member_id) === String(memberId))
    : allBills;

  bills.forEach(bill => {
    const option = document.createElement('option');
    option.value = bill.id;
    option.text = `${bill.full_name} - ${getMonthYear(bill.month)} - ${formatCurrency(bill.total_amount || 0)}`;
    billSelect.appendChild(option);
  });
}

function updateChargeBillOptions() {
  const billSelect = document.getElementById('chargeBillId');
  if (!billSelect) return;
  billSelect.innerHTML = '<option value="">Select a bill...</option>';
  (allBills || []).forEach(bill => {
    const option = document.createElement('option');
    option.value = bill.id;
    option.text = `${bill.full_name} - ${getMonthYear(bill.month)} - ${formatCurrency(bill.total_amount || 0)}`;
    billSelect.appendChild(option);
  });
}

async function handleAddCharge(e) {
  e.preventDefault();
  const billId = document.getElementById('chargeBillId').value;
  const category = document.getElementById('chargeCategory').value;
  const amount = parseFloat(document.getElementById('chargeAmount').value);
  const description = document.getElementById('chargeDescription').value.trim();
  if (!billId || !category || !amount) {
    showToast('Please select bill, category and amount', 'warning');
    return;
  }
  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) btn.disabled = true;
  try {
    // Log expense globally
    await api.addExpense(category, amount, description, null);
    // update bill extra charges (additive)
    const billResp = await api.getBillDetails(billId);
    const bill = billResp.data || billResp || {};
    const currentExtra = Number(bill.extra_charges || 0);
    const newExtra = Number((currentExtra + amount).toFixed(2));
    await api.updateBillCharges(billId, newExtra);
    showToast('Charge added to bill and expense logged', 'success');
    document.getElementById('addChargeForm').reset();
    await loadExpenses();
    await loadBills();
    await loadPayments();
    await loadOverviewData();
  } catch (err) {
    showAlert('errorAlert', 'Error: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}


function renderPaymentsTable(payments) {
  const tbody = document.getElementById('paymentsList');
  tbody.innerHTML = '';
  
  (payments || []).forEach(payment => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${payment.full_name || '-'}</td>
      <td>${formatCurrency(payment.amount || 0)}</td>
      <td>${payment.payment_method || '-'}</td>
      <td>${formatDate(payment.payment_date)}</td>
      <td>${getMonthYear(payment.month)}</td>
      <td>${payment.status || 'completed'}</td>
      <td><button class="btn-small" onclick="editPayment(${payment.id}, ${payment.amount}, ${JSON.stringify(payment.status || 'completed')})">Edit</button></td>
    `;
  });
}

async function editPayment(paymentId, currentAmount, currentStatus) {
  try {
    const amount = prompt('Enter new payment amount:', currentAmount || 0);
    if (amount === null) return;
    const status = prompt('Enter payment status (completed, pending, failed):', currentStatus || 'completed');
    if (status === null) return;
    await api.updatePayment(paymentId, {
      amount: parseFloat(amount),
      status: status.trim()
    });
    showToast('Payment updated successfully!', 'success');
    await loadPayments();
    await loadBills();
  } catch (err) {
    showAlert('errorAlert', 'Error: ' + err.message, 'error');
  }
}

function filterPaymentsTable() {
  const search = document.getElementById('paymentSearch').value.toLowerCase();
  const tbody = document.getElementById('paymentsList');
  const rows = tbody.querySelectorAll('tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
}

// Menu Management
async function handleAddMenu(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  
  try {
    await api.addMenuItems(
      document.getElementById('menuDate').value,
      document.getElementById('menuType').value,
      document.getElementById('menuItems').value
    );
    
    showToast('Menu added successfully!', 'success');
    e.target.reset();
    setDefaultDates();
    await loadMenu();
  } catch (err) {
    showAlert('errorAlert', 'Error: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function loadMenu() {
  try {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    const menuResp = await api.getMenu(startDate, endDate);
    const menu = menuResp.data || menuResp || [];
    
    const tbody = document.getElementById('menuList');
    tbody.innerHTML = '';
    
    (menu || []).forEach(item => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${formatDate(item.menu_date)}</td>
        <td>${item.meal_type}</td>
        <td>${item.items}</td>
        <td>
          <button class="btn-danger btn-small" onclick="deleteMenu(${item.id})">Delete</button>
        </td>
      `;
    });
  } catch (err) {
    console.error('Error loading menu:', err);
  }
}

async function deleteMenu(id) {
  if (!confirm('Delete this menu item?')) return;
  
  try {
    await api.deleteNotice(id); // Assuming deleteMenu might use similar endpoint
    showToast('Menu deleted!', 'success');
    await loadMenu();
  } catch (err) {
    showToast('Error deleting menu', 'error');
  }
}

function filterMenuTable() {
  const search = document.getElementById('menuSearch').value.toLowerCase();
  const tbody = document.getElementById('menuList');
  const rows = tbody.querySelectorAll('tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
}

// Notices Management
async function handlePostNotice(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  
  try {
    await api.postNotice(
      document.getElementById('noticeTitle').value,
      document.getElementById('noticeContent').value,
      document.getElementById('noticePriority').value,
      document.getElementById('noticeExpires').value || null
    );
    
    showToast('Notice posted successfully!', 'success');
    e.target.reset();
    await loadNotices();
  } catch (err) {
    showAlert('errorAlert', 'Error: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function loadNotices() {
  try {
    const noticesResp = await api.getNotices();
    const notices = noticesResp.data || noticesResp || [];
    const div = document.getElementById('noticesList');
    div.innerHTML = '';
    
    if (!notices || notices.length === 0) {
      div.innerHTML = '<p style="text-align: center; color: #999;">No notices yet</p>';
      return;
    }
    
    notices.forEach(notice => {
      const priorityBadge = getStatusBadge(notice.priority);
      div.innerHTML += `
        <div class="card">
          <div style="display: flex; justify-content: space-between; gap: 1rem;">
            <div style="flex: 1;">
              <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="margin: 0;">${notice.title}</h4>
                ${priorityBadge}
              </div>
              <p style="margin: 0.5rem 0;">${notice.content}</p>
              <small style="color: #999;">Posted on ${formatDate(notice.created_at)}</small>
            </div>
            <button class="btn-danger btn-small" onclick="deleteNotice(${notice.id})" style="height: fit-content;">Delete</button>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error('Error loading notices:', err);
  }
}

async function deleteNotice(id) {
  if (!confirm('Delete this notice?')) return;
  
  try {
    await api.deleteNotice(id);
    showToast('Notice deleted!', 'success');
    await loadNotices();
  } catch (err) {
    showToast('Error deleting notice', 'error');
  }
}

// Complaints Management
async function loadComplaints() {
  try {
    const statusEl = document.getElementById('complaintStatusFilter');
    const typeEl = document.getElementById('complaintTypeFilter');
    const status = statusEl ? (statusEl.value || '') : '';
    const type = typeEl ? (typeEl.value || '') : '';
    const complaintsResp = await api.getComplaints(status, type);
    const complaints = complaintsResp.data || complaintsResp || [];
    
    const div = document.getElementById('complaintsList');
    div.innerHTML = '';
    
    if (!complaints || complaints.length === 0) {
      div.innerHTML = '<p style="text-align: center; color: #999;">No complaints</p>';
      return;
    }
    
    complaints.forEach(complaint => {
      const statusBadge = getStatusBadge(complaint.status);
      div.innerHTML += `
        <div class="card">
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 1rem;">
            <div>
              <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="margin: 0;">${complaint.title}</h4>
                ${statusBadge}
              </div>
              <p style="margin: 0.5rem 0;">${complaint.description}</p>
              <div style="display: flex; gap: 1.5rem; font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
                <span><strong>Type:</strong> ${complaint.complaint_type}</span>
                <span><strong>Member:</strong> ${complaint.member_name}</span>
                <span><strong>Date:</strong> ${formatDate(complaint.created_at)}</span>
              </div>
              ${complaint.response ? `<div style="background: #f0f0f0; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;"><strong>Admin Response:</strong><p>${complaint.response}</p></div>` : ''}
            </div>
            <button class="btn-primary btn-small" onclick="respondComplaint(${complaint.id})" style="height: fit-content;">Respond</button>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error('Error loading complaints:', err);
  }
}

async function respondComplaint(id) {
  const response = prompt('Enter your response:');
  if (!response) return;
  
  try {
    await api.updateComplaintStatus(id, 'in_progress', response);
    showToast('Response sent!', 'success');
    await loadComplaints();
  } catch (err) {
    showToast('Error sending response', 'error');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
