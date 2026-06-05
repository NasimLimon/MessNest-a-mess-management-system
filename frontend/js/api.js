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
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: this.getHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
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
    let url = '/meals';
    const params = [];
    if (memberId) params.push(`memberId=${memberId}`);
    if (month) params.push(`month=${month}`);
    if (params.length) url += '?' + params.join('&');
    return this.request(url);
  }

  async getMonthlySummary(memberId, month) {
    return this.request(`/meals/summary/monthly?memberId=${memberId}&month=${month}`);
  }

  async getMemberMeals(memberId, month) {
    let url = `/meals/member/${memberId}`;
    if (month) url += `?month=${month}`;
    return this.request(url);
  }

  // Billing
  async generateBills(month) {
    return this.request('/billing/generate', {
      method: 'POST',
      body: JSON.stringify({ month })
    });
  }

  async getBills(memberId, month) {
    let url = '/billing';
    const params = [];
    if (memberId) params.push(`memberId=${memberId}`);
    if (month) params.push(`month=${month}`);
    if (params.length) url += '?' + params.join('&');
    return this.request(url);
  }

  async getBillDetails(billId) {
    return this.request(`/billing/details/${billId}`);
  }

  async getMessStats(month) {
    let url = '/billing/stats/mess';
    if (month) url += `?month=${month}`;
    return this.request(url);
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
    const params = [];
    if (memberId) params.push(`memberId=${memberId}`);
    if (billId) params.push(`billId=${billId}`);
    if (month) params.push(`month=${month}`);
    return this.request(url + params.join('&'));
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
    const params = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (mealType) params.push(`mealType=${mealType}`);
    return this.request(url + params.join('&'));
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
    const params = [];
    if (status) params.push(`status=${status}`);
    if (complaintType) params.push(`complaintType=${complaintType}`);
    return this.request(url + params.join('&'));
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

