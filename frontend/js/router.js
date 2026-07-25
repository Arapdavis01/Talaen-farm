// ============================================
// TALAEN FARM - Router
// ============================================

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.currentModule = null;
    }

    // Register a route
    register(path, handler) {
        this.routes[path] = handler;
    }

    // Navigate to a route
    navigate(path, params = {}) {
        if (this.routes[path]) {
            this.currentRoute = path;
            this.routes[path](params);
            
            // Update active sidebar link
            this.updateActiveSidebarLink(path);
        } else {
            console.error(`Route not found: ${path}`);
            // Fallback to dashboard of current module
            const module = this.getModule();
            if (module === 'tea') {
                this.navigate('tea-dashboard');
            } else if (module === 'dairy') {
                this.navigate('dairy-dashboard');
            }
        }
    }

    // Set current module (tea or dairy)
    setModule(module) {
        this.currentModule = module;
        localStorage.setItem('current_module', module);
    }

    // Get current module
    getModule() {
        if (!this.currentModule) {
            this.currentModule = localStorage.getItem('current_module');
        }
        return this.currentModule;
    }

    // Update active sidebar link
    updateActiveSidebarLink(path) {
        document.querySelectorAll('#sidebarNav a').forEach(link => {
            link.classList.remove('sidebar-link-active');
            if (link.dataset.route === path) {
                link.classList.add('sidebar-link-active');
            }
        });
    }

    // Build routes for a module
    buildModuleRoutes(module) {
        this.setModule(module);
        
        // Clear existing routes
        this.routes = {};
        
        // Register shared routes (available in both modules)
        this.register('user-management', () => UserManagement.show());
        
        if (module === 'tea') {
            this.register('tea-dashboard', () => TeaDashboard.show());
            this.register('tea-workers', () => TeaWorkers.show());
            this.register('tea-companies', () => TeaCompanies.show());
            this.register('tea-blocks', () => TeaBlocks.show());
            this.register('tea-wage-rate', () => TeaWageRate.show());
            this.register('tea-plucking-self', () => TeaPluckingSelf.show());
            this.register('tea-plucking-verified', () => TeaPluckingVerified.show());
            this.register('tea-comparison', () => TeaComparison.show());
            this.register('tea-debts', () => TeaDebts.show());
            this.register('tea-pay-worker', () => TeaPayWorker.show());
            this.register('tea-pay-store', () => TeaPayStore.show());
            this.register('tea-reports', () => TeaReports.show());
        } else if (module === 'dairy') {
            this.register('dairy-dashboard', () => DairyDashboard.show());
            this.register('dairy-cows', () => DairyCows.show());
            this.register('dairy-workers', () => DairyWorkers.show());
            this.register('dairy-buyers', () => DairyBuyers.show());
            this.register('dairy-production', () => DairyMilkProduction.show());
            this.register('dairy-disposal', () => DairyMilkDisposal.show());
            this.register('dairy-feed', () => DairyFeed.show());
            this.register('dairy-pay-worker', () => DairyPayWorker.show());
            this.register('dairy-deliveries', () => DairyDeliveries.show());
            this.register('dairy-buyer-payments', () => DairyBuyerPayments.show());
            this.register('dairy-reports', () => DairyReports.show());
        }
    }

    // Go back to module selector
    goToModuleSelector() {
        const availableModules = JSON.parse(localStorage.getItem('available_modules') || '[]');
        this.setModule(null);
        this.routes = {};
        ModuleSelector.show(availableModules);
    }
}

// Create global router instance
const router = new Router();
