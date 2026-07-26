// ============================================
// TALAEN FARM - Pay Store (Enhanced)
// ============================================

class TeaPayStore {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Pay Store</h1>
                    <p class="text-stone-500 text-sm mt-1">Settle all outstanding store debts across all workers</p>
                </div>
                <button onclick="TeaPayStore.exportCSV()" class="bg-white border border-stone-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-stone-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm">
                    <i class="fas fa-download"></i> Export
                </button>
            </div>
            
            <!-- Stats Cards -->
            <div id="storeStats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"></div>
            
            <!-- Main Content -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Debt Breakdown -->
                <div class="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                    <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-list text-emerald-500"></i> Breakdown by Worker
                    </h3>
                    <div id="workerBreakdown" class="max-h-96 overflow-y-auto space-y-2">
                        <div class="text-center py-4"><div class="spinner mx-auto"></div></div>
                    </div>
                </div>
                
                <!-- Summary & Pay -->
                <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                    <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-store text-amber-500"></i> Store Payment
                    </h3>
                    <div id="storeSummary">
                        <div class="text-center py-4"><div class="spinner mx-auto"></div></div>
                    </div>
                </div>
            </div>
            
            <!-- Payment History -->
            <div id="storeHistory" class="mt-8"></div>
        `;

        await TeaPayStore.loadAll();
    }

    static async loadAll() {
        try {
            const [debtsRes, workersRes, historyRes] = await Promise.all([
                api.getDebts(),
                api.getTeaWorkers(),
                api.get('/tea/pay-store/history')
            ]);

            if (debtsRes.success) {
                const allDebts = debtsRes.debts;
                const unsettledDebts = allDebts.filter(d => !d.is_settled && !d.is_reversed);
                const totalStoreDebt = unsettledDebts.reduce((s, d) => s + parseFloat(d.amount), 0);
                
                // Group by worker
                const workerDebts = {};
                unsettledDebts.forEach(debt => {
                    const wid = debt.worker_id;
                    if (!workerDebts[wid]) {
                        workerDebts[wid] = { name: debt.tea_workers?.full_name || 'Unknown', total: 0, count: 0 };
                    }
                    workerDebts[wid].total += parseFloat(debt.amount);
                    workerDebts[wid].count += 1;
                });

                // Get worker roll counts
                const workers = workersRes.success ? workersRes.workers : [];
                const workerRollMap = {};
                workers.forEach(w => { workerRollMap[w.id] = { roll_count: w.roll_count || 0, rolled_debt: parseFloat(w.rolled_debt || 0) }; });

                // Stats
                const activeDebtors = Object.keys(workerDebts).length;
                const avgDebt = activeDebtors > 0 ? totalStoreDebt / activeDebtors : 0;
                const history = historyRes.success ? historyRes.payments || [] : [];
                const lastPayment = history.length > 0 ? history[0] : null;
                const settledThisMonth = history.filter(p => {
                    const d = new Date(p.settlement_date);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).reduce((s, p) => s + parseFloat(p.net_pay || 0), 0);

                document.getElementById('storeStats').innerHTML = `
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Store Debt</p><p class="text-2xl font-bold text-red-700">KES ${totalStoreDebt.toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Active Debtors</p><p class="text-2xl font-bold text-slate-800">${activeDebtors}</p></div>
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Avg Debt/Worker</p><p class="text-2xl font-bold text-amber-700">KES ${avgDebt.toLocaleString('en-KE',{minimumFractionDigits:0})}</p></div>
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Settled This Month</p><p class="text-2xl font-bold text-emerald-700">KES ${settledThisMonth.toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>`;

                // Worker breakdown
                const breakdownHtml = Object.entries(workerDebts).map(([wid, data]) => {
                    const roll = workerRollMap[wid] || { roll_count: 0, rolled_debt: 0 };
                    return `
                        <div class="flex items-center justify-between p-3 rounded-xl border ${roll.roll_count >= 3 ? 'border-red-200 bg-red-50/30' : roll.roll_count > 0 ? 'border-amber-200 bg-amber-50/20' : 'border-stone-200'}">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 ${roll.roll_count >= 3 ? 'bg-red-100' : 'bg-stone-100'} rounded-lg flex items-center justify-center">
                                    <span class="text-slate-700 font-bold text-xs">${data.name.charAt(0)}</span>
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-slate-700">${data.name}</p>
                                    <p class="text-xs text-stone-400">${data.count} debt(s)</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="font-semibold text-red-600">KES ${data.total.toFixed(2)}</p>
                                ${roll.roll_count > 0 ? `<p class="text-xs ${roll.roll_count >= 3 ? 'text-red-600 font-bold' : 'text-amber-600'}">Roll #${roll.roll_count} ${roll.roll_count >= 3 ? '⛔' : '⚠️'}</p>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');

                document.getElementById('workerBreakdown').innerHTML = breakdownHtml || '<p class="text-center text-stone-400 py-4">No outstanding debts.</p>';

                // Store Summary
                document.getElementById('storeSummary').innerHTML = `
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 ${totalStoreDebt > 0 ? 'bg-red-100' : 'bg-emerald-100'} rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-store ${totalStoreDebt > 0 ? 'text-red-600' : 'text-emerald-600'} text-2xl"></i>
                        </div>
                        <p class="text-3xl font-bold ${totalStoreDebt > 0 ? 'text-red-600' : 'text-emerald-600'}">KES ${totalStoreDebt.toFixed(2)}</p>
                        <p class="text-xs text-stone-400 mt-1">${activeDebtors} worker(s) with debt</p>
                        ${lastPayment ? `<p class="text-xs text-stone-400 mt-1">Last payment: ${new Date(lastPayment.settlement_date).toLocaleDateString('en-GB')} - KES ${parseFloat(lastPayment.net_pay).toFixed(2)}</p>` : ''}
                    </div>
                    <button onclick="TeaPayStore.processStorePayment()" 
                        class="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        ${totalStoreDebt === 0 ? 'disabled' : ''}>
                        <i class="fas fa-check-circle"></i>
                        ${totalStoreDebt > 0 ? `Pay Store - KES ${totalStoreDebt.toFixed(2)}` : 'All Debts Settled ✅'}
                    </button>`;

                // Payment History
                if (history.length > 0) {
                    document.getElementById('storeHistory').innerHTML = `
                        <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                            <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2"><i class="fas fa-history text-sky-500"></i>Recent Store Payments</h3>
                            <div class="space-y-2 max-h-48 overflow-y-auto">
                                ${history.slice(0, 10).map(p => `
                                    <div class="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                        <div>
                                            <p class="text-sm font-medium text-slate-700">Store Payment</p>
                                            <p class="text-xs text-stone-400">${new Date(p.settlement_date).toLocaleDateString('en-GB')}</p>
                                        </div>
                                        <span class="font-bold text-emerald-700">KES ${parseFloat(p.net_pay).toFixed(2)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>`;
                }
            }
        } catch (error) {
            document.getElementById('workerBreakdown').innerHTML = '<p class="text-red-500 text-center py-4">Failed to load data.</p>';
        }
    }

    static async processStorePayment() {
        try {
            const debtsRes = await api.getDebts();
            const unsettledDebts = debtsRes.debts.filter(d => !d.is_settled && !d.is_reversed);
            const totalStoreDebt = unsettledDebts.reduce((s, d) => s + parseFloat(d.amount), 0);
            const debtorCount = new Set(unsettledDebts.map(d => d.worker_id)).size;

            modal.openConfirm(
                'Pay Store',
                `<div class="text-left">
                    <p class="mb-2">You are about to pay the store manager:</p>
                    <p class="text-2xl font-bold text-emerald-700 text-center mb-3">KES ${totalStoreDebt.toFixed(2)}</p>
                    <p class="text-sm text-stone-500">This will settle <strong>${unsettledDebts.length} debts</strong> across <strong>${debtorCount} workers</strong>.</p>
                    <p class="text-xs text-stone-400 mt-2">Note: This does NOT affect worker rolled debts or roll counts.</p>
                </div>`,
                async () => {
                    try {
                        const response = await api.payStore();
                        if (response.success) {
                            showToast(`Store paid KES ${totalStoreDebt.toFixed(2)}! All debts cleared.`, 'success');
                            await TeaPayStore.loadAll();
                        }
                    } catch (error) { showToast(error.message, 'error'); }
                },
                { confirmText: 'Pay Store', confirmIcon: 'fa-check-circle', confirmClass: 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/20', type: 'info' }
            );
        } catch (e) { showToast('Error calculating total.', 'error'); }
    }

    static exportCSV() {
        api.getDebts().then(res => {
            if (!res.success) return;
            const debts = res.debts.filter(d => !d.is_settled && !d.is_reversed);
            const h = ['Worker','Amount','Date','Description'];
            const rows = debts.map(d => [d.tea_workers?.full_name||'', d.amount, d.debt_date, d.description||'']);
            let csv = h.join(',')+'\n'; rows.forEach(r => { csv += r.map(v => `"${v}"`).join(',')+'\n'; });
            const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`store_debts_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
            showToast(`${debts.length} debts exported!`,'success');
        });
    }
}
