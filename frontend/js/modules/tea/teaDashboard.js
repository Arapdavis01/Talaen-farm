// ============================================
// TALAEN FARM - Tea Dashboard (Full Overview)
// ============================================

class TeaDashboard {

    // ---------- Helpers ----------
    static _num(v, fallback = 0) {
        if (v == null || v === '') return fallback;
        const n = Number(v);
        return isNaN(n) ? fallback : n;
    }

    static _fmt(v, decimals = 2) {
        return this._num(v).toFixed(decimals);
    }

    static _fmtKES(v) {
        return this._num(v).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // ---------- Show ----------
    static async show() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

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
            if (response && response.success && response.dashboard) {
                TeaDashboard.renderDashboard(response.dashboard);
            } else {
                TeaDashboard._renderError((response && response.message) || 'No dashboard data returned');
            }
        } catch (error) {
            console.error('[TeaDashboard] Load failed:', error);
            TeaDashboard._renderError(error.message);
        }
    }

    // ---------- Error state ----------
    static _renderError(message) {
        const container = document.getElementById('dashboardContent');
        if (!container) return;
        container.innerHTML = `
            <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-circle text-red-500 text-2xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-slate-800 mb-2">Failed to Load Dashboard</h3>
                <p class="text-stone-500 mb-1">Unable to fetch dashboard data. Please try again.</p>
                ${message ? `<p class="text-xs text-stone-400 mb-4">${TeaDashboard._escape(message)}</p>` : '<div class="mb-4"></div>'}
                <button onclick="TeaDashboard._retry(this)"
                    class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium inline-flex items-center gap-2">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }

    static _escape(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    static async _retry(btn) {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        }
        if (window.TALAEN && window.TALAEN.isAndroidApp && navigator.vibrate) {
            try { navigator.vibrate(10); } catch (_) {}
        }
        await TeaDashboard.show();
    }

    // ---------- Render ----------
    static renderDashboard(data) {
        const container = document.getElementById('dashboardContent');
        if (!container) return;

        // Null-safe extraction
        const worker_count           = this._num(data.worker_count);
        const today_kg               = this._num(data.today_kg);
        const monthly_kg             = this._num(data.monthly_kg);
        const outstanding_debt       = this._num(data.outstanding_debt);
        const total_store_debt       = this._num(data.total_store_debt);
        const company_count          = this._num(data.company_count);
        const wage_rate              = (data.wage_rate == null || data.wage_rate === '')
                                        ? null
                                        : this._num(data.wage_rate);
        const unpaid_workers_count   = this._num(data.unpaid_workers_count);
        const week_kg                = this._num(data.week_kg);
        const match_percentage       = this._num(data.match_percentage);
        const pending_payments       = this._num(data.pending_payments);

        // Which quick actions apply?
        const user = (typeof auth !== 'undefined' && auth) ? auth.getCurrentUser() : null;
        const isAdmin = !!(user && (user.role === 'farm_owner' || user.role === 'supervisor'));

        const quickActions = [
            {
                show: true,
                route: 'tea-plucking-self',
                icon: 'fa-leaf',
                color: 'green',
                title: 'Record Self Plucking',
                subtitle: 'Record plucking for workers'
            },
            {
                show: isAdmin,
                route: 'tea-plucking-verified',
                icon: 'fa-check-double',
                color: 'emerald',
                title: 'Record Verified Plucking',
                subtitle: 'Verify & approve plucking'
            },
            {
                show: isAdmin,
                route: 'tea-comparison',
                icon: 'fa-scale-balanced',
                color: 'purple',
                title: 'Comparison Panel',
                subtitle: 'Resolve disputed records'
            },
            {
                show: isAdmin,
                route: 'tea-debts',
                icon: 'fa-credit-card',
                color: 'red',
                title: 'Store Debts',
                subtitle: 'Manage worker store debts'
            },
            {
                show: isAdmin,
                route: 'tea-pay-worker',
                icon: 'fa-hand-holding-dollar',
                color: 'amber',
                title: 'Pay Workers',
                subtitle: 'Calculate & process payments'
            },
            {
                show: isAdmin,
                route: 'tea-pay-store',
                icon: 'fa-shop',
                color: 'orange',
                title: 'Pay Store',
                subtitle: 'Settle all store debts'
            }
        ].filter((a) => a.show);

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
                    value: this._fmt(today_kg, 2),
                    suffix: 'kg'
                })}
                ${TeaDashboard.statCard({
                    icon: 'fa-calendar-check',
                    iconBg: 'bg-sky-50',
                    iconColor: 'text-sky-600',
                    label: 'This Month',
                    value: this._fmt(monthly_kg, 2),
                    suffix: 'kg'
                })}
                ${TeaDashboard.statCard({
                    icon: 'fa-credit-card',
                    iconBg: 'bg-amber-50',
                    iconColor: 'text-amber-600',
                    label: 'Outstanding Debt',
                    value: this._fmtKES(outstanding_debt),
                    suffix: 'KES',
                    prefix: true
                })}
                ${TeaDashboard.statCard({
                    icon: 'fa-shop',
                    iconBg: 'bg-red-50',
                    iconColor: 'text-red-600',
                    label: 'Total Store Debt',
                    value: this._fmtKES(total_store_debt),
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
                    value: wage_rate != null ? wage_rate.toFixed(2) : '—',
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
                    <div class="space-y-2">
                        ${quickActions.map((a) => TeaDashboard._actionBtn(a)).join('')}
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
                                <p class="text-2xl font-bold text-emerald-700">${this._fmt(today_kg, 2)} <span class="text-sm font-normal text-stone-500">kg</span></p>
                            </div>
                        </div>

                        <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                            <div class="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i class="fas fa-calendar-week text-sky-600 text-sm"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-slate-700">This Week's Total</p>
                                <p class="text-2xl font-bold text-sky-700">${this._fmt(week_kg, 2)} <span class="text-sm font-normal text-stone-500">kg</span></p>
                            </div>
                        </div>

                        <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i class="fas fa-balance-scale text-purple-600 text-sm"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-slate-700">Self vs Verified Match</p>
                                <p class="text-2xl font-bold text-purple-700">${this._fmt(match_percentage, 1)}%</p>
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

    // ---------- Quick action button ----------
    static _actionBtn({ route, icon, color, title, subtitle }) {
        return `
            <button onclick="router.navigate('${route}')"
                class="w-full flex items-center justify-between p-3.5 bg-${color}-50 hover:bg-${color}-100 rounded-xl transition-all group border border-${color}-100">
                <div class="flex items-center gap-3">
                    <span class="w-9 h-9 bg-${color}-500 rounded-lg flex items-center justify-center">
                        <i class="fas ${icon} text-white text-sm"></i>
                    </span>
                    <div class="text-left">
                        <span class="font-medium text-${color}-800 text-sm">${title}</span>
                        <p class="text-[10px] text-${color}-500">${subtitle}</p>
                    </div>
                </div>
                <i class="fas fa-arrow-right text-${color}-400 group-hover:translate-x-1 transition-transform"></i>
            </button>
        `;
    }

    // ---------- Stat card (small) ----------
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

    // ---------- Stat card (wide) ----------
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
