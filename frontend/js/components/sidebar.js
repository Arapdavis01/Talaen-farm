// ============================================
// TALAEN FARM - Sidebar Component (Improved)
// ============================================

class Sidebar {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.nav = document.getElementById('sidebarNav');
        this.overlay = document.getElementById('sidebarOverlay');
        this.isOpen = false;
        this.currentModule = null;
        this.activeRoute = null;
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
    }

    groupItemsBySection(items, module) {
        const managementItems = ['Dashboard', 'Workers', 'Dairy Workers', 'Companies', 'Milk Buyers', 'Blocks', 'Cows'];
        const settingsItems = ['Wage Rate'];
        const operationsItems = ['Self Plucking', 'Verified Plucking', 'Milk Production', 'Feed Records', 'Milk Disposal'];
        const financialItems = ['Comparison', 'Store Debts', 'My Debts', 'Pay Worker', 'Pay Store', 'Deliveries', 'My Deliveries', 'Buyer Payments', 'Payments'];
        const reportItems = ['Reports'];

        const sections = {
            management: [],
            operations: [],
            financial: [],
            reports: []
        };

        items.forEach(item => {
            if (managementItems.includes(item.label)) sections.management.push(item);
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
            management: 'fa-cog',
            operations: 'fa-tasks',
            financial: 'fa-calculator',
            reports: 'fa-chart-bar'
        };

        const sectionTitles = {
            management: 'Management',
            operations: 'Operations',
            financial: 'Financial',
            reports: 'Reports'
        };

        const moduleColor = module === 'tea' ? 'green' : 'blue';
        const moduleIcon = module === 'tea' ? 'fa-leaf' : 'fa-cow';
        const moduleLabel = module === 'tea' ? 'Tea Module' : 'Dairy Module';

        let html = '';

        // Module indicator
        html += `
            <div class="px-3 mb-3">
                <div class="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
                    <span class="w-6 h-6 bg-${moduleColor}-400/30 rounded-lg flex items-center justify-center">
                        <i class="fas ${moduleIcon} text-${moduleColor}-300 text-xs"></i>
                    </span>
                    <span class="text-xs font-medium text-white/60 uppercase tracking-wider">${moduleLabel}</span>
                </div>
            </div>
        `;

        // Back button
        html += `
            <button class="w-full text-left text-green-200/80 hover:text-white text-sm py-2.5 px-3 rounded-xl hover:bg-white/10 transition-all mb-4 flex items-center gap-2 font-medium group"
                    onclick="router.goToModuleSelector()">
                <span class="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-all">
                    <i class="fas fa-arrow-left text-xs"></i>
                </span>
                Back to Modules
            </button>
        `;

        // Navigation sections
        Object.entries(sections).forEach(([sectionKey, sectionItems]) => {
            if (sectionItems.length > 0) {
                html += `
                    <div class="mb-4">
                        <div class="px-3 mb-2">
                            <span class="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                                <i class="fas ${sectionIcons[sectionKey]} text-[10px]"></i>
                                ${sectionTitles[sectionKey]}
                            </span>
                        </div>
                        ${sectionItems.map(item => this.createNavItem(item, moduleColor)).join('')}
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

        if (isAdmin) {
            items.push(
                { route: 'tea-dashboard', icon: 'fa-th-large', label: 'Dashboard' },
                { route: 'tea-workers', icon: 'fa-users', label: 'Workers' },
                { route: 'tea-companies', icon: 'fa-building', label: 'Companies' },
                { route: 'tea-blocks', icon: 'fa-map-marker-alt', label: 'Blocks' },
                { route: 'tea-wage-rate', icon: 'fa-dollar-sign', label: 'Wage Rate' }
            );
        }

        items.push(
            { route: 'tea-plucking-self', icon: 'fa-leaf', label: 'Self Plucking' }
        );

        if (isAdmin) {
            items.push(
                { route: 'tea-plucking-verified', icon: 'fa-check-double', label: 'Verified Plucking' },
                { route: 'tea-comparison', icon: 'fa-balance-scale', label: 'Comparison' },
                { route: 'tea-debts', icon: 'fa-credit-card', label: 'Store Debts' },
                { route: 'tea-pay-worker', icon: 'fa-hand-holding-usd', label: 'Pay Worker' },
                { route: 'tea-pay-store', icon: 'fa-store-alt', label: 'Pay Store' },
                { route: 'tea-reports', icon: 'fa-file-invoice-dollar', label: 'Reports' }
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

        return items;
    }

    getDairyNavItems() {
        const user = auth.getCurrentUser();
        const isAdmin = user.role === 'farm_owner' || user.role === 'supervisor';
        const isDairyWorker = user.role === 'dairy_worker';
        const isBuyer = user.role === 'milk_buyer';

        const items = [];

        if (isAdmin) {
            items.push(
                { route: 'dairy-dashboard', icon: 'fa-th-large', label: 'Dashboard' },
                { route: 'dairy-cows', icon: 'fa-cow', label: 'Cows' },
                { route: 'dairy-workers', icon: 'fa-user-hard-hat', label: 'Dairy Workers' },
                { route: 'dairy-buyers', icon: 'fa-user-tie', label: 'Milk Buyers' }
            );
        }

        if (isAdmin || isDairyWorker) {
            items.push(
                { route: 'dairy-production', icon: 'fa-flask', label: 'Milk Production' },
                { route: 'dairy-feed', icon: 'fa-seedling', label: 'Feed Records' }
            );
        }

        if (isAdmin) {
            items.push(
                { route: 'dairy-disposal', icon: 'fa-truck', label: 'Milk Disposal' },
                { route: 'dairy-pay-worker', icon: 'fa-hand-holding-usd', label: 'Pay Worker' },
                { route: 'dairy-deliveries', icon: 'fa-shipping-fast', label: 'Deliveries' },
                { route: 'dairy-buyer-payments', icon: 'fa-receipt', label: 'Buyer Payments' },
                { route: 'dairy-reports', icon: 'fa-file-invoice-dollar', label: 'Reports' }
            );
        }

        if (isBuyer) {
            items.push(
                { route: 'dairy-deliveries', icon: 'fa-shipping-fast', label: 'My Deliveries' },
                { route: 'dairy-buyer-payments', icon: 'fa-receipt', label: 'Payments' }
            );
        }

        return items;
    }

    createNavItem(item, moduleColor = 'green') {
        return `
            <a href="#" data-route="${item.route}" 
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-green-100 hover:bg-white/10 transition-all cursor-pointer font-medium text-sm group mb-0.5">
                <span class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-all">
                    <i class="fas ${item.icon} text-xs"></i>
                </span>
                <span class="flex-1">${item.label}</span>
                <span class="opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fas fa-chevron-right text-[10px] text-white/40"></i>
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

    // Set active route programmatically
    setActiveRoute(route) {
        const link = this.nav.querySelector(`[data-route="${route}"]`);
        if (link) {
            this.setActiveItem(link);
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.sidebar.classList.add('sidebar-open');
        this.overlay.classList.remove('hidden');
        this.isOpen = true;
        
        // Update hamburger icon if navbar exists
        if (typeof navbar !== 'undefined' && navbar.updateHamburgerIcon) {
            navbar.updateHamburgerIcon(true);
        }
    }

    close() {
        this.sidebar.classList.remove('sidebar-open');
        this.overlay.classList.add('hidden');
        this.isOpen = false;
        
        // Update hamburger icon if navbar exists
        if (typeof navbar !== 'undefined' && navbar.updateHamburgerIcon) {
            navbar.updateHamburgerIcon(false);
        }
    }

    // Refresh sidebar for current module
    refresh() {
        if (this.currentModule) {
            this.build(this.currentModule);
            if (this.activeRoute) {
                this.setActiveRoute(this.activeRoute);
            }
        }
    }
}

// Create global sidebar instance
const sidebar = new Sidebar();
