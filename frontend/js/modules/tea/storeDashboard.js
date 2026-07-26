// ============================================
// TALAEN FARM - Store Manager Dashboard
// ============================================

class TeaStoreDashboard {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        const user = auth.getCurrentUser();
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">🏪 Store Dashboard</h1>
                <p class="text-stone-500 text-sm mt-1">Welcome, ${user.full_name} - Store Manager</p>
            </div>
            <div id="storeDashboardContent">
                <div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading dashboard...</p></div>
            </div>
        `;
        await TeaStoreDashboard.load();
    }

    static async load() {
        try {
            const [statsRes, debtsRes] = await Promise.all([
                api.get('/tea/store/dashboard'),
                api.getDebts()
            ]);

            if (statsRes.success) {
                const s = statsRes.stats;
                const allDebts = debtsRes.debts || [];
                const recentAdditions = allDebts.slice(0, 8);
                
                // Top debtors
                const debtorMap = {};
                allDebts.filter(d => !d.is_settled && !d.is_reversed).forEach(d => {
                    const name = d.tea_workers?.full_name || 'Unknown';
                    debtorMap[name] = (debtorMap[name] || 0) + parseFloat(d.amount);
                });
                const topDebtors = Object.entries(debtorMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                document.getElementById('storeDashboardContent').innerHTML = `
                    <!-- Stats -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                            <p class="text-xs font-medium text-stone-500 uppercase mb-2">Total Store Debt</p>
                            <p class="text-2xl font-bold text-red-700">KES ${(s.total_debt||0).toLocaleString('en-KE',{minimumFractionDigits:2})}</p>
                        </div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                            <p class="text-xs font-medium text-stone-500 uppercase mb-2">Active Debtors</p>
                            <p class="text-2xl font-bold text-slate-800">${s.active_debtors||0}</p>
                        </div>
                        <div class="stat-card bg-white rounded-2xl border border-amber-200 p-4 shadow-sm bg-amber-50/30">
                            <p class="text-xs font-medium text-amber-600 uppercase mb-2">Today's Additions</p>
                            <p class="text-2xl font-bold text-amber-700">KES ${(s.today_additions||0).toFixed(2)}</p>
                        </div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                            <p class="text-xs font-medium text-stone-500 uppercase mb-2">This Month</p>
                            <p class="text-2xl font-bold text-sky-700">KES ${(s.month_additions||0).toFixed(2)}</p>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm mb-6">
                        <h3 class="font-semibold text-slate-800 mb-3">Quick Actions</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <button onclick="router.navigate('tea-debts')" class="p-3 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-medium text-red-700 border border-red-100 transition-all flex items-center gap-2"><i class="fas fa-plus-circle"></i> Add Debt</button>
                            <button onclick="router.navigate('store-worker-debts')" class="p-3 bg-amber-50 hover:bg-amber-100 rounded-xl text-sm font-medium text-amber-700 border border-amber-100 transition-all flex items-center gap-2"><i class="fas fa-users"></i> Worker Debts</button>
                            <button onclick="router.navigate('tea-debts')" class="p-3 bg-sky-50 hover:bg-sky-100 rounded-xl text-sm font-medium text-sky-700 border border-sky-100 transition-all flex items-center gap-2"><i class="fas fa-history"></i> Debt History</button>
                        </div>
                    </div>

                    <!-- Recent + Top Debtors -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                            <h3 class="font-semibold text-slate-800 mb-3">📋 Recent Additions</h3>
                            ${recentAdditions.length > 0 ? recentAdditions.map(d => `
                                <div class="flex justify-between py-2 border-b border-stone-100 text-sm">
                                    <span>${d.tea_workers?.full_name||'Unknown'} - ${d.description||'Item'}</span>
                                    <span class="font-semibold text-red-600">KES ${parseFloat(d.amount).toFixed(2)}</span>
                                </div>
                            `).join('') : '<p class="text-stone-400 text-sm">No recent additions.</p>'}
                        </div>
                        <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                            <h3 class="font-semibold text-slate-800 mb-3">🏆 Top Debtors</h3>
                            ${topDebtors.length > 0 ? topDebtors.map(([name, amount], i) => `
                                <div class="flex items-center justify-between py-2 border-b border-stone-100 text-sm">
                                    <div class="flex items-center gap-2">
                                        <span class="w-6 h-6 ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'} rounded-full flex items-center justify-center text-xs font-bold">${i+1}</span>
                                        <span>${name}</span>
                                    </div>
                                    <span class="font-semibold text-red-600">KES ${amount.toFixed(2)}</span>
                                </div>
                            `).join('') : '<p class="text-stone-400 text-sm">No debtors.</p>'}
                        </div>
                    </div>`;
            }
        } catch (e) {
            document.getElementById('storeDashboardContent').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-red-500">Failed to load dashboard.</p></div>';
        }
    }
}
