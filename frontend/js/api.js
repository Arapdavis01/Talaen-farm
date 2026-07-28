// ============================================
// TALAEN FARM - API Service (Phone‑Fixed)
// ============================================

class ApiService {
    constructor() { this.baseUrl = CONFIG.API_URL; }

    setToken(token) {
        if (token) localStorage.setItem(CONFIG.TOKEN_KEY, token);
        else localStorage.removeItem(CONFIG.TOKEN_KEY);
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = (typeof auth !== 'undefined' && auth.getToken) ? auth.getToken() : localStorage.getItem(CONFIG.TOKEN_KEY);
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    handleSessionExpired() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        localStorage.removeItem('available_modules');
        localStorage.removeItem('current_module');
        if (typeof showToast === 'function') showToast('Session expired. Please login again.', 'warning', 5000);
        setTimeout(() => {
            const app = document.getElementById('appContainer');
            const login = document.getElementById('loginModal');
            if (app) app.classList.add('hidden');
            if (login) { login.style.display = 'flex'; const f = document.getElementById('loginForm'); const e = document.getElementById('loginError'); if (f) f.reset(); if (e) e.style.display = 'none'; }
        }, 1000);
    }

    async request(endpoint, method = 'GET', body = null) {
        try {
            const options = { method, headers: this.getHeaders() };
            if (body && method !== 'GET') options.body = JSON.stringify(body);
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            if (response.status === 401 || response.status === 403) {
                const clone = response.clone();
                const errData = await clone.json().catch(() => ({}));
                if (errData.message === 'Invalid or expired token.' || errData.message === 'Access denied. No token provided.' || errData.message === 'Authentication required.') {
                    this.handleSessionExpired();
                    throw new Error('Session expired');
                }
            }
            const data = await response.json();
            if (!response.ok) {
                let msg = data.message || 'Request failed';
                if (msg === 'Error loading form data' || msg === 'Access denied') msg = 'Session expired. Please login again.';
                throw new Error(msg);
            }
            return data;
        } catch (error) {
            if (error.message !== 'Session expired') console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    async get(endpoint) { return this.request(endpoint, 'GET'); }
    async post(endpoint, body) { return this.request(endpoint, 'POST', body); }
    async put(endpoint, body) { return this.request(endpoint, 'PUT', body); }
    async delete(endpoint) { return this.request(endpoint, 'DELETE'); }

    // ----- Auth -----
    async login(u,p) { return this.post('/auth/login',{username:u,password:p}); }
    async getProfile() { return this.get('/auth/me'); }
    async getUsers() { return this.get('/auth/users'); }
    async updateUser(id, data) { return this.put(`/auth/users/${id}`, data); }
    async resetUserPassword(id, pw) { return this.post(`/auth/reset-password/${id}`,{password:pw}); }

    // ----- Tea -----
    async getTeaWorkers(params={}) { const q=new URLSearchParams(params).toString(); return this.get(`/tea/workers${q?'?'+q:''}`); }
    async getTeaWorkerStats(id) { return this.get(`/tea/workers/${id}/stats`); }
    async createTeaWorker(data) { return this.post('/tea/workers', data); }
    async updateTeaWorker(id, data) { return this.put(`/tea/workers/${id}`, data); }
    async getCompanies() { return this.get('/tea/companies'); }
    async createCompany(data) { return this.post('/tea/companies', data); }
    async updateCompany(id, data) { return this.put(`/tea/companies/${id}`, data); }
    async getBlocks() { return this.get('/tea/blocks'); }
    async createBlock(data) { return this.post('/tea/blocks', data); }
    async getWageRate() { return this.get('/tea/wage-rate'); }
    async setWageRate(data) { return this.post('/tea/wage-rate', data); }
    async recordSelfPlucking(data) { return this.post('/tea/plucking/self', data); }
    async getSelfPlucking(wid=null) { return this.get(wid?`/tea/plucking/self/${wid}`:'/tea/plucking/self'); }
    async recordVerifiedPlucking(data) { return this.post('/tea/plucking/verified', data); }
    async getVerifiedPlucking(wid=null) { return this.get(wid?`/tea/plucking/verified/${wid}`:'/tea/plucking/verified'); }
    async getDisputedRecords() { return this.get('/tea/comparison/disputes'); }
    async resolveDispute(id, kg, notes) { return this.put(`/tea/comparison/resolve/${id}`,{approved_kg:kg,resolution_notes:notes}); }
    async getDebts(wid=null) { return this.get(wid?`/tea/debts/${wid}`:'/tea/debts'); }
    async addDebt(data) { return this.post('/tea/debts', data); }
    async payWorker(wid) { return this.post('/tea/pay-worker',{worker_id:wid}); }
    async payStore() { return this.post('/tea/pay-store'); }
    async getTeaDashboard() { return this.get('/tea/dashboard'); }
    async getProfitReport(p={}) { const q=new URLSearchParams(p).toString(); return this.get(`/tea/reports/profit${q?'?'+q:''}`); }
    async getFarmInputs() { return this.get('/tea/production/inputs'); }
    async addFarmInput(data) { return this.post('/tea/production/inputs', data); }
    async getProductionTargets() { return this.get('/tea/production/targets'); }
    async getFertilizerSchedule() { return this.get('/tea/production/fertilizer'); }
    async getPruningSchedule() { return this.get('/tea/production/pruning'); }
    async getInputCosts() { return this.get('/tea/production/costs'); }
    async getSeasonalAnalysis() { return this.get('/tea/production/seasonal'); }

    // ----- Dairy -----
    async getCows() { return this.get('/dairy/cows'); }
    async createCow(data) { return this.post('/dairy/cows', data); }
    async updateCow(id, data) { return this.put(`/dairy/cows/${id}`, data); }
    async getDairyWorkers() { return this.get('/dairy/workers'); }
    async createDairyWorker(data) { return this.post('/dairy/workers', data); }
    async getMilkBuyers() { return this.get('/dairy/buyers'); }
    async createMilkBuyer(data) { return this.post('/dairy/buyers', data); }
    async recordMilkProduction(data) { return this.post('/dairy/production', data); }
    async getMilkProduction(p={}) { const q=new URLSearchParams(p).toString(); return this.get(`/dairy/production?${q}`); }
    async recordMilkDisposal(data) { return this.post('/dairy/disposal', data); }
    async recordFeed(data) { return this.post('/dairy/feed', data); }
    async payDairyWorker(data) { return this.post('/dairy/pay-worker', data); }
    async createDelivery(data) { return this.post('/dairy/deliveries', data); }
    async getDeliveries() { return this.get('/dairy/deliveries'); }
    async recordBuyerPayment(data) { return this.post('/dairy/buyer-payments', data); }
    async getBuyerPayments() { return this.get('/dairy/buyer-payments'); }
    async getDairyDashboard() { return this.get('/dairy/dashboard'); }
}

const api = new ApiService();
