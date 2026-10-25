// ============================================
// TALAEN FARM - Main Application
// ============================================

class App {
    constructor() {
        this._initialized = false;
        this._lastErrorAt = 0;
        this._lastErrorMessage = '';
        this.init();
    }

    init() {
        if (this._initialized) return;
        this._initialized = true;

        // Expose early so auth.js's login flow can find us
        window.app = this;

        // Wait for auth to be ready (auth.js's DOMContentLoaded handler runs first,
        // but be defensive in case script order ever changes).
        if (typeof auth === 'undefined' || !auth) {
            console.warn('[Talaen] auth not ready in App.init — retrying on next tick');
            setTimeout(() => this.init(), 50);
            this._initialized = false;
            return;
        }

        // Restore session (routes + selector) if a valid token exists
        if (auth.isAuthenticated()) {
            this.showApp();
        } else {
            // Ensure login UI is visible (safety net for slow loading)
            auth.showLoginUI();
        }

        this._wireGlobalHandlers();

        console.log('[Talaen] Management System initialized');
        console.log('[Talaen] Version:', CONFIG.APP_VERSION);
        console.log('[Talaen] Platform:', (window.TALAEN && window.TALAEN.platform) || 'web');
        if (window.TALAEN && window.TALAEN.isAndroidApp) {
            console.info('[Talaen] Running inside Android WebView — .is-android-app active');
        }
    }

    showApp() {
        // Null-safe user fetch
        const user = auth.getCurrentUser();
        if (!user) {
            console.warn('[Talaen] showApp() called without a user — clearing session');
            auth.clearSession(true);
            return;
        }

        // Fetch & validate modules
        let availableModules = [];
        try {
            availableModules = JSON.parse(localStorage.getItem('available_modules') || '[]');
        } catch (_) {
            availableModules = [];
        }
        if (!Array.isArray(availableModules) || availableModules.length === 0) {
            availableModules = CONFIG.ROLE_MODULES?.[user.role] || [];
        }

        // Show the app shell
        const loginModal = document.getElementById('loginModal');
        const appContainer = document.getElementById('appContainer');
        if (loginModal) {
            loginModal.classList.add('hidden');
            loginModal.style.display = 'none';
        }
        if (appContainer) appContainer.classList.remove('hidden');

        // Sidebar role label
        this._updateSidebarRole(user.role);

        // CRITICAL: delegate to auth.initializeApp() so router.buildModuleRoutes()
        // and sidebar setup happen BEFORE ModuleSelector.show().
        // (Do NOT call ModuleSelector.show() directly — that skipped route building.)
        if (typeof auth.initializeApp === 'function') {
            auth.initializeApp(user, availableModules);
        } else {
            console.warn('[Talaen] auth.initializeApp not found — falling back');
            if (typeof ModuleSelector !== 'undefined') ModuleSelector.show(availableModules);
        }
    }

    // ---------- Private ----------
    _updateSidebarRole(role) {
        const el = document.getElementById('sidebarRole');
        if (el) el.textContent = this.getRoleDisplay(role);
    }

    _wireGlobalHandlers() {
        // Route change → blur any focused input to dismiss native keyboard (app feel)
        window.addEventListener('talaen:route', () => {
            if (window.TALAEN && window.TALAEN.isAndroidApp) {
                const active = document.activeElement;
                if (active && typeof active.blur === 'function') {
                    active.blur();
                }
            }
        });

        // Global JS errors — log always, toast at most once per 5s
        window.addEventListener('error', (event) => {
            const message = event?.error?.message || event?.message || 'Unknown error';
            console.error('[Talaen] Global error:', event.error || event.message);

            const now = Date.now();
            if (typeof showToast === 'function' &&
                (message !== this._lastErrorMessage || now - this._lastErrorAt > 5000)) {
                this._lastErrorAt = now;
                this._lastErrorMessage = message;
                showToast('Something went wrong. Please try again.', 'error', 4000);
            }
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            const reason = event?.reason;
            console.error('[Talaen] Unhandled promise rejection:',
                reason && reason.stack ? reason.stack : JSON.stringify(reason));
        });
    }

    // ---------- Public helper (unchanged role map) ----------
    getRoleDisplay(role) {
        const roleMap = {
            farm_owner: 'Farm Owner',
            supervisor: 'Supervisor',
            tea_worker: 'Tea Worker',
            dairy_worker: 'Dairy Worker',
            store_manager: 'Store Manager',
            milk_buyer: 'Milk Buyer'
        };
        return roleMap[role] || role || 'User';
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
