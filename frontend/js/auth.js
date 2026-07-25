// ============================================
// TALAEN FARM - Authentication Module
// ============================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.tokenCheckInterval = null;
        this.init();
    }

    init() {
        // Check for existing token
        const savedToken = localStorage.getItem(CONFIG.TOKEN_KEY);
        const savedUser = localStorage.getItem(CONFIG.USER_KEY);

        if (savedToken && savedUser) {
            // Check if token is expired before using it
            if (this.isTokenExpired(savedToken)) {
                console.log('Saved token is expired, clearing session');
                this.clearSession(true); // silent clear, no toast
            } else {
                this.token = savedToken;
                this.currentUser = JSON.parse(savedUser);
                api.setToken(savedToken);
                
                // Start periodic token check
                this.startTokenCheck();
            }
        }

        this.setupEventListeners();
    }

    // Check if JWT token is expired
    isTokenExpired(token) {
        if (!token) return true;
        
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return true;
            
            const payload = JSON.parse(atob(parts[1]));
            const expiry = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            
            // Consider token expired 60 seconds before actual expiry
            return now >= (expiry - 60000);
        } catch (e) {
            console.error('Token parse error:', e);
            return true;
        }
    }

    // Get remaining token time in minutes
    getTokenRemainingMinutes() {
        if (!this.token) return 0;
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const expiry = payload.exp * 1000;
            const remaining = Math.max(0, expiry - Date.now());
            return Math.floor(remaining / 60000);
        } catch (e) {
            return 0;
        }
    }

    // Start periodic token check
    startTokenCheck() {
        // Clear existing interval if any
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
        }
        
        // Check token every 2 minutes
        this.tokenCheckInterval = setInterval(() => {
            if (this.token && this.isTokenExpired(this.token)) {
                console.log('Token expired during session');
                showToast('Session expired. Please login again.', 'warning', 4000);
                setTimeout(() => this.clearSession(false), 1500);
            }
        }, 120000); // 2 minutes
    }

    // Stop periodic token check
    stopTokenCheck() {
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
            this.tokenCheckInterval = null;
        }
    }

    // Clear session and show login
    clearSession(silent = false) {
        // Stop token checking
        this.stopTokenCheck();
        
        // Clear localStorage
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        localStorage.removeItem('available_modules');
        localStorage.removeItem('current_module');
        
        // Reset state
        this.token = null;
        this.currentUser = null;
        api.setToken(null);
        
        // Update UI
        const loginModal = document.getElementById('loginModal');
        const appContainer = document.getElementById('appContainer');
        const loginForm = document.getElementById('loginForm');
        const loginError = document.getElementById('loginError');
        
        if (appContainer) appContainer.classList.add('hidden');
        if (loginModal) loginModal.classList.remove('hidden');
        if (loginForm) loginForm.reset();
        if (loginError) loginError.classList.add('hidden');
        
        if (!silent) {
            showToast('Logged out successfully.', 'info');
        }
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Toggle password visibility
        document.getElementById('togglePassword').addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const icon = document.querySelector('#togglePassword i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
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

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
        errorDiv.classList.add('hidden');

        try {
            const response = await api.login(username, password);

            if (response.success) {
                // Save auth data
                this.token = response.token;
                this.currentUser = response.user;
                
                localStorage.setItem(CONFIG.TOKEN_KEY, response.token);
                localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));
                api.setToken(response.token);

                // Store available modules
                localStorage.setItem('available_modules', JSON.stringify(response.available_modules));

                // Start periodic token check
                this.startTokenCheck();

                // Hide login, show app
                document.getElementById('loginModal').classList.add('hidden');
                document.getElementById('appContainer').classList.remove('hidden');

                // Initialize the app
                this.initializeApp(response.user, response.available_modules);
                
                showToast('Welcome back!', 'success');
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
        
        if (errorText) {
            errorText.textContent = message;
        } else {
            errorDiv.textContent = message;
        }
        errorDiv.classList.remove('hidden');
    }

    initializeApp(user, availableModules) {
        // Update sidebar role
        document.getElementById('sidebarRole').textContent = this.getRoleDisplay(user.role);

        // Reset module
        this.currentModule = null;
        
        // Show module selector first
        ModuleSelector.show(availableModules);
    }

    getRoleDisplay(role) {
        const roleMap = {
            'farm_owner': 'Farm Owner',
            'supervisor': 'Supervisor',
            'tea_worker': 'Tea Worker',
            'dairy_worker': 'Dairy Worker',
            'store_manager': 'Store Manager',
            'milk_buyer': 'Milk Buyer'
        };
        return roleMap[role] || role;
    }

    handleLogout() {
        this.clearSession(false);
    }

    isAuthenticated() {
        if (!this.token || !this.currentUser) return false;
        return !this.isTokenExpired(this.token);
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

// Create global auth instance
const auth = new AuthManager();
