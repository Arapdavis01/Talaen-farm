// ============================================
// TALAEN FARM - Authentication Module
// ============================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.init();
    }

    init() {
        // Check for existing token
        const savedToken = localStorage.getItem(CONFIG.TOKEN_KEY);
        const savedUser = localStorage.getItem(CONFIG.USER_KEY);

        if (savedToken && savedUser) {
            this.token = savedToken;
            this.currentUser = JSON.parse(savedUser);
            api.setToken(savedToken);
        }

        this.setupEventListeners();
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
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging in...';
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
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Login';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    initializeApp(user, availableModules) {
        // Update sidebar role
        document.getElementById('sidebarRole').textContent = this.getRoleDisplay(user.role);

        // Build sidebar based on role and current module
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
        // Clear storage
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        localStorage.removeItem('available_modules');
        localStorage.removeItem('current_module');
        
        this.token = null;
        this.currentUser = null;
        api.setToken(null);

        // Show login, hide app
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('appContainer').classList.add('hidden');
        
        // Clear form
        document.getElementById('loginForm').reset();
        document.getElementById('loginError').classList.add('hidden');

        showToast('Logged out successfully.', 'info');
    }

    isAuthenticated() {
        return this.token !== null && this.currentUser !== null;
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
