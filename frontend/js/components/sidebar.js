// ============================================
// TALAEN FARM - Sidebar Component
// ============================================

class Sidebar {
    constructor() {
        this.sidebar = null;
        this.nav = null;
        this.overlay = null;
        this.isOpen = false;
        this.currentModule = null;
        this.activeRoute = null;
        this.disputeCount = 0;
        this._disputeLastFetched = 0;
        this._disputeLoading = false;
        this._refreshTimer = null;
        this._ensureRefs();
    }

    // ---------- Lazy DOM refs ----------
    _ensureRefs() {
        if (!this.sidebar || !document.body.contains(this.sidebar)) {
            this.sidebar = document.getElementById('sidebar');
        }
        if (!this.nav || !document.body.contains(this.nav)) {
            this.nav = document.getElementById('sidebarNav');
        }
        if (!this.overlay || !document.body.contains(this.overlay)) {
            this.overlay = document.getElementById('sidebarOverlay');
        }
        return !!(this.sidebar && this.nav);
    }

    // ---------- Build ----------
    build(module) {
        if (!this._ensureRefs()) {
            console.warn('[Sidebar] build() — sidebar/nav not in DOM yet');
            return;
        }

        this.currentModule = module;

        let navItems = [];
        if (module === 'tea') navItems = this.getTeaNavItems();
        else if (module === 'dairy') navItems = this.getDairyNavItems();

        const sections = this.groupItemsBySection(navItems, module);
        this.nav.innerHTML = this.buildSidebarHTML(sections, module);

        // Attach click handlers
        this.nav.querySelectorAll('a[data-route]').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.dataset.route;
                this.setActiveItem(link);
                router.navigate(route);
                if (window.innerWidth < 1024) this.close();

                // Haptic (app only)
                if (window.TALAEN && window.TALAEN.isAndroidApp && navigator.vibrate) {
                    try { navigator.vibrate(8); } catch (_) {}
                }
            });
        });

        // Default active item
        const user = auth.getCurrentUser();
        const defaultRoute = this._defaultRouteFor(module, user);
        const dashboardLink = this.nav.querySelector(`[data-route="${defaultRoute}"]`);
        if (dashboardLink) this.setActiveItem(dashboardLink);

        // Fire-and-forget, cached
        this.loadDisputeCount();
    }

    _defaultRouteFor(module, user) {
        if (!user) return module === 'tea' ? 'tea-dashboard' : 'dairy-dashboard';
        if (user.role === 'tea_worker') return 'worker-dashboard';
        if (user.role === 'store_manager') return 'store-dashboard';
        return module === 'tea' ? 'tea-dashboard' : 'dairy-dashboard';
    }

    // ---------- Dispute count (cached, debounced) ----------
    async loadDisputeCount() {
        const user = auth.getCurrentUser();
        if (!user) return;
        if (this.currentModule !== 'tea') return;
        if (user.role === 'tea_worker' || user.role === 'store_manager') return;

        // 60s cache
        const now = Date.now();
        if (now - this._disputeLastFetched < 60000) return;
        if (this._disputeLoading) return;

        this._disputeLoading = true;
        try {
            const response = await api.getDisputedRecords();
            if (response && response.success) {
                this.disputeCount = response.total_disputes || 0;
                this._disputeLastFetched = Date.now();
                this.updateDisputeBadge();
            }
        } catch (e) {
            console.warn('[Sidebar] Dispute count fetch failed:', e.message);
        } finally {
            this._disputeLoading = false;
        }
    }

    updateDisputeBadge() {
        if (!this.nav) return;
        const badge = this.nav.querySelector('[data-badge="comparison"]');
        if (!badge) return;
        if (this.disputeCount > 0) {
            badge.textContent = this.disputeCount > 99 ? '99+' : this.disputeCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // ---------- Section grouping ----------
    groupItemsBySection(items, module) {
        const systemItems = ['User Management'];
        const managementItems = ['Dashboard', 'Workers', 'Dairy Workers', 'Companies', 'Milk Buyers', 'Blocks', 'Cows'];
        const workerItems = ['My Dashboard', 'Record Plucking', 'My Plucking', 'My Debts', 'Store Purchases', 'My Payments', 'My Profile'];
        const storeItems = ['Store Dashboard', 'Manage Debts', 'Worker Debts'];
        const operationsItems = ['Self Plucking', 'Verified Plucking', 'Milk Production', 'Feed Records', 'Milk Disposal'];
        const productionItems = ['Farm Inputs', 'Targets', 'Input Costs', 'Fertilizer', 'Pruning', 'Seasons'];
        const financialItems = ['Comparison', 'Store Debts', 'Pay Worker', 'Pay Store', 'Deliveries', 'My Deliveries', 'Buyer Payments', 'Payments'];
        const reportItems = ['Reports'];

        const sections = {
            system: [], worker: [], store: [],
            management: [], operations: [], production: [],
            financial: [], reports: []
        };

        items.forEach((item) => {
            if (systemItems.includes(item.label)) sections.system.push(item);
            else if (workerItems.includes(item.label)) sections.worker.push(item);
            else if (storeItems.includes(item.label)) sections.store.push(item);
            else if (managementItems.includes(item.label)) sections.management.push(item);
            else if (operationsItems.includes(item.label)) sections.operations.push(item);
            else if (productionItems.includes(item.label)) sections.production.push(item);
            else if (financialItems.includes(item.label)) sections.financial.push(item);
            else if (reportItems.includes(item.label)) sections.reports.push(item);
            else sections.management.push(item);
        });

        Object.keys(sections).forEach((key) => {
            if (sections[key].length === 0) delete sections[key];
        });

        return sections;
    }

    // ---------- HTML ----------
    buildSidebarHTML(sections, module) {
        const sectionIcons = {
            system: 'fa-shield-halved',
            worker: 'fa-user',
            store: 'fa-store',
            management: 'fa-sliders',
            operations: 'fa-list-check',
            production: 'fa-tractor',
            financial: 'fa-calculator',
            reports: 'fa-chart-simple'
        };

        const sectionTitles = {
            system: 'System',
            worker: 'My Account',
            store: 'My Store',
            management: 'Management',
            operations: 'Operations',
            production: 'Production',
            financial: 'Financial',
            reports: 'Reports'
        };

        const moduleAccent = module === 'tea' ? 'emerald' : 'sky';
        const moduleIcon = module === 'tea' ? 'fa-leaf' : 'fa-cow';
        const moduleLabel = module === 'tea' ? 'Tea Module' : 'Dairy Module';

        let html = `
            <div class="px-3 mb-4">
                <div class="flex items-center gap-2.5 px-3 py-2.5 bg-white/5 rounded-xl border border-white/5">
                    <span class="w-7 h-7 bg-${moduleAccent}-500/20 rounded-lg flex items-center justify-center">
                        <i class="fas ${moduleIcon} text-${moduleAccent}-400 text-xs"></i>
                    </span>
                    <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">${moduleLabel}</span>
                </div>
            </div>

            <button type="button"
                    class="w-full text-left text-slate-400 hover:text-white text-sm py-2.5 px-3 rounded-xl hover:bg-white/5 transition-all mb-5 flex items-center gap-2.5 font-medium group"
                    onclick="router.goToModuleSelector()">
                <span class="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-all">
                    <i class="fas fa-arrow-left text-xs"></i>
                </span>
                Back to Modules
            </button>
        `;

        Object.entries(sections).forEach(([sectionKey, sectionItems]) => {
            if (sectionItems.length > 0) {
                html += `
                    <div class="mb-5">
                        <div class="px-3 mb-2">
                            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] flex items-center gap-2">
                                <i class="fas ${sectionIcons[sectionKey]} text-[9px]"></i>
                                ${sectionTitles[sectionKey]}
                            </span>
                        </div>
                        ${sectionItems.map((item) => this.createNavItem(item, moduleAccent)).join('')}
                    </div>
                `;
            }
        });

        return html;
    }

    // ---------- Nav item definitions ----------
    getTeaNavItems() {
        const user = auth.getCurrentUser();
        if (!user) return [];

        const isAdmin = user.role === 'farm_owner' || user.role === 'supervisor';
        const isStoreManager = user.role === 'store_manager';
        const isTeaWorker = user.role === 'tea_worker';

        // Worker
        if (isTeaWorker) {
            return [
                { route: 'worker-dashboard', icon: 'fa-home', label: 'My Dashboard' },
                { route: 'tea-plucking-self', icon: 'fa-leaf', label: 'Record Plucking' },
                { route: 'worker-plucking', icon: 'fa-list', label: 'My Plucking' },
                { route: 'worker-debts', icon: 'fa-credit-card', label: 'My Debts' },
                { route: 'worker-store', icon: 'fa-shopping-basket', label: 'Store Purchases' },
                { route: 'worker-payments', icon: 'fa-money-bill-wave', label: 'My Payments' },
                { route: 'worker-profile', icon: 'fa-id-card', label: 'My Profile' }
            ];
        }

        // Store manager
        if (isStoreManager) {
            return [
                { route: 'store-dashboard', icon: 'fa-home', label: 'Store Dashboard' },
                { route: 'tea-debts', icon: 'fa-credit-card', label: 'Manage Debts' },
                { route: 'store-worker-debts', icon: 'fa-users', label: 'Worker Debts' },
                { route: 'store-profile', icon: 'fa-id-card', label: 'My Profile' }
            ];
        }

        // Admin
        const items = [];
        if (isAdmin) {
            items.push({ route: 'user-management', icon: 'fa-users-gear', label: 'User Management' });
            items.push(
                { route: 'tea-dashboard', icon: 'fa-grid-2', label: 'Dashboard' },
                { route: 'tea-workers', icon: 'fa-users', label: 'Workers' },
                { route: 'tea-companies', icon: 'fa-building', label: 'Companies' },
                { route: 'tea-blocks', icon: 'fa-map-pin', label: 'Blocks' },
                { route: 'tea-wage-rate', icon: 'fa-coins', label: 'Wage Rate' }
            );
        }
        items.push({ route: 'tea-plucking-self', icon: 'fa-leaf', label: 'Self Plucking' });
        if (isAdmin) {
            items.push({ route: 'tea-plucking-verified', icon: 'fa-check-double', label: 'Verified Plucking' });
            items.push(
                { route: 'tea-farm-inputs', icon: 'fa-seedling', label: 'Farm Inputs' },
                { route: 'tea-targets', icon: 'fa-bullseye', label: 'Targets' },
                { route: 'tea-input-costs', icon: 'fa-coins', label: 'Input Costs' },
                { route: 'tea-fertilizer', icon: 'fa-calendar-check', label: 'Fertilizer' },
                { route: 'tea-pruning', icon: 'fa-scissors', label: 'Pruning' },
                { route: 'tea-seasonal', icon: 'fa-chart-line', label: 'Seasons' }
            );
            items.push(
                { route: 'tea-comparison', icon: 'fa-scale-balanced', label: 'Comparison', badge: true },
                { route: 'tea-debts', icon: 'fa-credit-card', label: 'Store Debts' },
                { route: 'tea-pay-worker', icon: 'fa-hand-holding-dollar', label: 'Pay Worker' },
                { route: 'tea-pay-store', icon: 'fa-shop', label: 'Pay Store' }
            );
            items.push({ route: 'tea-reports', icon: 'fa-file-chart-column', label: 'Reports' });
        }
        return items;
    }

    getDairyNavItems() {
        const user = auth.getCurrentUser();
        if (!user) return [];

        const isAdmin = user.role === 'farm_owner' || user.role === 'supervisor';
        const isDairyWorker = user.role === 'dairy_worker';
        const isBuyer = user.role === 'milk_buyer';

        const items = [];

        if (isAdmin) {
            items.push({ route: 'user-management', icon: 'fa-users-gear', label: 'User Management' });
            items.push(
                { route: 'dairy-dashboard', icon: 'fa-grid-2', label: 'Dashboard' },
                { route: 'dairy-cows', icon: 'fa-cow', label: 'Cows' },
                { route: 'dairy-workers', icon: 'fa-user-helmet-safety', label: 'Dairy Workers' },
                { route: 'dairy-buyers', icon: 'fa-user-tie', label: 'Milk Buyers' }
            );
        }
        if (isAdmin || isDairyWorker) {
            items.push(
                { route: 'dairy-production', icon: 'fa-flask', label: 'Milk Production' },
                { route: 'dairy-feed', icon: 'fa-wheat-awn', label: 'Feed Records' }
            );
        }
        if (isAdmin) {
            items.push({ route: 'dairy-disposal', icon: 'fa-truck-fast', label: 'Milk Disposal' });
            items.push(
                { route: 'dairy-pay-worker', icon: 'fa-hand-holding-dollar', label: 'Pay Worker' },
                { route: 'dairy-deliveries', icon: 'fa-truck-ramp-box', label: 'Deliveries' },
                { route: 'dairy-buyer-payments', icon: 'fa-file-invoice', label: 'Buyer Payments' }
            );
        }
        if (isBuyer) {
            items.push(
                { route: 'dairy-deliveries', icon: 'fa-truck-ramp-box', label: 'My Deliveries' },
                { route: 'dairy-buyer-payments', icon: 'fa-file-invoice', label: 'Payments' }
            );
        }
        if (isAdmin) {
            items.push({ route: 'dairy-reports', icon: 'fa-file-chart-column', label: 'Reports' });
        }
        return items;
    }

    createNavItem(item, moduleAccent = 'emerald') {
        const badgeHtml = item.badge
            ? `<span data-badge="comparison" class="hidden absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">0</span>`
            : '';
        return `
            <a href="#" data-route="${item.route}"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 transition-all cursor-pointer font-medium text-[13px] group mb-0.5 relative">
                <span class="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-${moduleAccent}-500/15 transition-all">
                    <i class="fas ${item.icon} text-xs group-hover:text-${moduleAccent}-400 transition-colors"></i>
                </span>
                <span class="flex-1 group-hover:text-slate-200 transition-colors">${item.label}</span>
                ${badgeHtml}
                <span class="opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fas fa-chevron-right text-[9px] text-slate-600"></i>
                </span>
            </a>
        `;
    }

    // ---------- Active item ----------
    setActiveItem(activeLink) {
        if (!this.nav) return;
        this.nav.querySelectorAll('a[data-route]').forEach((link) => {
            link.classList.remove('sidebar-link-active');
            link.removeAttribute('aria-current');
        });
        if (activeLink) {
            activeLink.classList.add('sidebar-link-active');
            activeLink.setAttribute('aria-current', 'page');
            this.activeRoute = activeLink.dataset.route;
        }
    }

    setActiveRoute(route) {
        if (!this.nav) return;
        const link = this.nav.querySelector(`[data-route="${route}"]`);
        if (link) this.setActiveItem(link);
    }

    // ---------- Open / close ----------
    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        if (this.isOpen) return;
        if (!this._ensureRefs()) return;
        this.sidebar.classList.add('sidebar-open');
        if (this.overlay) this.overlay.classList.remove('hidden');
        this.isOpen = true;
        document.body.classList.add('sidebar-locked');
        if (typeof navbar !== 'undefined' && navbar && typeof navbar.updateHamburgerIcon === 'function') {
            navbar.updateHamburgerIcon(true);
        }
    }

    close() {
        if (!this.isOpen) return;
        if (!this._ensureRefs()) return;
        this.sidebar.classList.remove('sidebar-open');
        if (this.overlay) this.overlay.classList.add('hidden');
        this.isOpen = false;
        document.body.classList.remove('sidebar-locked');
        if (typeof navbar !== 'undefined' && navbar && typeof navbar.updateHamburgerIcon === 'function') {
            navbar.updateHamburgerIcon(false);
        }
    }

    // ---------- Refresh (debounced) ----------
    refresh() {
        if (this._refreshTimer) clearTimeout(this._refreshTimer);
        this._refreshTimer = setTimeout(() => {
            this._refreshTimer = null;
            if (!this.currentModule) return;
            this.build(this.currentModule);
            if (this.activeRoute) this.setActiveRoute(this.activeRoute);
        }, 100);
    }
}

// Global instance — will heal itself via _ensureRefs()
const sidebar = new Sidebar();
window.sidebar = sidebar;
