// ============================================
// TALAEN FARM - Router
// ============================================

class Router {
    constructor() {
        this.routes = {};         // path -> handler
        this.currentRoute = null;
        this.currentModule = null;
        this.history = [];        // stack of visited routes (for back button)
        this._maxHistory = 50;
    }

    // ---------- Route registration ----------
    register(path, handler) {
        this.routes[path] = handler;
    }

    // ---------- Navigation ----------
    navigate(path, params = {}, opts = {}) {
        if (!path) {
            console.warn('[Router] navigate() called with empty path');
            return false;
        }

        if (!this.routes[path]) {
            console.error(`[Router] Route not found: ${path}`);
            return this._navigateFallback(path);
        }

        // Close any open modal + reset scroll (native feel on mobile)
        this._prepareScreen();

        this.currentRoute = path;
        try {
            this.routes[path](params);
        } catch (err) {
            console.error(`[Router] Handler error for "${path}":`, err);
            if (typeof showToast === 'function') {
                showToast('Failed to open screen. Please try again.', 'error', 4000);
            }
            return false;
        }

        // Update history (skip when replacing)
        if (!opts.replace) {
            this.history.push(path);
            if (this.history.length > this._maxHistory) this.history.shift();
        } else if (this.history.length > 0) {
            this.history[this.history.length - 1] = path;
        }

        this.updateActiveSidebarLink(path);

        // Notify listeners (WebView hook, analytics, etc.)
        try {
            window.dispatchEvent(new CustomEvent('talaen:route', {
                detail: { path, module: this.getModule() }
            }));
        } catch (_) { /* no-op */ }

        return true;
    }

    _navigateFallback(missingPath) {
        const user = (typeof auth !== 'undefined' && auth) ? auth.getCurrentUser() : null;
        if (!user) {
            console.warn('[Router] No user — cannot compute fallback route');
            return false;
        }

        const module = this.getModule();
        let fallback = null;

        if (module === 'tea') {
            if (user.role === 'tea_worker') fallback = 'worker-dashboard';
            else if (user.role === 'store_manager') fallback = 'store-dashboard';
            else fallback = 'tea-dashboard';
        } else if (module === 'dairy') {
            fallback = 'dairy-dashboard';
        }

        if (!fallback) {
            console.warn(`[Router] No fallback known for module "${module}"`);
            return false;
        }

        // Prevent infinite recursion if the fallback route is also missing
        if (fallback === missingPath || !this.routes[fallback]) {
            console.warn(`[Router] Fallback route "${fallback}" also missing. Bailing.`);
            return false;
        }

        console.info(`[Router] Falling back from "${missingPath}" → "${fallback}"`);
        return this.navigate(fallback, {}, { replace: true });
    }

    _prepareScreen() {
        // Close any open modal (bottom sheet on app)
        const modalContainer = document.getElementById('modalContainer');
        if (modalContainer && !modalContainer.classList.contains('hidden')) {
            modalContainer.classList.add('hidden');
        }
        // Scroll main content to top
        const main = document.getElementById('mainContent');
        if (main) {
            try { main.scrollTo({ top: 0, behavior: 'instant' }); }
            catch { main.scrollTop = 0; }
        }
    }

    // ---------- Android back button helper ----------
    // Call from MainActivity.kt before webView.goBack().
    // Returns true if the router consumed the back (e.g., closed a modal or went back a route),
    // false if the WebView should handle it.
    handleBack() {
        // 1) Close open modal
        const modalContainer = document.getElementById('modalContainer');
        if (modalContainer && !modalContainer.classList.contains('hidden')) {
            modalContainer.classList.add('hidden');
            return true;
        }

        // 2) Go back in route history
        if (this.history.length > 1) {
            this.history.pop(); // drop current
            const prev = this.history[this.history.length - 1];
            if (prev && this.routes[prev]) {
                this.navigate(prev, {}, { replace: true });
                // Re-push prev since navigate(replace) would overwrite history[last]
                this.history[this.history.length - 1] = prev;
                return true;
            }
        }

        // 3) Let the native WebView handle it (page back / exit)
        return false;
    }

    // ---------- Module state ----------
    setModule(module) {
        this.currentModule = module;
        if (module) localStorage.setItem('current_module', module);
        else localStorage.removeItem('current_module');
    }

    getModule() {
        if (!this.currentModule) {
            this.currentModule = localStorage.getItem('current_module');
        }
        return this.currentModule;
    }

    // ---------- Sidebar highlight ----------
    updateActiveSidebarLink(path) {
        document.querySelectorAll('#sidebarNav [data-route]').forEach((link) => {
            link.classList.remove('sidebar-link-active');
            if (link.dataset.route === path) link.classList.add('sidebar-link-active');
        });
    }

