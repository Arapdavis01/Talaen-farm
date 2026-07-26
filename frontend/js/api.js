// ============================================
// TALAEN FARM - API Service
// ============================================

class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_URL;
        this.token = localStorage.getItem(CONFIG.TOKEN_KEY);
    }

    setToken(token) {
        this.token = token;
        if (token) { localStorage.setItem(CONFIG.TOKEN_KEY, token); }
        else { localStorage.removeItem(CONFIG.TOKEN_KEY); }
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) { headers['Authorization'] = `Bearer ${this.token}`; }
        return headers;
    }

    handleSessionExpired() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        localStorage.removeItem('available_modules');
        localStorage.removeItem('current_module');
        this.token = null;
        if (typeof showToast === 'function') { showToast('Session expired. Please login again.', 'warning', 5000); }
        setTimeout(() => {
            const appContainer = document.getElementById('appContainer');
            const loginModal = document.getElementById('loginModal');
            if (appContainer) appContainer.classList.add('hidden');
            if (loginModal) { loginModal.classList.remove('hidden'); const lf = document.getElementById('loginForm'); const le = document.getElementById('loginError'); if (lf) lf.reset(); if (le) le.classList.add('hidden'); }
        }, 1000);
    }

    async request(endpoint, method = 'GET', body = null) {
        try {
            const options = { method, headers: this.getHeaders() };
            if (body && method !== 'GET') { options.body = JSON.stringify(body); }
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            if (response.status === 401 || response.status === 403) {
                const data = await response.json().catch(() => ({}));
                if (data.message === 'Invalid or expired token.' || data.message === 'Access denied. No token provided.' || data.message === 'Authentication required.') {
                    this.handleSessionExpired();
                    throw new Error('Session expired. Redirecting to login...');
                }
            }
            const data = await response.json();
            if (!response.ok) { throw new Error(data.message || 'Request failed'); }
            return data;
        } catch (error) {
            if (error.message !== 'Session expired. Redirecting to login...') { console.error(`API Error [${method} ${endpoint}]:`, error); }
            throw error;
        }
    }

    async get(endpoint) { return this.request(endpoint, 'GET'); }
    async post(endpoint, body) { return this.request(endpoint, 'POST', body); }
    async put(endpoint, body) { return this.request(endpoint, 'PUT', body); }
    async delete(endpoint) { return this.request(endpoint, 'DELETE'); }

    // ============ AUTH ============
    async login(username, password) { return this.post('/auth/login', { username, password }); }
    async register(userData) { return this.post('/auth/register', userData); }
    async getProfile() { return this.get('/auth/me'); }
    async changePassword(cp, np) { return this.post('/auth/change-password', { current_password: cp, new_password: np }); }
    async getUsers() { return this.get('/auth/users'); }

    // ============ USER MANAGEMENT ============
    async updateUser(userId, userData) { return this.put(`/auth/users/${userId}`, userData); }
    async resetUserPassword(userId, newPassword) { return this.post(`/auth/reset-password/${userId}`, { password: newPassword }); }

    // ============ TEA MODULE ============
    async getTeaWorkers(params = {}) { const q = new URLSearchParams(params).toString(); return this.get(`/tea/workers${q ? '?' + q : ''}`); }
    async getTeaWorkerStats(workerId) { return this.get(`/tea/workers/${workerId}/stats`); }
    async createTeaWorker(workerData) { return this.post('/tea/workers', workerData); }
    async updateTeaWorker(id, workerData) { return this.put(`/tea/workers/${id}`, workerData); }

    async getCompanies() { return this.get('/tea/companies'); }
    async getCompanyStats(companyId) { return this.get(`/tea/companies/${companyId}/stats`); }
    async createCompany(companyData) { return this.post('/tea/companies', companyData); }
    async updateCompany(id, companyData) { return this.put(`/tea/companies/${id}`, companyData); }

    async getBlocks() { return this.get('/tea/blocks'); }
    async createBlock(blockData) { return this.post('/tea/blocks', blockData); }

    async getWageRate() { return this.get('/tea/wage-rate'); }
    async getWageRateHistory() { return this.get('/tea/wage-rate/history'); }
    async setWageRate(wageData) { return this.post('/tea/wage-rate', wageData); }
    async getWageRateImpact(proposedRate) { return this.get(`/tea/wage-rate/impact?proposed_rate=${proposedRate}`); }

    // Self Plucking
    async recordSelfPlucking(pluckingData) { return this.post('/tea/plucking/self', pluckingData); }
    async getSelfPlucking(workerId = null) { const ep = workerId ? `/tea/plucking/self/${workerId}` : '/tea/plucking/self'; return this.get(ep); }
    async updateSelfPlucking(id, pluckingData) { return this.put(`/tea/plucking/self/${id}`, pluckingData); }
    async deleteSelfPlucking(id) { return this.delete(`/tea/plucking/self/${id}`); }
    async checkWorkerPlucking(workerId, date = null) { const ep = `/tea/plucking/check/${workerId}${date ? '?date=' + date : ''}`; return this.get(ep); }

    // Verified Plucking
    async recordVerifiedPlucking(pluckingData) { return this.post('/tea/plucking/verified', pluckingData); }
    async getVerifiedPlucking(workerId = null) { const ep = workerId ? `/tea/plucking/verified/${workerId}` : '/tea/plucking/verified'; return this.get(ep); }
    async updateVerifiedPlucking(id, pluckingData) { return this.put(`/tea/plucking/verified/${id}`, pluckingData); }
    async deleteVerifiedPlucking(id) { return this.delete(`/tea/plucking/verified/${id}`); }
    async checkVerifiedPlucking(workerId, date = null) { const ep = `/tea/plucking/verified/check/${workerId}${date ? '?date=' + date : ''}`; return this.get(ep); }
    
    // Approval & Disputes
    async approveVerifiedPlucking(id, approvedKg) { return this.put(`/tea/plucking/verified/${id}/approve`, { approved_kg: approvedKg }); }
    async getDisputedRecords() { return this.get('/tea/comparison/disputes'); }
    async getResolvedDisputes() { return this.get('/tea/comparison/resolved'); }
    async resolveDispute(id, approvedKg, notes) { return this.put(`/tea/comparison/resolve/${id}`, { approved_kg: approvedKg, resolution_notes: notes }); }

    // Comparison
    async getComparison(workerId, date = null) { let ep = `/tea/comparison/${workerId}`; if (date) ep += `?date=${date}`; return this.get(ep); }

    // Debts
    async getDebts(workerId = null) { const ep = workerId ? `/tea/debts/${workerId}` : '/tea/debts'; return this.get(ep); }
    async addDebt(debtData) { return this.post('/tea/debts', debtData); }
    async updateDebt(debtId, debtData) { return this.put(`/tea/debts/${debtId}`, debtData); }
    async reverseDebt(debtId, reason) { return this.post(`/tea/debts/${debtId}/reverse`, { reason }); }

    // Payments
    async payWorker(workerId) { return this.post('/tea/pay-worker', { worker_id: workerId }); }
    async payStore() { return this.post('/tea/pay-store'); }
    async getPaymentHistory(workerId = null) { const ep = workerId ? `/tea/pay-worker/history/${workerId}` : '/tea/pay-worker/history'; return this.get(ep); }
    async getStorePaymentHistory() { return this.get('/tea/pay-store/history'); }

    // Reports
    async getTeaDashboard() { return this.get('/tea/dashboard'); }
    async getProfitReport() { return this.get('/tea/reports/profit'); }

    // ============ DAIRY MODULE ============
    async getCows() { return this.get('/dairy/cows'); }
    async createCow(cowData) { return this.post('/dairy/cows', cowData); }
    async updateCow(id, cowData) { return this.put(`/dairy/cows/${id}`, cowData); }
    async deleteCow(id) { return this.delete(`/dairy/cows/${id}`); }
    async getDairyWorkers() { return this.get('/dairy/workers'); }
    async createDairyWorker(workerData) { return this.post('/dairy/workers', workerData); }
    async updateDairyWorker(id, workerData) { return this.put(`/dairy/workers/${id}`, workerData); }
    async getMilkBuyers() { return this.get('/dairy/buyers'); }
    async createMilkBuyer(buyerData) { return this.post('/dairy/buyers', buyerData); }
    async updateMilkBuyer(id, buyerData) { return this.put(`/dairy/buyers/${id}`, buyerData); }
    async recordMilkProduction(productionData) { return this.post('/dairy/production', productionData); }
    async getMilkProduction(params = {}) { const q = new URLSearchParams(params).toString(); return this.get(`/dairy/production?${q}`); }
    async recordMilkDisposal(disposalData) { return this.post('/dairy/disposal', disposalData); }
    async getMilkDisposal(params = {}) { const q = new URLSearchParams(params).toString(); return this.get(`/dairy/disposal?${q}`); }
    async recordFeed(feedData) { return this.post('/dairy/feed', feedData); }
    async getFeed(params = {}) { const q = new URLSearchParams(params).toString(); return this.get(`/dairy/feed?${q}`); }
    async payDairyWorker(paymentData) { return this.post('/dairy/pay-worker', paymentData); }
    async getDairyPayments(workerId = null) { const ep = workerId ? `/dairy/payments/${workerId}` : '/dairy/payments'; return this.get(ep); }
    async createDelivery(deliveryData) { return this.post('/dairy/deliveries', deliveryData); }
    async getDeliveries() { return this.get('/dairy/deliveries'); }
    async confirmDelivery(id, litresConfirmed) { return this.put(`/dairy/deliveries/${id}/confirm`, { litres_confirmed: litresConfirmed }); }
    async recordBuyerPayment(paymentData) { return this.post('/dairy/buyer-payments', paymentData); }
    async getBuyerPayments() { return this.get('/dairy/buyer-payments'); }
    async getDairyDashboard() { return this.get('/dairy/dashboard'); }
    async getDairyReport(params = {}) { const q = new URLSearchParams(params).toString(); return this.get(`/dairy/reports/summary?${q}`); }
}

// Create global API instance
const api = new ApiService();
