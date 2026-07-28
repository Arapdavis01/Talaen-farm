// ============================================
// TALAEN FARM - Authentication Module (Phone‑Fixed)
// ============================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.tokenCheckInterval = null;
    }

    init() {
        const savedToken = localStorage.getItem(CONFIG.TOKEN_KEY);
        const savedUser = localStorage.getItem(CONFIG.USER_KEY);

        if (savedToken && savedUser) {
            if (this.isTokenExpired(savedToken)) {
                console.log('Saved token expired – clearing');
                this.clearSession(true);
            } else {
                this.token = savedToken;
                this.currentUser = JSON.parse(savedUser);
                if (typeof api !== 'undefined') api.setToken(savedToken);
                this.startTokenCheck();
                this.showAppUI();
                const availableModules = JSON.parse(localStorage.getItem('available_modules') || '[]');
                if (availableModules.length > 0) {
                    this.initializeApp(this.currentUser, availableModules);
                }
            }
        }
        this.setupEventListeners();
    }

    showAppUI() {
        const loginModal = document.getElementById('loginModal');
        const appContainer = document.getElementById('appContainer');
        if (loginModal) loginModal.style.display = 'none';
        if (appContainer) appContainer.classList.remove('hidden');
    }

    isTokenExpired(token) {
        if (!token) return true;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return true;
            const payload = JSON.parse(atob(parts[1]));
            return Date.now() >= (payload.exp * 1000 - 60000);
        } catch (e) { return true; }
    }

    startTokenCheck() {
        if (this.tokenCheckInterval) clearInterval(this.tokenCheckInterval);
        this.tokenCheckInterval = setInterval(() => {
            if (this.token && this.isTokenExpired(this.token)) {
                if (typeof showToast === 'function') showToast('Session expired. Please login again.', 'warning', 4000);
                setTimeout(() => this.clearSession(false), 1500);
            }
        }, 120000);
    }

    clearSession(silent = false) {
        this.stopTokenCheck();
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        localStorage.removeItem('available_modules');
        localStorage.removeItem('current_module');
        this.token = null;
        this.currentUser = null;
        if (typeof api !== 'undefined') api.setToken(null);

        const loginModal = document.getElementById('loginModal');
        const appContainer = document.getElementById('appContainer');
        const loginForm = document.getElementById('loginForm');
        const loginError = document.getElementById('loginError');
        if (appContainer) appContainer.classList.add('hidden');
        if (loginModal) loginModal.style.display = 'flex';
        if (loginForm) loginForm.reset();
        if (loginError) loginError.style.display = 'none';
        if (!silent && typeof showToast === 'function') showToast('Logged out.', 'info');
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // 🔴 Backup click handler for mobile
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const toggleBtn = document.getElementById('togglePassword');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const pwd = document.getElementById('password');
                const icon = toggleBtn.querySelector('i');
                if (!pwd || !icon) return;
                const isPass = pwd.type === 'password';
                pwd.type = isPass ? 'text' : 'password';
                icon.className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');

        if (!username || !password) { this.showError('Enter username and password.'); return; }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
        errorDiv.style.display = 'none';

        try {
            const response = await api.login(username, password);
            if (response.success) {
                this.token = response.token;
                this.currentUser = response.user;
                localStorage.setItem(CONFIG.TOKEN_KEY, response.token);
                localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));
                api.setToken(response.token);
                localStorage.setItem('available_modules', JSON.stringify(response.available_modules));
                this.startTokenCheck();
                document.getElementById('loginModal').style.display = 'none';
                document.getElementById('appContainer').classList.remove('hidden');
                this.initializeApp(response.user, response.available_modules);
                if (typeof showToast === 'function') showToast('Welcome back!', 'success');
            } else {
                this.showError(response.message || 'Login failed.');
            }
        } catch (error) {
            this.showError(error.message || 'Network error.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In';
        }
    }

    showError(msg) {
        const errDiv = document.getElementById('loginError');
        const errText = document.getElementById('loginErrorText');
        if (errDiv) {
            if (errText) errText.textContent = msg;
            else errDiv.textContent = msg;
            errDiv.style.display = 'block';
        }
    }

    initializeApp(user, availableModules) {
        document.getElementById('sidebarRole').textContent = this.getRoleDisplay(user.role);
        if (typeof ModuleSelector !== 'undefined') ModuleSelector.show(availableModules);
    }

    getRoleDisplay(role) {
        const map = { farm_owner:'Farm Owner', supervisor:'Supervisor', tea_worker:'Tea Worker', dairy_worker:'Dairy Worker', store_manager:'Store Manager', milk_buyer:'Milk Buyer' };
        return map[role] || role;
    }

    handleLogout() { this.clearSession(false); }
    isAuthenticated() { return !!(this.token && this.currentUser && !this.isTokenExpired(this.token)); }
    getCurrentUser() { return this.currentUser; }
    getToken() { return this.token; }
    hasAccess(mod) { if(!this.currentUser) return false; return (CONFIG.ROLE_MODULES[this.currentUser.role]||[]).includes(mod); }
}

let auth;
document.addEventListener('DOMContentLoaded', () => {
    auth = new AuthManager();
    auth.init();
    window.auth = auth;
});
