// ============================================
// TALAEN FARM - API Service
// ============================================

class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_URL;
        this.token = localStorage.getItem(CONFIG.TOKEN_KEY);
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem(CONFIG.TOKEN_KEY, token);
        } else {
            localStorage.removeItem(CONFIG.TOKEN_KEY);
        }
    }

    // Get auth headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // Generic request method
    async request(endpoint, method = 'GET', body = null) {
        try {
            const options = {
                method,
                headers: this.getHeaders()
            };

            if (body && method !== 'GET') {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, 'GET');
    }

    // POST request
    async post(endpoint, body) {
        return this.request(endpoint, 'POST', body);
    }

    // PUT request
    async put(endpoint, body) {
        return this.request(endpoint, 'PUT', body);
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, 'DELETE');
    }

    // ============================================
    // AUTH ENDPOINTS
    // ============================================
    async login(username, password) {
        return this.post('/auth/login', { username, password });
    }

    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async getProfile() {
        return this.get('/auth/me');
    }

    async changePassword(currentPassword, newPassword) {
        return this.post('/auth/change-password', {
            current_password: currentPassword,
            new_password: newPassword
        });
    }

    async getUsers() {
        return this.get('/auth/users');
    }

    // ============================================
    // USER MANAGEMENT ENDPOINTS
    // ============================================
    async updateUser(userId, userData) {
        return this.put(`/auth/users/${userId}`, userData);
    }

    async resetUserPassword(userId, newPassword) {
        return this.post(`/auth/reset-password/${userId}`, { password: newPassword });
    }

    // ============================================
    // TEA MODULE ENDPOINTS
    // ============================================
    
    // Workers
    async getTeaWorkers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/tea/workers${query ? '?' + query : ''}`);
    }

    async getTeaWorkerStats(workerId) {
        return this.get(`/tea/workers/${workerId}/stats`);
    }

    async createTeaWorker(workerData) {
        return this.post('/tea/workers', workerData);
    }

    async updateTeaWorker(id, workerData) {
        return this.put(`/tea/workers/${id}`, workerData);
    }

    // Companies
    async getCompanies() {
        return this.get('/tea/companies');
    }

    async getCompanyStats(companyId) {
        return this.get(`/tea/companies/${companyId}/stats`);
    }

    async createCompany(companyData) {
        return this.post('/tea/companies', companyData);
    }

    async updateCompany(id, companyData) {
        return this.put(`/tea/companies/${id}`, companyData);
    }

    // Blocks
    async getBlocks() {
        return this.get('/tea/blocks');
    }

    async createBlock(blockData) {
        return this.post('/tea/blocks', blockData);
    }

    // Wage Rate
    async getWageRate() {
        return this.get('/tea/wage-rate');
    }

    async getWageRateHistory() {
        return this.get('/tea/wage-rate/history');
    }

    async setWageRate(wageData) {
        return this.post('/tea/wage-rate', wageData);
    }

    async getWageRateImpact(proposedRate) {
        return this.get(`/tea/wage-rate/impact?proposed_rate=${proposedRate}`);
    }

    // Plucking Self
    async recordSelfPlucking(pluckingData) {
        return this.post('/tea/plucking/self', pluckingData);
    }

    async getSelfPlucking(workerId = null) {
        const endpoint = workerId ? `/tea/plucking/self/${workerId}` : '/tea/plucking/self';
        return this.get(endpoint);
    }

    async updateSelfPlucking(id, pluckingData) {
        return this.put(`/tea/plucking/self/${id}`, pluckingData);
    }

    async deleteSelfPlucking(id) {
        return this.delete(`/tea/plucking/self/${id}`);
    }

    async checkWorkerPlucking(workerId, date = null) {
        const endpoint = `/tea/plucking/check/${workerId}${date ? '?date=' + date : ''}`;
        return this.get(endpoint);
    }

    // Plucking Verified
    async recordVerifiedPlucking(pluckingData) {
        return this.post('/tea/plucking/verified', pluckingData);
    }

    async getVerifiedPlucking(workerId = null) {
        const endpoint = workerId ? `/tea/plucking/verified/${workerId}` : '/tea/plucking/verified';
        return this.get(endpoint);
    }

    async updateVerifiedPlucking(id, pluckingData) {
        return this.put(`/tea/plucking/verified/${id}`, pluckingData);
    }

    async deleteVerifiedPlucking(id) {
        return this.delete(`/tea/plucking/verified/${id}`);
    }

    async checkVerifiedPlucking(workerId, date = null) {
        const endpoint = `/tea/plucking/verified/check/${workerId}${date ? '?date=' + date : ''}`;
        return this.get(endpoint);
    }

    // Comparison
    async getComparison(workerId, date = null) {
        let endpoint = `/tea/comparison/${workerId}`;
        if (date) endpoint += `?date=${date}`;
        return this.get(endpoint);
    }

    // Debts
    async getDebts(workerId = null) {
        const endpoint = workerId ? `/tea/debts/${workerId}` : '/tea/debts';
        return this.get(endpoint);
    }

    async addDebt(debtData) {
        return this.post('/tea/debts', debtData);
    }

    async reverseDebt(debtId, reason) {
        return this.post(`/tea/debts/${debtId}/reverse`, { reason });
    }

    // Payments
    async payWorker(workerId) {
        return this.post('/tea/pay-worker', { worker_id: workerId });
    }

    async payStore() {
        return this.post('/tea/pay-store');
    }

    // Reports
    async getTeaDashboard() {
        return this.get('/tea/dashboard');
    }

    async getProfitReport() {
        return this.get('/tea/reports/profit');
    }

    // ============================================
    // DAIRY MODULE ENDPOINTS
    // ============================================

    // Cows
    async getCows() {
        return this.get('/dairy/cows');
    }

    async createCow(cowData) {
        return this.post('/dairy/cows', cowData);
    }

    async updateCow(id, cowData) {
        return this.put(`/dairy/cows/${id}`, cowData);
    }

    async deleteCow(id) {
        return this.delete(`/dairy/cows/${id}`);
    }

    // Dairy Workers
    async getDairyWorkers() {
        return this.get('/dairy/workers');
    }

    async createDairyWorker(workerData) {
        return this.post('/dairy/workers', workerData);
    }

    async updateDairyWorker(id, workerData) {
        return this.put(`/dairy/workers/${id}`, workerData);
    }

    // Milk Buyers
    async getMilkBuyers() {
        return this.get('/dairy/buyers');
    }

    async createMilkBuyer(buyerData) {
        return this.post('/dairy/buyers', buyerData);
    }

    async updateMilkBuyer(id, buyerData) {
        return this.put(`/dairy/buyers/${id}`, buyerData);
    }

    // Milk Production
    async recordMilkProduction(productionData) {
        return this.post('/dairy/production', productionData);
    }

    async getMilkProduction(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/dairy/production?${query}`);
    }

    // Milk Disposal
    async recordMilkDisposal(disposalData) {
        return this.post('/dairy/disposal', disposalData);
    }

    async getMilkDisposal(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/dairy/disposal?${query}`);
    }

    // Feed
    async recordFeed(feedData) {
        return this.post('/dairy/feed', feedData);
    }

    async getFeed(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/dairy/feed?${query}`);
    }

    // Dairy Payments
    async payDairyWorker(paymentData) {
        return this.post('/dairy/pay-worker', paymentData);
    }

    async getDairyPayments(workerId = null) {
        const endpoint = workerId ? `/dairy/payments/${workerId}` : '/dairy/payments';
        return this.get(endpoint);
    }

    // Buyer Deliveries
    async createDelivery(deliveryData) {
        return this.post('/dairy/deliveries', deliveryData);
    }

    async getDeliveries() {
        return this.get('/dairy/deliveries');
    }

    async confirmDelivery(id, litresConfirmed) {
        return this.put(`/dairy/deliveries/${id}/confirm`, { litres_confirmed: litresConfirmed });
    }

    // Buyer Payments
    async recordBuyerPayment(paymentData) {
        return this.post('/dairy/buyer-payments', paymentData);
    }

    async getBuyerPayments() {
        return this.get('/dairy/buyer-payments');
    }

    // Dairy Dashboard & Reports
    async getDairyDashboard() {
        return this.get('/dairy/dashboard');
    }

    async getDairyReport(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/dairy/reports/summary?${query}`);
    }
}

// Create global API instance
const api = new ApiService();
