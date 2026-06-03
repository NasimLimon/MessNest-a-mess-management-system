const API_BASE = 'http://localhost:3000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: this.getHeaders()
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'API Error');
    return data;
  }

  // Auth
  async register(username, email, password, fullName) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, fullName })
    });
    this.setToken(data.token);
    return data;
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.token);
    return data;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Members
  async getMembers() {
    return this.request('/members');
  }

  async getMember(id) {
    return this.request(`/members/${id}`);
  }

  async addMember(username, email, password, fullName, phone) {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, fullName, phone })
    });
  }

  async updateMember(id, updates) {
    return this.request(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async removeMember(id) {
    return this.request(`/members/${id}`, { method: 'DELETE' });
  }

  // Meals
  async recordMeal(memberId, mealDate, mealType, quantity = 1) {
    return this.request('/meals', {
      method: 'POST',
      body: JSON.stringify({ memberId, mealDate, mealType, quantity })
    });
  }

  async getMealHistory(memberId, month) {
    return this.request(`/meals${memberId ? '?memberId=' + memberId : ''}${month ? '&month=' + month : ''}`);
  }

  async getMonthlySummary(memberId, month) {
    return this.request(`/meals/summary/monthly?memberId=${memberId}&month=${month}`);
  }

  async getMemberMeals(memberId, month) {
    return this.request(`/meals/member/${memberId}${month ? '?month=' + month : ''}`);
  }

  // Billing
  async generateBills(month) {
    return this.request('/billing/generate', {
      method: 'POST',
      body: JSON.stringify({ month })
    });
  }

  async getBills(memberId, month) {
    return this.request(`/billing${memberId ? '?memberId=' + memberId : ''}${month ? '&month=' + month : ''}`);
  }

  async getBillDetails(billId) {
    return this.request(`/billing/details/${billId}`);
  }

  async getMessStats(month) {
    return this.request(`/billing/stats/mess${month ? '?month=' + month : ''}`);
  }

  // Payments
  async recordPayment(memberId, billId, amount, paymentMethod = 'cash') {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify({ memberId, billId, amount, paymentMethod })
    });
  }

  async getPayments(memberId, billId, month) {
    let url = '/payments?';
    if (memberId) url += `memberId=${memberId}&`;
    if (billId) url += `billId=${billId}&`;
    if (month) url += `month=${month}`;
    return this.request(url);
  }

  async getPaymentHistory(memberId) {
    return this.request(`/payments/history/${memberId}`);
  }

  async getMemberBillStatus(memberId) {
    return this.request(`/payments/status/${memberId}`);
  }

  // Menu
  async addMenuItems(menuDate, mealType, items) {
    return this.request('/menu', {
      method: 'POST',
      body: JSON.stringify({ menuDate, mealType, items })
    });
  }

  async getMenu(startDate, endDate, mealType) {
    let url = '/menu?';
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;
    if (mealType) url += `mealType=${mealType}`;
    return this.request(url);
  }

  async getTodayMenu() {
    return this.request('/menu/today');
  }

  // Notices
  async postNotice(title, content, priority = 'medium', expiresAt) {
    return this.request('/notices', {
      method: 'POST',
      body: JSON.stringify({ title, content, priority, expiresAt })
    });
  }

  async getNotices() {
    return this.request('/notices');
  }

  async deleteNotice(id) {
    return this.request(`/notices/${id}`, { method: 'DELETE' });
  }

  // Complaints
  async submitComplaint(title, description, complaintType) {
    return this.request('/complaints', {
      method: 'POST',
      body: JSON.stringify({ title, description, complaintType })
    });
  }

  async getComplaints(status, complaintType) {
    let url = '/complaints?';
    if (status) url += `status=${status}&`;
    if (complaintType) url += `complaintType=${complaintType}`;
    return this.request(url);
  }

  async updateComplaintStatus(id, status, response) {
    return this.request(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, response })
    });
  }

  async getMemberComplaints(memberId) {
    return this.request(`/complaints/member/${memberId}`);
  }
}

const api = new ApiClient();
