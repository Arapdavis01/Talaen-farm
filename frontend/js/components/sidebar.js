// ============================================
// TALAEN FARM - Sidebar Component
// ============================================

class Sidebar {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.nav = document.getElementById('sidebarNav');
        this.overlay = document.getElementById('sidebarOverlay');
        this.isOpen = false;
    }

    build(module) {
        let navItems = [];

        if (module === 'tea') {
            navItems = this.getTeaNavItems();
        } else if (module === 'dairy') {
            navItems = this.getDairyNavItems();
        }

        this.nav.innerHTML = navItems.map(item => this.createNavItem(item)).join('');

        // Add click handlers
        this.nav.querySelectorAll('a[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.dataset.route;
                router.navigate(route);
                
                // Close sidebar on mobile
                if (window.innerWidth < 1024) {
                    this.close();
                }
            });
        });

        // Add back button at top
        const backButton = document.createElement('div');
        backButton.className = 'px-3 pb-2';
        backButton.innerHTML = `
            <button class="w-full text-left text-green-200 hover:text-white text-sm py-2 px-3 rounded-lg hover:bg-white/10 transition-colors" onclick="router.goToModuleSelector()">
                <i class="fas fa-arrow-left mr-2"></i>Back to Modules
            </button>
        `;
        this.nav.insertBefore(backButton, this.nav.firstChild);
    }

    getTeaNavItems() {
        const user = auth.getCurrentUser();
        const isAdmin = user.role === 'farm_owner' || user.role === 'supervisor';
        const isStoreManager = user.role === 'store_manager';
        const isTeaWorker = user.role === 'tea_worker';

        const items = [];

        if (isAdmin) {
            items.push(
                { route: 'tea-dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
                { route: 'tea-workers', icon: 'fa-users', label: 'Workers' },
                { route: 'tea-companies', icon: 'fa-building', label: 'Companies' },
                { route: 'tea-blocks', icon: 'fa-map', label: 'Blocks' },
                { route: 'tea-wage-rate', icon: 'fa-money-bill-wave', label: 'Wage Rate' }
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
                { route: 'tea-pay-store', icon: 'fa-store', label: 'Pay Store' },
                { route: 'tea-reports', icon: 'fa-chart-bar', label: 'Reports' }
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
                { route: 'dairy-dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
                { route: 'dairy-cows', icon: 'fa-cow', label: 'Cows' },
                { route: 'dairy-workers', icon: 'fa-users', label: 'Dairy Workers' },
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
                { route: 'dairy-reports', icon: 'fa-chart-bar', label: 'Reports' }
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

    createNavItem(item) {
        return `
            <a href="#" data-route="${item.route}" 
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors cursor-pointer">
                <i class="fas ${item.icon} w-5 text-center"></i>
                <span class="text-sm">${item.label}</span>
            </a>
        `;
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
    }

    close() {
        this.sidebar.classList.remove('sidebar-open');
        this.overlay.classList.add('hidden');
        this.isOpen = false;
    }
}

// Create global sidebar instance
const sidebar = new Sidebar();
