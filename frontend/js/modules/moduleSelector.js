// ============================================
// TALAEN FARM - Module Selector
// ============================================

class ModuleSelector {
    // Prevents double-tap navigation while the transition plays
    static _isTransitioning = false;

    // ---------- Public: show selector ----------
    static show(availableModules) {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        if (!Array.isArray(availableModules)) {
            availableModules = [];
            console.warn('[ModuleSelector] availableModules is not an array');
        }

        // Background change (guarded)
        if (typeof bgManager !== 'undefined' && typeof bgManager.setModulesBackground === 'function') {
            try { bgManager.setModulesBackground(); } catch (_) {}
        }

        // Reset scroll so the selector always starts at the top
        try { mainContent.scrollTo({ top: 0, behavior: 'instant' }); }
        catch { mainContent.scrollTop = 0; }

        const cards = [];

        if (availableModules.includes('tea')) {
            cards.push(this._cardHtml({
                id: 'tea',
                title: 'Tea Farm',
                subtitle: 'Plucking & Sales Management',
                image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                icon: 'fas fa-leaf',
                accent: 'emerald',
                overlayFrom: 'from-emerald-950/90 via-emerald-900/45',
                tags: ['Plucking', 'Workers', 'Sales'],
                delay: '0s'
            }));
        }

        if (availableModules.includes('dairy')) {
            cards.push(this._cardHtml({
                id: 'dairy',
                title: 'Dairy Farm',
                subtitle: 'Milk & Cattle Management',
                image: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                icon: 'fas fa-cow',
                accent: 'sky',
                overlayFrom: 'from-sky-950/90 via-sky-900/45',
                tags: ['Cows', 'Milk', 'Feed'],
                delay: '0.15s'
            }));
        }

        const user = (typeof auth !== 'undefined' && auth) ? auth.getCurrentUser() : null;
        const displayName = this._getDisplayName(user);
        const greeting = this._getGreeting();

        // Empty state
        if (cards.length === 0) {
            mainContent.innerHTML = `
                <div class="min-h-[70vh] flex items-center justify-center px-6">
                    <div class="text-center max-w-md">
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-stone-100 rounded-2xl mb-6">
                            <i class="fas fa-inbox text-stone-400 text-3xl"></i>
                        </div>
                        <h2 class="text-xl font-bold text-slate-800 mb-2">No modules available</h2>
                        <p class="text-stone-500 text-sm">Contact your administrator to get access to a module.</p>
                    </div>
                </div>
            `;
            document.getElementById('sidebarNav') && (document.getElementById('sidebarNav').innerHTML = '');
            return;
        }

        mainContent.innerHTML = `
            <div class="min-h-[80vh] flex items-center justify-center py-8 px-4">
                <div class="w-full max-w-5xl">
                    <!-- Header with Enlarged Logo -->
                    <div class="text-center mb-14 animate-fadeInDown">
                        <div class="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl mb-6 shadow-xl shadow-slate-800/20 overflow-hidden">
                            <img src="assets/images/logo.png" alt="Talaen Farm Logo" class="w-full h-full object-cover" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-tractor text-white text-4xl\\'></i>'">
                        </div>
                        <h1 class="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
                            ${greeting}, <span class="text-emerald-700">${displayName}</span>
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
                        Tap on a module card to enter the management dashboard
                    </p>
                </div>
            </div>
        `;

        // Clear sidebar
        const sidebarNav = document.getElementById('sidebarNav');
        if (sidebarNav) sidebarNav.innerHTML = '';
    }

