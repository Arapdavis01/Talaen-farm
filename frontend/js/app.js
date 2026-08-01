// ============================================
// TALAEN FARM - Main Application
// ============================================

class App {
    constructor() {
        this.init();
    }

    init() {
        // Check if user is already logged in
        if (auth.isAuthenticated()) {
            this.showApp();
        }

        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            // Handle navigation if needed
        });

        console.log('Talaen Farm Management System initialized');
        console.log('Version:', CONFIG.APP_VERSION);
    }

    showApp() {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');

        const user = auth.getCurrentUser();
        const availableModules = JSON.parse(localStorage.getItem('available_modules') || '[]');
        
        // Update sidebar role
        document.getElementById('sidebarRole').textContent = this.getRoleDisplay(user.role);
        
        // Show module selector
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
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Handle global errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
