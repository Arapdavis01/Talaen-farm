// ============================================
// TALAEN FARM - Authentication Module
// ============================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.tokenCheckInterval = null;
        this.isLoggingIn = false;
        this._uiInitialized = false;
    }

    // ---------- Boot ----------
    init() {
        const savedToken = localStorage.getItem(CONFIG.TOKEN_KEY);
        const savedUserRaw = localStorage.getItem(CONFIG.USER_KEY);

        if (savedToken && savedUserRaw) {
            if (this.isTokenExpired(savedToken)) {
                console.log('[Talaen] Saved token expired – clearing');
                this.clearSession(true);
            } else {
                try {
                    this.token = savedToken;
                    this.currentUser = JSON.parse(savedUserRaw);
                    if (typeof api !== 'undefined' && api) api.setToken(savedToken);
                    this.startTokenCheck();
                    this.showAppUI();
                    // Do NOT call initializeApp() here — App.init() orchestrates it.
                } catch (e) {
                    console.warn('[Talaen] Corrupt saved user — clearing', e);
                    this.clearSession(true);
                }
            }
        }

        this.setupEventListeners();
        window.auth = this;
    }

    // ---------- UI state ----------
    showAppUI() {
        const loginModal = document.getElementById('loginModal');
        const appContainer = document.getElementById('appContainer');
        if (loginModal) {
            loginModal.classList.add('hidden');
            loginModal.style.display = 'none';
        }
        if (appContainer) appContainer.classList.remove('hidden');
    }

    showLoginUI() {
        const loginModal = document.getElementById('loginModal');
        const appContainer = document.getElementById('appContainer');
        const loginForm = document.getElementById('loginForm');
        const loginError = document.getElementById('loginError');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (appContainer) appContainer.classList.add('hidden');
        if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
        if (loginModal) {
            loginModal.classList.remove('hidden');
            loginModal.style.display = 'flex';
        }
        if (loginForm) loginForm.reset();
        if (loginError) loginError.style.display = 'none';
    }

    // ---------- Token validation ----------
    isTokenExpired(token) {
        if (!token) return true;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return true;
            // JWT uses base64url — convert before atob
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            if (!payload.exp) return false; // no exp claim → assume valid until server rejects
            return Date.now() >= (payload.exp * 1000 - 60000);
        } catch (e) {
            return true;
        }
    }

    startTokenCheck() {
        this.stopTokenCheck();
        this.tokenCheckInterval = setInterval(() => {
            if (this.token && this.isTokenExpired(this.token)) {
                if (typeof showToast === 'function') {
                    showToast('Session expired. Please login again.', 'warning', 4000);
                }
                // silent=true — toast was already shown above
                this.clearSession(true);
            }
        }, 120000);
    }

    stopTokenCheck() {
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
            this.tokenCheckInterval = null;
        }
    }

    // ---------- Session lifecycle ----------
    clearSession(silent = false) {
        this.stopTokenCheck();

        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        localStorage.removeItem('available_modules');
        localStorage.removeItem('current_module');

        this.token = null;
        this.currentUser = null;
        this._uiInitialized = false;

        if (typeof api !== 'undefined' && api) api.setToken(null);

        // Clear rendered content so previous user's data doesn't flash
        const sidebarNav = document.getElementById('sidebarNav');
        const mainContent = document.getElementById('mainContent');
        const sidebarRole = document.getElementById('sidebarRole');
        if (sidebarNav) sidebarNav.innerHTML = '';
        if (mainContent) mainContent.innerHTML = '';
        if (sidebarRole) sidebarRole.textContent = '';

        this.showLoginUI();

        if (!silent && typeof showToast === 'function') {
            showToast('Logged out.', 'info');
        }
    }

    // ---------- Event wiring ----------
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            // ONLY submit — the <button type="submit"> triggers this too.
            // (Previous version also bound a click handler → double login fire.)
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const toggleBtn = document.getElementById('togglePassword');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const pwd = document.getElementById('password');
                const icon = toggleBtn.querySelector('i');
                if (!pwd || !icon) return;
                const isPass = pwd.type === 'password';
                pwd.type = isPass ? 'text' : 'password';
                icon.className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    // ---------- Login ----------
    async handleLogin() {
        if (this.isLoggingIn) return; // guard against double-tap

        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        const errorDiv = document.getElementById('loginError');
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');

        if (!usernameEl || !passwordEl) return;

        const username = usernameEl.value.trim();
        const password = passwordEl.value;

        if (!username || !password) {
            this.showError('Enter username and password.');
            return;
        }

        this.isLoggingIn = true;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
        }
        if (errorDiv) errorDiv.style.display = 'none';

        try {
            const response = await api.login(username, password);

            if (!response || !response.success || !response.token || !response.user) {
                this.showError((response && response.message) || 'Login failed.');
                return;
            }

            this.token = response.token;
            this.currentUser = response.user;

            localStorage.setItem(CONFIG.TOKEN_KEY, response.token);
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));
            api.setToken(response.token);

            const availableModules = Array.isArray(response.available_modules)
                ? response.available_modules
                : (CONFIG.ROLE_MODULES?.[response.user.role] || []);
            localStorage.setItem('available_modules', JSON.stringify(availableModules));

            this.startTokenCheck();
            this.showAppUI();

            // Let App orchestrate the module render (single source of truth).
            if (typeof window.app !== 'undefined' && window.app && typeof window.app.showApp === 'function') {
                window.app.showApp();
            } else {
                // Fallback — should not normally happen if app.js loaded correctly
                this.initializeApp(response.user, availableModules);
            }

            if (typeof showToast === 'function') showToast('Welcome back!', 'success');

            if (window.TALAEN && window.TALAEN.isAndroidApp) {
                console.info('[Talaen] Login OK on Android app');
            }
        } catch (error) {
            this.showError(error.message || 'Network error.');
        } finally {
            this.isLoggingIn = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In';
            }
        }
    }

    showError(msg) {
        const errDiv = document.getElementById('loginError');
        const errText = document.getElementById('loginErrorText');
        if (!errDiv) return;
        if (errText) errText.textContent = msg;
        else errDiv.textContent = msg;
        errDiv.style.display = 'block';
    }

    // ---------- Post-login init ----------
    initializeApp(user, availableModules) {
        if (this._uiInitialized) return; // prevent duplicate render
        this._uiInitialized = true;

        const roleEl = document.getElementById('sidebarRole');
        if (roleEl) roleEl.textContent = this.getRoleDisplay(user.role);

        // Build module routes so router.navigate() works after ModuleSelector picks one.
        if (typeof router !== 'undefined' && router && typeof router.buildModuleRoutes === 'function') {
            // Build for every available module; router switches active module later.
            availableModules.forEach((m) => router.buildModuleRoutes(m));
            // Restore last module choice, or default to first
            const lastModule = localStorage.getItem('current_module');
            const targetModule = lastModule && availableModules.includes(lastModule)
                ? lastModule
                : availableModules[0];
            if (targetModule) router.setModule(targetModule);
        }

        if (typeof ModuleSelector !== 'undefined') {
            ModuleSelector.show(availableModules);
        }
    }

    getRoleDisplay(role) {
        const map = {
            farm_owner: 'Farm Owner',
            supervisor: 'Supervisor',
            tea_worker: 'Tea Worker',
            dairy_worker: 'Dairy Worker',
            store_manager: 'Store Manager',
            milk_buyer: 'Milk Buyer'
        };
        return map[role] || role;
    }

    // ---------- Public API ----------
    handleLogout() { this.clearSession(false); }
    isAuthenticated() {
        return !!(this.token && this.currentUser && !this.isTokenExpired(this.token));
    }
    getCurrentUser() { return this.currentUser; }
    getToken() { return this.token; }

    hasAccess(mod) {
        if (!this.currentUser) return false;
        // Prefer server-provided module list, fall back to hardcoded config
        let modules = null;
        try {
            modules = JSON.parse(localStorage.getItem('available_modules') || 'null');
        } catch { modules = null; }
        if (!Array.isArray(modules) || modules.length === 0) {
            modules = CONFIG.ROLE_MODULES?.[this.currentUser.role] || [];
        }
        return modules.includes(mod);
    }
}

// ---------- Bootstrap ----------
let auth;
document.addEventListener('DOMContentLoaded', () => {
    auth = new AuthManager();
    auth.init();
    window.auth = auth;
});
