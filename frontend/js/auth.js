// ============================================
// TALAEN FARM - Authentication Module (Mobile‑Hardened)
// ============================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.tokenCheckInterval = null;
    }

    /**
     * Called by App after DOM is fully ready.
     * Avoids running any DOM queries before the page is built.
     */
    init() {
        const savedToken = localStorage.getItem(CONFIG.TOKEN_KEY);
        const savedUser = localStorage.getItem(CONFIG.USER_KEY);

        if (savedToken && savedUser) {
            if (this.isTokenExpired(savedToken)) {
                console.log('Saved token expired – clearing silently');
                this.clearSession(true);
            } else {
                this.token = savedToken;
                this.currentUser = JSON.parse(savedUser);
                // Ensure API instance gets the token immediately
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
            const expiry = payload.exp * 1000;
            const now = Date.now();
            return now >= (expiry - 60000); // 1 minute buffer
        } catch (e) {
            console.error('Token parse error:', e);
            return true;
        }
    }

    getTokenRemainingMinutes() {
        if (!this.token) return 0;
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const expiry = payload.exp * 1000;
            return Math.floor(Math.max(0, expiry - Date.now()) / 60000);
        } catch (e) { return 0; }
    }

    startTokenCheck() {
        if (this.tokenCheckInterval) clearInterval(this.tokenCheckInterval);
        this.tokenCheckInterval = setInterval(() => {
            if (this.token && this.isTokenExpired(this.token)) {
                console.log('Token expired during session');
                if (typeof showToast === 'function') {
                    showToast('Session expired. Please login again.', 'warning', 4000);
                }
                setTimeout(() => this.clearSession(false), 1500);
            }
        }, 120000); // 2 minutes
    }

    stopTokenCheck() {
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
            this.tokenCheckInterval = null;
        }
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

        if (!silent && typeof showToast === 'function') {
            showToast('Logged out successfully.', 'info');
        }
    }

    setupEventListeners() {
        // Form submit (normal flow)
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // 🔴 Backup: direct click on the Sign In button (crucial for mobile)
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Toggle password visibility
        const toggleBtn = document.getElementById('togglePassword');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const pwdInput = document.getElementById('password');
                const icon = toggleBtn.querySelector('i');
                if (!pwdInput || !icon) return;
                if (pwdInput.type === 'password') {
                    pwdInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    pwdInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');

        if (!username || !password) {
            this.showError('Please enter both username and password.');
            return;
        }

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
            this.showError(error.message || 'Network error. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        const errorText = document.getElementById('loginErrorText');
        if (errorDiv) {
            if (errorText) errorText.textContent = message;
            else errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    initializeApp(user, availableModules) {
        document.getElementById('sidebarRole').textContent = this.getRoleDisplay(user.role);
        if (typeof ModuleSelector !== 'undefined') {
            ModuleSelector.show(availableModules);
        }
    }

    getRoleDisplay(role) {
        const map = {
            'farm_owner': 'Farm Owner',
            'supervisor': 'Supervisor',
            'tea_worker': 'Tea Worker',
            'dairy_worker': 'Dairy Worker',
            'store_manager': 'Store Manager',
            'milk_buyer': 'Milk Buyer'
        };
        return map[role] || role;
    }

    handleLogout() {
        this.clearSession(false);
    }

    isAuthenticated() {
        return !!(this.token && this.currentUser && !this.isTokenExpired(this.token));
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    hasAccess(module) {
        if (!this.currentUser) return false;
        const modules = CONFIG.ROLE_MODULES[this.currentUser.role] || [];
        return modules.includes(module);
    }
}

// Wait for the DOM to be ready before initialising
let auth;
document.addEventListener('DOMContentLoaded', () => {
    auth = new AuthManager();
    auth.init();
    window.auth = auth; // global reference
});