    // ---------- Build module routes ----------
    // Adds routes for a module WITHOUT wiping existing routes for other modules.
    buildModuleRoutes(module) {
        if (!module) return;
        this.setModule(module);

        const user = (typeof auth !== 'undefined' && auth) ? auth.getCurrentUser() : null;
        if (!user) {
            console.warn('[Router] buildModuleRoutes called without authenticated user');
            return;
        }

        // Shared routes (idempotent — same handler each time)
        if (typeof UserManagement !== 'undefined') {
            this.register('user-management', () => UserManagement.show());
        }

        if (module === 'tea') {
            this._buildTeaRoutes(user);
        } else if (module === 'dairy') {
            this._buildDairyRoutes(user);
        } else {
            console.warn(`[Router] Unknown module: ${module}`);
        }
    }

    _buildTeaRoutes(user) {
        const isWorker = user.role === 'tea_worker';
        const isStoreManager = user.role === 'store_manager';
        const isAdmin = user.role === 'farm_owner' || user.role === 'supervisor';

        // ============ WORKER ============
        if (isWorker) {
            this.register('worker-dashboard',  () => TeaWorkerDashboard.show());
            this.register('tea-plucking-self', () => TeaPluckingSelf.show());
            this.register('worker-plucking',   () => TeaWorkerPlucking.show());
            this.register('worker-debts',      () => TeaWorkerDebts.show());
            this.register('worker-store',      () => TeaWorkerStorePurchases.show());
            this.register('worker-payments',   () => TeaWorkerPayments.show());
            this.register('worker-profile',    () => TeaWorkerProfile.show());
            return;
        }

        // ============ STORE MANAGER ============
        if (isStoreManager) {
            this.register('store-dashboard',     () => TeaStoreDashboard.show());
            this.register('tea-debts',           () => TeaDebts.show());
            this.register('store-worker-debts',  () => TeaStoreWorkerDebts.show());
            this.register('store-profile',       () => TeaStoreProfile.show());
            return;
        }

        // ============ ADMIN ============
        // Management
        this.register('tea-dashboard',   () => TeaDashboard.show());
        this.register('tea-workers',     () => TeaWorkers.show());
        this.register('tea-companies',   () => TeaCompanies.show());
        this.register('tea-blocks',      () => TeaBlocks.show());
        this.register('tea-wage-rate',   () => TeaWageRate.show());

        // Operations (admins only for verified)
        this.register('tea-plucking-self', () => TeaPluckingSelf.show());
        if (isAdmin) {
            this.register('tea-plucking-verified', () => TeaPluckingVerified.show());
        }

        // Production (admins only)
        if (isAdmin) {
            this.register('tea-farm-inputs',  () => TeaFarmInputs.show());
            this.register('tea-targets',      () => TeaProductionTargets.show());
            this.register('tea-input-costs',  () => TeaInputCosts.show());
            this.register('tea-fertilizer',   () => TeaFertilizerSchedule.show());
            this.register('tea-pruning',      () => TeaPruningSchedule.show());
            this.register('tea-seasonal',     () => TeaSeasonalAnalysis.show());
        }

        // Financial (admins only)
        if (isAdmin) {
            this.register('tea-comparison',   () => TeaComparison.show());
            this.register('tea-debts',        () => TeaDebts.show());
            this.register('tea-pay-worker',   () => TeaPayWorker.show());
            this.register('tea-pay-store',    () => TeaPayStore.show());
        }

        // Reports (admins only)
        if (isAdmin) {
            this.register('tea-reports', () => TeaReports.show());
        }
    }

    _buildDairyRoutes(_user) {
        this.register('dairy-dashboard',        () => DairyDashboard.show());
        this.register('dairy-cows',             () => DairyCows.show());
        this.register('dairy-workers',          () => DairyWorkers.show());
        this.register('dairy-buyers',           () => DairyBuyers.show());
        this.register('dairy-production',       () => DairyMilkProduction.show());
        this.register('dairy-disposal',         () => DairyMilkDisposal.show());
        this.register('dairy-feed',             () => DairyFeed.show());
        this.register('dairy-pay-worker',       () => DairyPayWorker.show());
        this.register('dairy-deliveries',       () => DairyDeliveries.show());
        this.register('dairy-buyer-payments',   () => DairyBuyerPayments.show());
        this.register('dairy-reports',          () => DairyReports.show());
    }

    // ---------- Go to module selector ----------
    goToModuleSelector() {
        const availableModules = JSON.parse(localStorage.getItem('available_modules') || '[]');

        // Rebuild routes for all available modules (idempotent), so picking one works
        availableModules.forEach((m) => this.buildModuleRoutes(m));

        this.setModule(null);
        this.history = [];
        this.currentRoute = null;

        if (typeof ModuleSelector !== 'undefined') {
            ModuleSelector.show(availableModules);
        }
    }
}

// Create global router instance
const router = new Router();
