// ============================================
// TALAEN FARM - Tea Dashboard (Full Overview)
// ============================================

class TeaDashboard {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Tea Farm Dashboard</h1>
                <p class="text-stone-500 text-sm mt-1">Complete overview of tea farm operations</p>
            </div>
            
            <!-- Loading State -->
            <div id="dashboardContent" class="space-y-6">
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    ${Array(5).fill(`
                        <div class="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse">
                            <div class="shimmer shimmer-title mb-2"></div>
                            <div class="shimmer shimmer-text w-3/4"></div>
                        </div>
                    `).join('')}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    ${Array(3).fill(`
                        <div class="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse">
                            <div class="shimmer shimmer-title mb-2"></div>
                            <div class="shimmer shimmer-text w-2/3"></div>
                        </div>
                    `).join('')}
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white rounded-2xl border border-stone-200 p-6 animate-pulse">
                        <div class="shimmer shimmer-title w-1/3 mb-4"></div>
                        ${Array(4).fill('<div class="shimmer shimmer-text mb-3"></div>').join('')}
                    </div>
                    <div class="bg-white rounded-2xl border border-stone-200 p-6 animate-pulse">
                        <div class="shimmer shimmer-title w-1/3 mb-4"></div>
                        ${Array(3).fill('<div class="shimmer shimmer-text mb-3"></div>').join('')}
                    </div>
                </div>
            </div>
        `;

        try {
            const response = await api.getTeaDashboard();
            if (response.success) {
                TeaDashboard.renderDashboard(response.dashboard);
            }
        } catch (error) {
            const container = document.getElementById('dashboardContent');
            if (!container) return;
            container.innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-circle text-red-500 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-slate-800 mb-2">Failed to Load Dashboard</h3>
                    <p class="text-stone-500 mb-4">Unable to fetch dashboard data. Please try again.</p>
                    <button onclick="TeaDashboard.show()" class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium">
                        <i class="fas fa-refresh mr-2"></i>Retry
                    </button>
                </div>
            `;
        }
    }

    static renderDashboard(data) {
        const container = document.getElementById('dashboardContent');
        if (!container) return;

        const {
            worker_count,
            today_kg,
            monthly_kg,
            outstanding_debt,
            total_store_debt,
            company_count,
            wage_rate,
            unpaid_workers_count,
            week_kg,
            match_percentage,
            pending_payments
        } = data;

        container.innerHTML = `
            <!-- Top Stats Row -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                ${TeaDashboard.statCard({
                    icon: 'fa-users',
                    iconBg: 'bg-emerald-50',
                    iconColor: 'text-emerald-600',
                    label: 'Active Workers',
                    value: worker_count,
                    suffix: ''
                })}
                ${TeaDashboard.statCard({
                    icon: 'fa-leaf',
                    iconBg: 'bg-green-50',
                    iconColor: 'text-green-600',
                    label: "Today's Plucking",
                    value: today_kg.toFixed(2),
                    suffix: 'kg'
                })}
                ${TeaDashboard.statCard({
                    icon: 'fa-calendar-check',
                    iconBg: 'bg-sky-50',
                    iconColor: 'text-sky-600',
                    label: 'This Month',
                    value: monthly_kg.toFixed(2),
                    suffix: 'kg'
                })}
                ${TeaDashboard.statCard({
                    icon: 'fa-credit-card',
                    iconBg: 'bg-amber-50',
                    iconColor: 'text-amber-600',
                    label: 'Outstanding Debt',
                    value: outstanding_debt.toLocaleString('en-KE', { minimumFractionDigits: 2 }),
                    suffix: 'KES',
                    prefix: true
                })}
                ${TeaDashboard.statCard({
                    icon: 'fa-shop',
                    iconBg: 'bg-red-50',
                    iconColor: 'text-red-600',
                    label: 'Total Store Debt',
                    value: total_store_debt.toLocaleString('en-KE', { minimumFractionDigits: 2 }),
                    suffix: 'KES',
                    prefix: true
                })}
            </div>

            <!-- Second Stats Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                ${TeaDashboard.statCardWide({
                    icon: 'fa-building',
                    iconBg: 'bg-indigo-50',
                    iconColor: 'text-indigo-600',
                    label: 'Active Companies',
                    value: company_count,
                    subtitle: 'Tea buying companies'
                })}
                ${TeaDashboard.statCardWide({
                    icon: 'fa-coins',
                    iconBg: 'bg-emerald-50',
                    iconColor: 'text-emerald-600',
                    label: 'Current Wage Rate',
                    value: wage_rate ? parseFloat(wage_rate).toFixed(2) : '—',
                    suffix: 'KES/kg',
                    subtitle: 'Active rate per kilogram'
                })}
                ${TeaDashboard.statCardWide({
                    icon: 'fa-user-clock',
                    iconBg: 'bg-orange-50',
                    iconColor: 'text-orange-600',
                    label: 'Unpaid Workers',
                    value: unpaid_workers_count,
                    subtitle: 'Ready for payment',
                    highlight: unpaid_workers_count > 0
                })}
            </div>

            <!-- Bottom Section: Quick Actions + Recent Activity -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Quick Actions -->
                <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                    <div class="flex items-center gap-3 mb-5">
                        <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <i class="fas fa-bolt text-emerald-600"></i>
                        </div>
                        <h3 class="font-bold text-slate-800">Quick Actions</h3>
                    </div>
                    <div class="space-y-3">
                        <button onclick="router.navigate('tea-plucking-verified')" 
                            class="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all group border border-emerald-100">
                            <div class="flex items-center gap-3">
                                <span class="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-check-double text-white text-sm"></i>
                                </span>
                                <span class="font-medium text-emerald-800 text-sm">Record Verified Plucking</span>
                            </div>
                            <i class="fas fa-arrow-right text-emerald-400 group-hover:translate-x-1 transition-transform"></i>
                        </button>
                        
                        <button onclick="router.navigate('tea-pay-worker')" 
                            class="w-full flex items-center justify-between p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all group border border-amber-100">
                            <div class="flex items-center gap-3">
                                <span class="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-hand-holding-dollar text-white text-sm"></i>
                                </span>
                                <span class="font-medium text-amber-800 text-sm">Pay Workers</span>
                            </div>
                            <i class="fas fa-arrow-right text-amber-400 group-hover:translate-x-1 transition-transform"></i>
                        </button>
                        
                        <button onclick="router.navigate('tea-reports')" 
                            class="w-full flex items-center justify-between p-4 bg-sky-50 hover:bg-sky-100 rounded-xl transition-all group border border-sky-100">
                            <div class="flex items-center gap-3">
                                <span class="w-9 h-9 bg-sky-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-chart-bar text-white text-sm"></i>
                                </span>
                                <span class="font-medium text-sky-800 text-sm">View Reports</span>
                            </div>
                            <i class="fas fa-arrow-right text-sky-400 group-hover:translate-x-1 transition-transform"></i>
                        </button>
                        
                        <button onclick="router.navigate('tea-plucking-self')" 
                            class="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-all group border border-green-100">
                            <div class="flex items-center gap-3">
                                <span class="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-leaf text-white text-sm"></i>
                                </span>
                                <span class="font-medium text-green-800 text-sm">Record Self Plucking</span>
                            </div>
                            <i class="fas fa-arrow-right text-green-400 group-hover:translate-x-1 transition-transform"></i>
                        </button>
                    </div>
                </div>

                <!-- Recent Activity Summary -->
                <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                    <div class="flex items-center gap-3 mb-5">
                        <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                            <i class="fas fa-clock-rotate-left text-slate-600"></i>
                        </div>
                        <h3 class="font-bold text-slate-800">Recent Activity</h3>
                    </div>
                    <div class="space-y-4">
                        <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                            <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i class="fas fa-check-circle text-emerald-600 text-sm"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-slate-700">Today's Verified Plucking</p>
                                <p class="text-2xl font-bold text-emerald-700">${today_kg.toFixed(2)} <span class="text-sm font-normal text-stone-500">kg</span></p>
                            </div>
                        </div>
                        
                        <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                            <div class="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i class="fas fa-calendar-week text-sky-600 text-sm"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-slate-700">This Week's Total</p>
                                <p class="text-2xl font-bold text-sky-700">${week_kg.toFixed(2)} <span class="text-sm font-normal text-stone-500">kg</span></p>
                            </div>
                        </div>
                        
                        <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i class="fas fa-balance-scale text-purple-600 text-sm"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-slate-700">Self vs Verified Match</p>
                                <p class="text-2xl font-bold text-purple-700">${match_percentage}%</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                            <div class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i class="fas fa-exclamation-triangle text-amber-600 text-sm"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-slate-700">Pending Payments</p>
                                <p class="text-2xl font-bold text-amber-700">${pending_payments} <span class="text-sm font-normal text-stone-500">workers</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static statCard({ icon, iconBg, iconColor, label, value, suffix, prefix }) {
        return `
            <div class="stat-card bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 transition-all">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0">
                        <i class="fas ${icon} ${iconColor} text-sm"></i>
                    </div>
                    <p class="text-xs font-medium text-stone-500 uppercase tracking-wider">${label}</p>
                </div>
                <p class="text-2xl font-bold text-slate-800 tracking-tight">
                    ${prefix ? 'KES ' : ''}${value}<span class="text-sm font-normal text-stone-400 ml-1">${suffix}</span>
                </p>
            </div>
        `;
    }

    static statCardWide({ icon, iconBg, iconColor, label, value, suffix, subtitle, highlight }) {
        return `
            <div class="stat-card bg-white rounded-2xl border ${highlight ? 'border-amber-300 bg-amber-50/30' : 'border-stone-200'} p-5 shadow-sm hover:border-emerald-300 transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0">
                        <i class="fas ${icon} ${iconColor}"></i>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-stone-500 uppercase tracking-wider">${label}</p>
                        <p class="text-xl font-bold text-slate-800">
                            ${value}<span class="text-sm font-normal text-stone-400 ml-1">${suffix || ''}</span>
                        </p>
                        <p class="text-xs text-stone-400 mt-0.5">${subtitle}</p>
                    </div>
                </div>
            </div>
        `;
    }
}