    // ---------- Private: build a single card ----------
    static _cardHtml(opts) {
        const tags = (opts.tags || []).map(
            (t) => `<span class="text-[11px] bg-${opts.accent}-50 text-${opts.accent}-700 px-2.5 py-1 rounded-full font-semibold border border-${opts.accent}-100">${t}</span>`
        ).join('');

        return `
            <div class="module-card relative bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer group animate-fadeInUp"
                 role="button" tabindex="0" aria-label="Open ${opts.title}"
                 style="animation-delay: ${opts.delay || '0s'}; touch-action: manipulation;"
                 onclick="ModuleSelector.selectModule('${opts.id}')"
                 onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();ModuleSelector.selectModule('${opts.id}');}">
                <!-- ${opts.title} Image -->
                <div class="relative h-52 overflow-hidden">
                    <img src="${opts.image}"
                         alt="${opts.title}"
                         class="module-card-image w-full h-full object-cover">
                    <div class="module-card-overlay absolute inset-0 bg-gradient-to-t ${opts.overlayFrom} to-transparent"></div>

                    <!-- Overlay Content -->
                    <div class="absolute bottom-0 left-0 right-0 p-6">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/15">
                                <i class="${opts.icon} text-white text-xl"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold text-white tracking-tight">${opts.title}</h2>
                                <p class="text-${opts.accent}-200 text-sm font-medium">${opts.subtitle}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card Bottom -->
                <div class="px-6 py-4 flex items-center justify-between bg-white border-t border-stone-100">
                    <div class="flex flex-wrap gap-2">${tags}</div>
                    <span class="w-10 h-10 bg-${opts.accent}-50 rounded-full flex items-center justify-center group-hover:bg-${opts.accent}-600 transition-all duration-300 border border-${opts.accent}-100 group-hover:border-${opts.accent}-600">
                        <i class="fas fa-arrow-right text-${opts.accent}-600 group-hover:text-white transition-colors text-sm"></i>
                    </span>
                </div>
            </div>
        `;
    }

    // ---------- Public: select a module ----------
    static selectModule(module) {
        if (this._isTransitioning) return;
        if (module !== 'tea' && module !== 'dairy') {
            console.warn('[ModuleSelector] Unknown module:', module);
            return;
        }
        this._isTransitioning = true;

        // Haptic feedback (app only)
        if (window.TALAEN && window.TALAEN.isAndroidApp && navigator.vibrate) {
            try { navigator.vibrate(10); } catch (_) {}
        }

        // Subtle transition
        document.querySelectorAll('.module-card').forEach((card) => {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.96)';
            card.style.transition = 'all 0.3s ease';
        });

        // Background switch (guarded)
        if (typeof bgManager !== 'undefined') {
            try {
                if (module === 'tea' && typeof bgManager.setTeaBackground === 'function') bgManager.setTeaBackground();
                else if (module === 'dairy' && typeof bgManager.setDairyBackground === 'function') bgManager.setDairyBackground();
            } catch (_) {}
        }

        setTimeout(() => {
            try {
                // 1) Router: ensure this module's routes exist & mark it current
                if (typeof router !== 'undefined') {
                    if (typeof router.buildModuleRoutes === 'function') router.buildModuleRoutes(module);
                    if (typeof router.setModule === 'function') router.setModule(module);
                }

                // 2) Sidebar: rebuild for the chosen module (guarded)
                if (typeof sidebar !== 'undefined' && typeof sidebar.build === 'function') {
                    try { sidebar.build(module); }
                    catch (e) { console.error('[ModuleSelector] sidebar.build failed:', e); }
                }

                // 3) Navigate to the correct dashboard for the user's role
                const user = (typeof auth !== 'undefined' && auth) ? auth.getCurrentUser() : null;
                if (!user) {
                    console.warn('[ModuleSelector] No authenticated user; aborting navigation');
                    return;
                }

                let dashboardRoute;
                if (module === 'tea') {
                    if (user.role === 'tea_worker') dashboardRoute = 'worker-dashboard';
                    else if (user.role === 'store_manager') dashboardRoute = 'store-dashboard';
                    else dashboardRoute = 'tea-dashboard';
                } else {
                    dashboardRoute = 'dairy-dashboard';
                }

                const ok = router.navigate(dashboardRoute);
                if (ok === false && typeof showToast === 'function') {
                    showToast('Could not open dashboard. Please try again.', 'error', 4000);
                }
            } finally {
                this._isTransitioning = false;
            }
        }, 300);
    }

    // ---------- Helpers ----------
    static _getDisplayName(user) {
        if (!user) return 'User';
        return user.full_name || user.username || user.name || 'User';
    }

    static _getGreeting() {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    }
}
