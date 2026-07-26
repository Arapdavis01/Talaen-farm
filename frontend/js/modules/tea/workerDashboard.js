// ============================================
// TALAEN FARM - Worker Dashboard
// ============================================

class TeaWorkerDashboard {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        const user = auth.getCurrentUser();
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">👋 Welcome, ${user.full_name}</h1>
                <p class="text-stone-500 text-sm mt-1">Your tea plucking dashboard</p>
            </div>
            <div id="workerDashboardContent">
                <div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading your dashboard...</p></div>
            </div>
        `;

        await TeaWorkerDashboard.loadDashboard();
    }

    static async loadDashboard() {
        try {
            const [statsRes, pluckingRes, debtsRes, paymentRes] = await Promise.all([
                api.get('/tea/worker/dashboard'),
                api.getSelfPlucking(),
                api.getDebts(),
                api.getPaymentHistory()
            ]);

            if (statsRes.success) {
                const s = statsRes.stats;
                const recentPlucking = (pluckingRes.records || []).slice(0, 5);
                const storeDebts = (debtsRes.debts || []).filter(d => !d.is_settled && !d.is_reversed);
                const newStoreDebt = storeDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);
                const lastPayment = (paymentRes.payments || [])[0];

                document.getElementById('workerDashboardContent').innerHTML = `
                    <!-- Stats Cards -->
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                            <p class="text-xs font-medium text-stone-500 uppercase mb-2">Today's Kg</p>
                            <p class="text-2xl font-bold text-emerald-700">${(s.today_kg||0).toFixed(2)}</p>
                        </div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                            <p class="text-xs font-medium text-stone-500 uppercase mb-2">Monthly Kg</p>
                            <p class="text-2xl font-bold text-sky-700">${(s.monthly_kg||0).toFixed(2)}</p>
                        </div>
                        <div class="stat-card bg-white rounded-2xl border ${s.rolled_debt > 0 ? 'border-red-200 bg-red-50/30' : 'border-stone-200'} p-4 shadow-sm">
                            <p class="text-xs font-medium text-stone-500 uppercase mb-2">Rolled Debt ${s.roll_count > 0 ? `(⤵${s.roll_count})` : ''}</p>
                            <p class="text-2xl font-bold ${s.rolled_debt > 0 ? 'text-red-700' : 'text-stone-400'}">KES ${(s.rolled_debt||0).toFixed(2)}</p>
                        </div>
                        <div class="stat-card bg-white rounded-2xl border ${newStoreDebt > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-stone-200'} p-4 shadow-sm">
                            <p class="text-xs font-medium text-stone-500 uppercase mb-2">New Store Debt</p>
                            <p class="text-2xl font-bold ${newStoreDebt > 0 ? 'text-amber-700' : 'text-stone-400'}">KES ${newStoreDebt.toFixed(2)}</p>
                        </div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                            <p class="text-xs font-medium text-stone-500 uppercase mb-2">Last Payment</p>
                            <p class="text-2xl font-bold text-emerald-700">${lastPayment ? 'KES ' + parseFloat(lastPayment.net_pay).toFixed(2) : '—'}</p>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm mb-6">
                        <h3 class="font-semibold text-slate-800 mb-3">Quick Actions</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button onclick="router.navigate('tea-plucking-self')" class="p-3 bg-green-50 hover:bg-green-100 rounded-xl text-sm font-medium text-green-700 border border-green-100 transition-all flex items-center gap-2"><i class="fas fa-leaf"></i> Record Plucking</button>
                            <button onclick="router.navigate('worker-debts')" class="p-3 bg-amber-50 hover:bg-amber-100 rounded-xl text-sm font-medium text-amber-700 border border-amber-100 transition-all flex items-center gap-2"><i class="fas fa-credit-card"></i> My Debts</button>
                            <button onclick="router.navigate('worker-store')" class="p-3 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-medium text-red-700 border border-red-100 transition-all flex items-center gap-2"><i class="fas fa-shopping-basket"></i> Store Purchases</button>
                            <button onclick="router.navigate('worker-payments')" class="p-3 bg-sky-50 hover:bg-sky-100 rounded-xl text-sm font-medium text-sky-700 border border-sky-100 transition-all flex items-center gap-2"><i class="fas fa-money-bill-wave"></i> Payments</button>
                        </div>
                    </div>

                    <!-- Recent Plucking + Debt Summary -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                            <h3 class="font-semibold text-slate-800 mb-3">📋 Recent Plucking</h3>
                            ${recentPlucking.length > 0 ? recentPlucking.map(r => `
                                <div class="flex justify-between py-2 border-b border-stone-100 text-sm">
                                    <span>${new Date(r.plucking_date).toLocaleDateString('en-GB')} - ${r.companies?.name||'N/A'}</span>
                                    <span class="font-semibold text-emerald-700">${r.weight_kg} kg</span>
                                </div>
                            `).join('') : '<p class="text-stone-400 text-sm">No plucking records yet.</p>'}
                        </div>
                        <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                            <h3 class="font-semibold text-slate-800 mb-3">💳 Debt Summary</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between p-3 bg-red-50 rounded-xl"><span class="text-sm">Rolled Debt ${s.roll_count > 0 ? `(Cycle #${s.roll_count})` : ''}</span><span class="font-bold text-red-700">KES ${(s.rolled_debt||0).toFixed(2)}</span></div>
                                <div class="flex justify-between p-3 bg-amber-50 rounded-xl"><span class="text-sm">New Store Debt</span><span class="font-bold text-amber-700">KES ${newStoreDebt.toFixed(2)}</span></div>
                                <div class="flex justify-between p-3 bg-stone-100 rounded-xl"><span class="text-sm font-semibold">Total Debt</span><span class="font-bold text-slate-800">KES ${((s.rolled_debt||0) + newStoreDebt).toFixed(2)}</span></div>
                            </div>
                        </div>
                    </div>`;
            }
        } catch (e) {
            document.getElementById('workerDashboardContent').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-red-500">Failed to load dashboard.</p></div>';
        }
    }
}
