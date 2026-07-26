// ============================================
// TALAEN FARM - Router
// ============================================

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.currentModule = null;
    }

    register(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path, params = {}) {
        if (this.routes[path]) {
            this.currentRoute = path;
            this.routes[path](params);
            this.updateActiveSidebarLink(path);
        } else {
            console.error(`Route not found: ${path}`);
            const module = this.getModule();
            if (module === 'tea') this.navigate('tea-dashboard');
            else if (module === 'dairy') this.navigate('dairy-dashboard');
        }
    }

    setModule(module) {
        this.currentModule = module;
        localStorage.setItem('current_module', module);
    }

    getModule() {
        if (!this.currentModule) this.currentModule = localStorage.getItem('current_module');
        return this.currentModule;
    }

    updateActiveSidebarLink(path) {
        document.querySelectorAll('#sidebarNav a').forEach(link => {
            link.classList.remove('sidebar-link-active');
            if (link.dataset.route === path) link.classList.add('sidebar-link-active');
        });
    }

    buildModuleRoutes(module) {
        this.setModule(module);
        this.routes = {};
        
        // Shared routes
        this.register('user-management', () => UserManagement.show());
        
        if (module === 'tea') {
            // Management
            this.register('tea-dashboard', () => TeaDashboard.show());
            this.register('tea-workers', () => TeaWorkers.show());
            this.register('tea-companies', () => TeaCompanies.show());
            this.register('tea-blocks', () => TeaBlocks.show());
            this.register('tea-wage-rate', () => TeaWageRate.show());
            
            // Operations
            this.register('tea-plucking-self', () => TeaPluckingSelf.show());
            this.register('tea-plucking-verified', () => TeaPluckingVerified.show());
            
            // Production (NEW)
            this.register('tea-farm-inputs', () => TeaFarmInputs.show());
            this.register('tea-targets', () => TeaProductionTargets.show());
            this.register('tea-input-costs', () => TeaInputCosts.show());
            this.register('tea-fertilizer', () => TeaFertilizerSchedule.show());
            this.register('tea-pruning', () => TeaPruningSchedule.show());
            this.register('tea-seasonal', () => TeaSeasonalAnalysis.show());
            
            // Financial
            this.register('tea-comparison', () => TeaComparison.show());
            this.register('tea-debts', () => TeaDebts.show());
            this.register('tea-pay-worker', () => TeaPayWorker.show());
            this.register('tea-pay-store', () => TeaPayStore.show());
            
            // Reports
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

    goToModuleSelector() {
        const availableModules = JSON.parse(localStorage.getItem('available_modules') || '[]');
        this.setModule(null);
        this.routes = {};
        ModuleSelector.show(availableModules);
    }
}

// Create global router instance
const router = new Router();
