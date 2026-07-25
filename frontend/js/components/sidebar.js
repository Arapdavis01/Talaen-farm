// ============================================
// TALAEN FARM - Sidebar Component (Professional)
// ============================================

class Sidebar {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.nav = document.getElementById('sidebarNav');
        this.overlay = document.getElementById('sidebarOverlay');
        this.isOpen = false;
        this.currentModule = null;
        this.activeRoute = null;
        this.disputeCount = 0;
    }

    build(module) {
        this.currentModule = module;
        let navItems = [];

        if (module === 'tea') {
            navItems = this.getTeaNavItems();
        } else if (module === 'dairy') {
            navItems = this.getDairyNavItems();
        }

        // Group items by section
        const sections = this.groupItemsBySection(navItems, module);
        
        // Build sidebar HTML with sections
        this.nav.innerHTML = this.buildSidebarHTML(sections, module);

        // Add click handlers
        this.nav.querySelectorAll('a[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.dataset.route;
                this.setActiveItem(link);
                router.navigate(route);
                
                // Close sidebar on mobile
                if (window.innerWidth < 1024) {
                    this.close();
                }
            });
        });

        // Highlight the dashboard route by default
        const dashboardRoute = module === 'tea' ? 'tea-dashboard' : 'dairy-dashboard';
        const dashboardLink = this.nav.querySelector(`[data-route="${dashboardRoute}"]`);
        if (dashboardLink) {
            this.setActiveItem(dashboardLink);
        }

        // Load dispute count for badge
        this.loadDisputeCount();
    }

    async loadDisputeCount() {
        if (this.currentModule !== 'tea') return;
        try {
            const response = await api.getDisputedRecords();
            if (response.success) {
                this.disputeCount = response.total_disputes || 0;
                this.updateDisputeBadge();
            }
        } catch (e) {
            // Silently fail - badge is optional
        }
    }

    updateDisputeBadge() {
        const badge = this.nav.querySelector('#comparisonBadge');
        if (badge) {
            if (this.disputeCount > 0) {
                badge.textContent = this.disputeCount > 99 ? '99+' : this.disputeCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    groupItemsBySection(items, module) {
        const systemItems = ['User Management'];
        const managementItems = ['Dashboard', 'Workers', 'Dairy Workers', 'Companies', 'Milk Buyers', 'Blocks', 'Cows'];
        const settingsItems = ['Wage Rate'];
        const operationsItems = ['Self Plucking', 'Verified Plucking', 'Milk Production', 'Feed Records', 'Milk Disposal'];
        const financialItems = ['Comparison', 'Store Debts', 'My Debts', 'Pay Worker', 'Pay Store', 'Deliveries', 'My Deliveries', 'Buyer Payments', 'Payments'];
        const reportItems = ['Reports'];

        const sections = {
            system: [],
            management: [],
            operations: [],
            financial: [],
            reports: []
        };

        items.forEach(item => {
            if (systemItems.includes(item.label)) sections.system.push(item);
            else if (managementItems.includes(item.label)) sections.management.push(item);
            else if (operationsItems.includes(item.label)) sections.operations.push(item);
            else if (financialItems.includes(item.label)) sections.financial.push(item);
            else if (reportItems.includes(item.label)) sections.reports.push(item);
            else sections.management.push(item);
        });

        // Remove empty sections
        Object.keys(sections).forEach(key => {
            if (sections[key].length === 0) delete sections[key];
        });

        return sections;
    }

    buildSidebarHTML(sections, module) {
        const sectionIcons = {
            system: 'fa-shield-halved',
            management: 'fa-sliders',
            operations: 'fa-list-check',
            financial: 'fa-calculator',
            reports: 'fa-chart-simple'
        };

        const sectionTitles = {
            system: 'System',
            management: 'Management',
            operations: 'Operations',
            financial: 'Financial',
            reports: 'Reports'
        };

        const moduleAccent = module === 'tea' ? 'emerald' : 'sky';
        const moduleIcon = module === 'tea' ? 'fa-leaf' : 'fa-cow';
        const moduleLabel = module === 'tea' ? 'Tea Module' : 'Dairy Module';

        let html = '';

        // Module indicator badge
        html += `
            <div class="px-3 mb-4">
                <div class="flex items-center gap-2.5 px-3 py-2.5 bg-white/5 rounded-xl border border-white/5">
                    <span class="w-7 h-7 bg-${moduleAccent}-500/20 rounded-lg flex items-center justify-center">
                        <i class="fas ${moduleIcon} text-${moduleAccent}-400 text-xs"></i>
                    </span>
                    <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">${moduleLabel}</span>
                </div>
            </div>
        `;

        // Back button
        html += `
            <button class="w-full text-left text-slate-400 hover:text-white text-sm py-2.5 px-3 rounded-xl hover:bg-white/5 transition-all mb-5 flex items-center gap-2.5 font-medium group"
                    onclick="router.goToModuleSelector()">
                <span class="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-all">
                    <i class="fas fa-arrow-left text-xs"></i>
                </span>
                Back to Modules
            </button>
        `;

        // Navigation sections
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
                        ${sectionItems.map(item => this.createNavItem(item, moduleAccent)).join('')}
                    </div>
                `;
            }
        });

        return html;
    }

    getTeaNavItems() {
        const user = auth.getCurrentUser();
        const isAdmin = user.role === 'farm_owner' || user.role === 'supervisor';
        const isStoreManager = user.role === 'store_manager';
        const isTeaWorker = user.role === 'tea_worker';

        const items = [];

        // System section
        if (isAdmin) {
            items.push(
                { route: 'user-management', icon: 'fa-users-gear', label: 'User Management' }
            );
        }

        // Management section
        if (isAdmin) {
            items.push(
                { route: 'tea-dashboard', icon: 'fa-grid-2', label: 'Dashboard' },
                { route: 'tea-workers', icon: 'fa-users', label: 'Workers' },
                { route: 'tea-companies', icon: 'fa-building', label: 'Companies' },
                { route: 'tea-blocks', icon: 'fa-map-pin', label: 'Blocks' },
                { route: 'tea-wage-rate', icon: 'fa-coins', label: 'Wage Rate' }
            );
        }

        // Operations section
        items.push(
            { route: 'tea-plucking-self', icon: 'fa-leaf', label: 'Self Plucking' }
        );

        if (isAdmin) {
            items.push(
                { route: 'tea-plucking-verified', icon: 'fa-check-double', label: 'Verified Plucking' }
            );
        }

        // Financial section
        if (isAdmin) {
            items.push(
                { route: 'tea-comparison', icon: 'fa-scale-balanced', label: 'Comparison', badge: true },
                { route: 'tea-debts', icon: 'fa-credit-card', label: 'Store Debts' },
                { route: 'tea-pay-worker', icon: 'fa-hand-holding-dollar', label: 'Pay Worker' },
                { route: 'tea-pay-store', icon: 'fa-shop', label: 'Pay Store' }
            );
        }

        if (isStoreManager) {
            items.push(
                { route: 'tea-debts', icon: 'fa-credit-card', label: 'Store Debts' }
            );
        }

        if (isTeaWorker) {
            items.push(
                { route: 'tea-debts', icon: 'fa-credit-card', label: 'My Debts' }
            );
        }

        // Reports section
        if (isAdmin) {
            items.push(
                { route: 'tea-reports', icon: 'fa-file-chart-column', label: 'Reports' }
            );
        }

        return items;
    }

    getDairyNavItems() {
        const user = auth.getCurrentUser();
        const isAdmin = user.role === 'farm_owner' || user.role === 'supervisor';
        const isDairyWorker = user.role === 'dairy_worker';
        const isBuyer = user.role === 'milk_buyer';

        const items = [];

        // System section
        if (isAdmin) {
            items.push(
                { route: 'user-management', icon: 'fa-users-gear', label: 'User Management' }
            );
        }

        // Management section
        if (isAdmin) {
            items.push(
                { route: 'dairy-dashboard', icon: 'fa-grid-2', label: 'Dashboard' },
                { route: 'dairy-cows', icon: 'fa-cow', label: 'Cows' },
                { route: 'dairy-workers', icon: 'fa-user-helmet-safety', label: 'Dairy Workers' },
                { route: 'dairy-buyers', icon: 'fa-user-tie', label: 'Milk Buyers' }
            );
        }

        // Operations section
        if (isAdmin || isDairyWorker) {
            items.push(
                { route: 'dairy-production', icon: 'fa-flask', label: 'Milk Production' },
                { route: 'dairy-feed', icon: 'fa-wheat-awn', label: 'Feed Records' }
            );
        }

        if (isAdmin) {
            items.push(
                { route: 'dairy-disposal', icon: 'fa-truck-fast', label: 'Milk Disposal' }
            );
        }

        // Financial section
        if (isAdmin) {
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

        // Reports section
        if (isAdmin) {
            items.push(
                { route: 'dairy-reports', icon: 'fa-file-chart-column', label: 'Reports' }
            );
        }

        return items;
    }

    createNavItem(item, moduleAccent = 'emerald') {
        return `
            <a href="#" data-route="${item.route}" 
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 transition-all cursor-pointer font-medium text-[13px] group mb-0.5 relative">
                <span class="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-${moduleAccent}-500/15 transition-all">
                    <i class="fas ${item.icon} text-xs group-hover:text-${moduleAccent}-400 transition-colors"></i>
                </span>
                <span class="flex-1 group-hover:text-slate-200 transition-colors">${item.label}</span>
                ${item.badge ? `<span id="comparisonBadge" class="hidden absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">0</span>` : ''}
                <span class="opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fas fa-chevron-right text-[9px] text-slate-600"></i>
                </span>
            </a>
        `;
    }

    setActiveItem(activeLink) {
        // Remove active class from all links
        this.nav.querySelectorAll('a[data-route]').forEach(link => {
            link.classList.remove('sidebar-link-active');
        });
        
        // Add active class to clicked link
        if (activeLink) {
            activeLink.classList.add('sidebar-link-active');
            this.activeRoute = activeLink.dataset.route;
        }
    }

    setActiveRoute(route) {
        const link = this.nav.querySelector(`[data-route="${route}"]`);
        if (link) {
            this.setActiveItem(link);
        }
    }

    toggle() {
        if (this.isOpen) { this.close(); } else { this.open(); }
    }

    open() {
        this.sidebar.classList.add('sidebar-open');
        this.overlay.classList.remove('hidden');
        this.isOpen = true;
        if (typeof navbar !== 'undefined' && navbar.updateHamburgerIcon) { navbar.updateHamburgerIcon(true); }
    }

    close() {
        this.sidebar.classList.remove('sidebar-open');
        this.overlay.classList.add('hidden');
        this.isOpen = false;
        if (typeof navbar !== 'undefined' && navbar.updateHamburgerIcon) { navbar.updateHamburgerIcon(false); }
    }

    refresh() {
        if (this.currentModule) {
            this.build(this.currentModule);
            if (this.activeRoute) { this.setActiveRoute(this.activeRoute); }
        }
    }
}

// Create global sidebar instance
const sidebar = new Sidebar();
