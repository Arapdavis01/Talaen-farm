// ============================================
// TALAEN FARM - Module Selector
// ============================================

class ModuleSelector {
    static show(availableModules) {
        const mainContent = document.getElementById('mainContent');
        
        const cards = [];
        
        if (availableModules.includes('tea')) {
            cards.push(`
                <div class="module-card bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl cursor-pointer" 
                     onclick="ModuleSelector.selectModule('tea')">
                    <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-leaf text-green-600 text-5xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-3">Tea Farm</h2>
                    <p class="text-gray-500 mb-4">Manage plucking, workers, debts, and sales</p>
                    <span class="inline-flex items-center text-green-600 font-medium">
                        Enter Module <i class="fas fa-arrow-right ml-2"></i>
                    </span>
                </div>
            `);
        }

        if (availableModules.includes('dairy')) {
            cards.push(`
                <div class="module-card bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl cursor-pointer" 
                     onclick="ModuleSelector.selectModule('dairy')">
                    <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-cow text-blue-600 text-5xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-3">Dairy Farm</h2>
                    <p class="text-gray-500 mb-4">Manage cows, milk production, and sales</p>
                    <span class="inline-flex items-center text-blue-600 font-medium">
                        Enter Module <i class="fas fa-arrow-right ml-2"></i>
                    </span>
                </div>
            `);
        }

        mainContent.innerHTML = `
            <div class="min-h-[80vh] flex items-center justify-center">
                <div class="w-full max-w-4xl">
                    <div class="text-center mb-10">
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">Welcome, ${auth.getCurrentUser().full_name}</h1>
                        <p class="text-gray-500">Select a farm module to manage</p>
                    </div>
                    <div class="grid md:grid-cols-2 gap-6 px-4">
                        ${cards.join('')}
                    </div>
                </div>
            </div>
        `;

        // Clear sidebar
        document.getElementById('sidebarNav').innerHTML = '';
    }

    static selectModule(module) {
        // Build routes for the module
        router.buildModuleRoutes(module);
        
        // Build sidebar
        sidebar.build(module);
        
        // Navigate to dashboard
        const dashboardRoute = module === 'tea' ? 'tea-dashboard' : 'dairy-dashboard';
        router.navigate(dashboardRoute);
    }
}
