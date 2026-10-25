// ============================================
// TALAEN FARM - API Service
// ============================================

class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_URL;
        this.timeoutMs = 30000; // 30s — accommodates Render cold starts
    }

    // ---------- Token helpers ----------
    setToken(token) {
        if (token) localStorage.setItem(CONFIG.TOKEN_KEY, token);
        else localStorage.removeItem(CONFIG.TOKEN_KEY);
    }

    getToken() {
        // Always prefer the freshest token from auth
        if (typeof auth !== 'undefined' && auth && typeof auth.getToken === 'function') {
            return auth.getToken() || localStorage.getItem(CONFIG.TOKEN_KEY);
        }
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    }

    getHeaders(extra = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...extra
        };
        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    // ---------- Session expiry ----------
    handleSessionExpired() {
        // Clear storage & in-memory auth state (Bug fix: previously only localStorage was cleared,
        // so auth.isAuthenticated() still returned true afterwards)
        if (typeof auth !== 'undefined' && auth && typeof auth.clearSession === 'function') {
            auth.clearSession(true); // silent — we show our own toast below
        } else {
            localStorage.removeItem(CONFIG.TOKEN_KEY);
            localStorage.removeItem(CONFIG.USER_KEY);
            localStorage.removeItem('available_modules');
            localStorage.removeItem('current_module');
        }

        if (typeof showToast === 'function') {
            showToast('Session expired. Please login again.', 'warning', 5000);
        }

        setTimeout(() => {
            const app = document.getElementById('appContainer');
            const login = document.getElementById('loginModal');
            if (app) app.classList.add('hidden');
            if (login) {
                login.style.display = 'flex';
                const f = document.getElementById('loginForm');
                const e = document.getElementById('loginError');
                if (f) f.reset();
                if (e) e.style.display = 'none';
            }
        }, 800);
    }

    // ---------- Query string helper ----------
    _qs(params) {
        if (!params) return '';
        const q = new URLSearchParams(params).toString();
        return q ? `?${q}` : '';
    }

    // ---------- Core request ----------
    async request(endpoint, method = 'GET', body = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const isApp = !!(window.TALAEN && window.TALAEN.isAndroidApp);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const options = {
                method,
                headers: this.getHeaders(),
                signal: controller.signal,
                // Avoid stale GET responses in the Android WebView
                cache: method === 'GET' && isApp ? 'no-store' : 'default'
            };
            if (body && method !== 'GET') options.body = JSON.stringify(body);

            let response;
            try {
                response = await fetch(url, options);
            } catch (netErr) {
                if (netErr.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again.');
                }
                throw new Error('Network error. Check your connection.');
            } finally {
                clearTimeout(timeoutId);
            }

            // Read body once (safe if non-JSON, e.g. Render 502 HTML)
            const rawText = await response.text();
            let data = {};
            if (rawText) {
                try { data = JSON.parse(rawText); }
                catch { data = { message: rawText.slice(0, 200) }; }
            }

            // Auth failure detection
            if (response.status === 401 || response.status === 403) {
                const msg = (data && data.message) || '';
                const isAuthFailure =
                    !msg ||
                    /token|auth|access|session|expired|denied/i.test(msg);

                if (isAuthFailure) {
                    this.handleSessionExpired();
                    throw new Error('Session expired');
                }
            }

            if (!response.ok) {
                let msg = (data && data.message) || `Request failed (${response.status})`;
                if (msg === 'Error loading form data' || msg === 'Access denied') {
                    msg = 'Session expired. Please login again.';
                }
                throw new Error(msg);
            }

            return data;
        } catch (error) {
            if (error.message !== 'Session expired') {
                console.error(`API Error [${method} ${endpoint}]:`, error);
            }
            throw error;
        }
    }

    // ---------- Shorthand methods ----------
    get(endpoint)          { return this.request(endpoint, 'GET'); }
    post(endpoint, body)   { return this.request(endpoint, 'POST', body); }
    put(endpoint, body)    { return this.request(endpoint, 'PUT', body); }
    delete(endpoint)       { return this.request(endpoint, 'DELETE'); }

    // ============ AUTH ============
    async login(username, password) {
        const res = await this.post('/auth/login', { username, password });
        if (res && res.token) this.setToken(res.token);
        return res;
    }
    register(userData)              { return this.post('/auth/register', userData); }
    getProfile()                    { return this.get('/auth/me'); }
    changePassword(cp, np)          { return this.post('/auth/change-password', { current_password: cp, new_password: np }); }
    getUsers()                      { return this.get('/auth/users'); }

    // ============ USER MANAGEMENT ============
    updateUser(userId, userData)         { return this.put(`/auth/users/${userId}`, userData); }
    resetUserPassword(userId, newPassword){ return this.post(`/auth/reset-password/${userId}`, { password: newPassword }); }

    // ============ TEA MODULE ============
    getTeaWorkers(params = {})   { return this.get(`/tea/workers${this._qs(params)}`); }
    getTeaWorkerStats(workerId)  {
        if (!workerId) throw new Error('workerId is required');
        return this.get(`/tea/workers/${workerId}/stats`);
    }
    createTeaWorker(workerData)         { return this.post('/tea/workers', workerData); }
    updateTeaWorker(id, workerData)     { return this.put(`/tea/workers/${id}`, workerData); }

    getCompanies()                      { return this.get('/tea/companies'); }
    getCompanyStats(companyId)          { return this.get(`/tea/companies/${companyId}/stats`); }
    createCompany(companyData)          { return this.post('/tea/companies', companyData); }
    updateCompany(id, companyData)      { return this.put(`/tea/companies/${id}`, companyData); }

    getBlocks()                         { return this.get('/tea/blocks'); }
    createBlock(blockData)              { return this.post('/tea/blocks', blockData); }

    getWageRate()                       { return this.get('/tea/wage-rate'); }
    getWageRateHistory()                { return this.get('/tea/wage-rate/history'); }
    setWageRate(wageData)               { return this.post('/tea/wage-rate', wageData); }
    getWageRateImpact(proposedRate)     { return this.get(`/tea/wage-rate/impact?proposed_rate=${proposedRate}`); }

    // Self Plucking
    recordSelfPlucking(pluckingData)    { return this.post('/tea/plucking/self', pluckingData); }
    getSelfPlucking(workerId = null)    { return this.get(workerId ? `/tea/plucking/self/${workerId}` : '/tea/plucking/self'); }
    updateSelfPlucking(id, pluckingData){ return this.put(`/tea/plucking/self/${id}`, pluckingData); }
    deleteSelfPlucking(id)              { return this.delete(`/tea/plucking/self/${id}`); }
    checkWorkerPlucking(workerId, date = null) {
        return this.get(`/tea/plucking/check/${workerId}${date ? '?date=' + date : ''}`);
    }

    // Verified Plucking
    recordVerifiedPlucking(pluckingData)      { return this.post('/tea/plucking/verified', pluckingData); }
    getVerifiedPlucking(workerId = null)      { return this.get(workerId ? `/tea/plucking/verified/${workerId}` : '/tea/plucking/verified'); }
    updateVerifiedPlucking(id, pluckingData)  { return this.put(`/tea/plucking/verified/${id}`, pluckingData); }
    deleteVerifiedPlucking(id)                { return this.delete(`/tea/plucking/verified/${id}`); }
    checkVerifiedPlucking(workerId, date = null) {
        return this.get(`/tea/plucking/verified/check/${workerId}${date ? '?date=' + date : ''}`);
    }

    // Approval & Disputes
    approveVerifiedPlucking(id, approvedKg)   { return this.put(`/tea/plucking/verified/${id}/approve`, { approved_kg: approvedKg }); }
    getDisputedRecords()                      { return this.get('/tea/comparison/disputes'); }
    getResolvedDisputes()                     { return this.get('/tea/comparison/resolved'); }
    resolveDispute(id, approvedKg, notes)     { return this.put(`/tea/comparison/resolve/${id}`, { approved_kg: approvedKg, resolution_notes: notes }); }

    // Comparison
    getComparison(workerId, date = null) {
        return this.get(`/tea/comparison/${workerId}${date ? '?date=' + date : ''}`);
    }

    // Debts
    getDebts(workerId = null)          { return this.get(workerId ? `/tea/debts/${workerId}` : '/tea/debts'); }
    addDebt(debtData)                  { return this.post('/tea/debts', debtData); }
    updateDebt(debtId, debtData)       { return this.put(`/tea/debts/${debtId}`, debtData); }
    reverseDebt(debtId, reason)        { return this.post(`/tea/debts/${debtId}/reverse`, { reason }); }

    // Payments
    payWorker(workerId)                { return this.post('/tea/pay-worker', { worker_id: workerId }); }
    payStore()                         { return this.post('/tea/pay-store'); }
    getPaymentHistory(workerId = null) { return this.get(workerId ? `/tea/pay-worker/history/${workerId}` : '/tea/pay-worker/history'); }
    getStorePaymentHistory()           { return this.get('/tea/pay-store/history'); }

    // Reports
    getTeaDashboard()                             { return this.get('/tea/dashboard'); }
    getProfitReport(params = {})                  { return this.get(`/tea/reports/profit${this._qs(params)}`); }
    getProductionReport(params = {})              { return this.get(`/tea/reports/production${this._qs(params)}`); }
    getWorkerPerformanceReport(params = {})       { return this.get(`/tea/reports/workers${this._qs(params)}`); }
    getDebtReport()                               { return this.get('/tea/reports/debts'); }

    // ============ FARM PRODUCTION MANAGEMENT ============
    getFarmInputs()                     { return this.get('/tea/production/inputs'); }
    addFarmInput(data)                  { return this.post('/tea/production/inputs', data); }
    updateFarmInput(id, data)           { return this.put(`/tea/production/inputs/${id}`, data); }
    deleteFarmInput(id)                 { return this.delete(`/tea/production/inputs/${id}`); }

    getProductionTargets()              { return this.get('/tea/production/targets'); }
    addProductionTarget(data)           { return this.post('/tea/production/targets', data); }
    updateProductionTarget(id, data)    { return this.put(`/tea/production/targets/${id}`, data); }
    deleteProductionTarget(id)          { return this.delete(`/tea/production/targets/${id}`); }

    getFertilizerSchedule()             { return this.get('/tea/production/fertilizer'); }
    addFertilizer(data)                 { return this.post('/tea/production/fertilizer', data); }
    updateFertilizer(id, data)          { return this.put(`/tea/production/fertilizer/${id}`, data); }
    deleteFertilizer(id)                { return this.delete(`/tea/production/fertilizer/${id}`); }

    getPruningSchedule()                { return this.get('/tea/production/pruning'); }
    addPruning(data)                    { return this.post('/tea/production/pruning', data); }
    updatePruning(id, data)             { return this.put(`/tea/production/pruning/${id}`, data); }
    deletePruning(id)                   { return this.delete(`/tea/production/pruning/${id}`); }

    getInputCosts()                     { return this.get('/tea/production/costs'); }
    getSeasonalAnalysis()               { return this.get('/tea/production/seasonal'); }

    // ============ DAIRY MODULE ============
    getCows()                           { return this.get('/dairy/cows'); }
    createCow(cowData)                  { return this.post('/dairy/cows', cowData); }
    updateCow(id, cowData)              { return this.put(`/dairy/cows/${id}`, cowData); }
    deleteCow(id)                       { return this.delete(`/dairy/cows/${id}`); }

    getDairyWorkers()                   { return this.get('/dairy/workers'); }
    createDairyWorker(workerData)       { return this.post('/dairy/workers', workerData); }
    updateDairyWorker(id, workerData)   { return this.put(`/dairy/workers/${id}`, workerData); }

    getMilkBuyers()                     { return this.get('/dairy/buyers'); }
    createMilkBuyer(buyerData)          { return this.post('/dairy/buyers', buyerData); }
    updateMilkBuyer(id, buyerData)      { return this.put(`/dairy/buyers/${id}`, buyerData); }

    recordMilkProduction(productionData){ return this.post('/dairy/production', productionData); }
    getMilkProduction(params = {})      { return this.get(`/dairy/production${this._qs(params)}`); }

    recordMilkDisposal(disposalData)    { return this.post('/dairy/disposal', disposalData); }
    getMilkDisposal(params = {})        { return this.get(`/dairy/disposal${this._qs(params)}`); }

    recordFeed(feedData)                { return this.post('/dairy/feed', feedData); }
    getFeed(params = {})                { return this.get(`/dairy/feed${this._qs(params)}`); }

    payDairyWorker(paymentData)         { return this.post('/dairy/pay-worker', paymentData); }
    getDairyPayments(workerId = null)   { return this.get(workerId ? `/dairy/payments/${workerId}` : '/dairy/payments'); }

    createDelivery(deliveryData)        { return this.post('/dairy/deliveries', deliveryData); }
    getDeliveries()                     { return this.get('/dairy/deliveries'); }
    confirmDelivery(id, litresConfirmed){ return this.put(`/dairy/deliveries/${id}/confirm`, { litres_confirmed: litresConfirmed }); }

    recordBuyerPayment(paymentData)     { return this.post('/dairy/buyer-payments', paymentData); }
    getBuyerPayments()                  { return this.get('/dairy/buyer-payments'); }

    getDairyDashboard()                 { return this.get('/dairy/dashboard'); }
    getDairyReport(params = {})         { return this.get(`/dairy/reports/summary${this._qs(params)}`); }
}

// Create the global instance
const api = new ApiService();
