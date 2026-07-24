// ============================================
// TALAEN FARM - Module Selector
// ============================================

class ModuleSelector {
    static show(availableModules) {
        const mainContent = document.getElementById('mainContent');
        
        const cards = [];
        
        if (availableModules.includes('tea')) {
            cards.push(`
                <div class="module-card relative bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer group animate-fadeInUp" 
                     onclick="ModuleSelector.selectModule('tea')">
                    <!-- Tea Farm Image -->
                    <div class="relative h-52 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                             alt="Tea Farm" 
                             class="module-card-image w-full h-full object-cover">
                        <div class="module-card-overlay absolute inset-0 bg-gradient-to-t from-green-900/85 via-green-900/40 to-transparent"></div>
                        
                        <!-- Overlay Content -->
                        <div class="absolute bottom-0 left-0 right-0 p-6">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                                    <i class="fas fa-leaf text-white text-2xl"></i>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-bold text-white">Tea Farm</h2>
                                    <p class="text-green-200 text-sm">Plucking & Sales Management</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Card Bottom -->
                    <div class="px-6 py-4 flex items-center justify-between bg-white">
                        <div class="flex flex-wrap gap-2">
                            <span class="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">Plucking</span>
                            <span class="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">Workers</span>
                            <span class="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">Sales</span>
                        </div>
                        <span class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-all duration-300">
                            <i class="fas fa-arrow-right text-green-600 group-hover:text-white transition-colors text-sm"></i>
                        </span>
                    </div>
                </div>
            `);
        }

        if (availableModules.includes('dairy')) {
            cards.push(`
                <div class="module-card relative bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer group animate-fadeInUp" 
                     onclick="ModuleSelector.selectModule('dairy')" style="animation-delay: 0.15s;">
                    <!-- Dairy Farm Image -->
                    <div class="relative h-52 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                             alt="Dairy Farm" 
                             class="module-card-image w-full h-full object-cover">
                        <div class="module-card-overlay absolute inset-0 bg-gradient-to-t from-blue-900/85 via-blue-900/40 to-transparent"></div>
                        
                        <!-- Overlay Content -->
                        <div class="absolute bottom-0 left-0 right-0 p-6">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                                    <i class="fas fa-cow text-white text-2xl"></i>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-bold text-white">Dairy Farm</h2>
                                    <p class="text-blue-200 text-sm">Milk & Cattle Management</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Card Bottom -->
                    <div class="px-6 py-4 flex items-center justify-between bg-white">
                        <div class="flex flex-wrap gap-2">
                            <span class="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">Cows</span>
                            <span class="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">Milk</span>
                            <span class="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">Feed</span>
                        </div>
                        <span class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-all duration-300">
                            <i class="fas fa-arrow-right text-blue-600 group-hover:text-white transition-colors text-sm"></i>
                        </span>
                    </div>
                </div>
            `);
        }

        mainContent.innerHTML = `
            <div class="min-h-[80vh] flex items-center justify-center py-8 px-4">
                <div class="w-full max-w-5xl">
                    <!-- Header -->
                    <div class="text-center mb-12 animate-fadeInDown">
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-xl shadow-green-500/25">
                            <i class="fas fa-tractor text-white text-3xl"></i>
                        </div>
                        <h1 class="text-4xl font-extrabold text-gray-800 mb-3">
                            Welcome, <span class="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">${auth.getCurrentUser().full_name}</span>
                        </h1>
                        <p class="text-lg text-gray-500 max-w-md mx-auto">Select a farm module below to start managing your operations</p>
                    </div>
                    
                    <!-- Module Cards -->
                    <div class="grid md:grid-cols-2 gap-8 px-0 md:px-4">
                        ${cards.join('')}
                    </div>
                    
                    <!-- Footer Hint -->
                    <p class="text-center text-gray-400 text-sm mt-10 animate-fadeIn" style="animation-delay: 0.3s;">
                        <i class="fas fa-info-circle mr-1"></i>
                        Click on a module card to enter the management dashboard
                    </p>
                </div>
            </div>
        `;

        // Clear sidebar
        document.getElementById('sidebarNav').innerHTML = '';
    }

    static selectModule(module) {
        // Add a subtle transition effect before navigating
        const cards = document.querySelectorAll('.module-card');
        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            card.style.transition = 'all 0.3s ease';
        });
        
        setTimeout(() => {
            // Build routes for the module
            router.buildModuleRoutes(module);
            
            // Build sidebar
            sidebar.build(module);
            
            // Navigate to dashboard
            const dashboardRoute = module === 'tea' ? 'tea-dashboard' : 'dairy-dashboard';
            router.navigate(dashboardRoute);
        }, 300);
    }
}
