// ============================================
// TALAEN FARM - Module Selector
// ============================================

class ModuleSelector {
    static show(availableModules) {
        const mainContent = document.getElementById('mainContent');
        
        // Change background to modules background
        if (typeof bgManager !== 'undefined') {
            bgManager.setModulesBackground();
        }
        
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
                        <div class="module-card-overlay absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/45 to-transparent"></div>
                        
                        <!-- Overlay Content -->
                        <div class="absolute bottom-0 left-0 right-0 p-6">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/15">
                                    <i class="fas fa-leaf text-white text-xl"></i>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-bold text-white tracking-tight">Tea Farm</h2>
                                    <p class="text-emerald-200 text-sm font-medium">Plucking & Sales Management</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Card Bottom -->
                    <div class="px-6 py-4 flex items-center justify-between bg-white border-t border-stone-100">
                        <div class="flex flex-wrap gap-2">
                            <span class="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">Plucking</span>
                            <span class="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">Workers</span>
                            <span class="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">Sales</span>
                        </div>
                        <span class="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center group-hover:bg-emerald-600 transition-all duration-300 border border-emerald-100 group-hover:border-emerald-600">
                            <i class="fas fa-arrow-right text-emerald-600 group-hover:text-white transition-colors text-sm"></i>
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
                        <div class="module-card-overlay absolute inset-0 bg-gradient-to-t from-sky-950/90 via-sky-900/45 to-transparent"></div>
                        
                        <!-- Overlay Content -->
                        <div class="absolute bottom-0 left-0 right-0 p-6">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/15">
                                    <i class="fas fa-cow text-white text-xl"></i>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-bold text-white tracking-tight">Dairy Farm</h2>
                                    <p class="text-sky-200 text-sm font-medium">Milk & Cattle Management</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Card Bottom -->
                    <div class="px-6 py-4 flex items-center justify-between bg-white border-t border-stone-100">
                        <div class="flex flex-wrap gap-2">
                            <span class="text-[11px] bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full font-semibold border border-sky-100">Cows</span>
                            <span class="text-[11px] bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full font-semibold border border-sky-100">Milk</span>
                            <span class="text-[11px] bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full font-semibold border border-sky-100">Feed</span>
                        </div>
                        <span class="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center group-hover:bg-sky-600 transition-all duration-300 border border-sky-100 group-hover:border-sky-600">
                            <i class="fas fa-arrow-right text-sky-600 group-hover:text-white transition-colors text-sm"></i>
                        </span>
                    </div>
                </div>
            `);
        }

        mainContent.innerHTML = `
            <div class="min-h-[80vh] flex items-center justify-center py-8 px-4">
                <div class="w-full max-w-5xl">
                    <!-- Header -->
                    <div class="text-center mb-14 animate-fadeInDown">
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl mb-6 shadow-xl shadow-slate-800/20 overflow-hidden">
                            <img src="assets/images/logo.png.jpg" alt="Logo" class="w-12 h-12 object-contain" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\'fas fa-tractor text-white text-3xl\'></i>'">
                        </div>
                        <h1 class="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
                            Welcome, <span class="text-emerald-700">${auth.getCurrentUser().full_name}</span>
                        </h1>
                        <p class="text-lg text-stone-500 max-w-md mx-auto leading-relaxed">Select a farm module below to start managing your operations</p>
                    </div>
                    
                    <!-- Module Cards -->
                    <div class="grid md:grid-cols-2 gap-8 px-0 md:px-4">
                        ${cards.join('')}
                    </div>
                    
                    <!-- Footer Hint -->
                    <p class="text-center text-stone-400 text-sm mt-12 animate-fadeIn" style="animation-delay: 0.3s;">
                        <i class="fas fa-hand-pointer mr-1.5"></i>
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
            card.style.transform = 'scale(0.96)';
            card.style.transition = 'all 0.3s ease';
        });
        
        // Set appropriate background
        if (typeof bgManager !== 'undefined') {
            if (module === 'tea') {
                bgManager.setTeaBackground();
            } else if (module === 'dairy') {
                bgManager.setDairyBackground();
            }
        }
        
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
