// ============================================
// TALAEN FARM - Store Manager Worker Debts
// ============================================

class TeaStoreWorkerDebts {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6"><h1 class="text-2xl font-bold text-slate-800 tracking-tight">👥 Worker Debts</h1><p class="text-stone-500 text-sm mt-1">Overview of all worker store debts</p></div>
            <div id="swdContent"><div class="text-center py-12"><div class="spinner mx-auto"></div></div></div>
        `;
        await TeaStoreWorkerDebts.load();
    }

    static async load() {
        try {
            const [workersRes, debtsRes] = await Promise.all([api.getTeaWorkers(), api.getDebts()]);
            if (workersRes.success && debtsRes.success) {
                const workers = workersRes.workers.filter(w => w.is_active);
                const debts = debtsRes.debts;
                
                const workerDebts = workers.map(w => {
                    const workerDebtList = debts.filter(d => d.worker_id === w.id && !d.is_settled && !d.is_reversed);
                    const totalDebt = workerDebtList.reduce((s, d) => s + parseFloat(d.amount), 0);
                    return { ...w, total_debt: totalDebt, debt_count: workerDebtList.length, debts: workerDebtList };
                }).filter(w => w.total_debt > 0).sort((a, b) => b.total_debt - a.total_debt);

                const totalStoreDebt = workerDebts.reduce((s, w) => s + w.total_debt, 0);

                document.getElementById('swdContent').innerHTML = `
                    <div class="stat-card bg-white rounded-2xl border border-red-200 p-4 shadow-sm bg-red-50/30 mb-6">
                        <p class="text-xs font-medium text-red-600 uppercase mb-2">Total Outstanding</p>
                        <p class="text-3xl font-bold text-red-700">KES ${totalStoreDebt.toLocaleString('en-KE',{minimumFractionDigits:2})}</p>
                        <p class="text-xs text-red-500 mt-1">${workerDebts.length} worker(s) with debt</p>
                    </div>
                    ${workerDebts.length > 0 ? workerDebts.map(w => `
                        <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm mb-3">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><span class="text-red-700 font-bold">${w.full_name.charAt(0)}</span></div>
                                    <div><p class="font-semibold text-slate-800">${w.full_name}</p><p class="text-xs text-stone-400">${w.debt_count} item(s)</p></div>
                                </div>
                                <span class="text-xl font-bold text-red-600">KES ${w.total_debt.toFixed(2)}</span>
                            </div>
                            <div class="space-y-1">
                                ${w.debts.slice(0, 5).map(d => `
                                    <div class="flex justify-between text-sm bg-stone-50 rounded-lg p-2">
                                        <span>${new Date(d.debt_date).toLocaleDateString('en-GB')} - ${d.description||'Item'}</span>
                                        <span class="font-medium text-red-600">KES ${parseFloat(d.amount).toFixed(2)}</span>
                                    </div>
                                `).join('')}
                                ${w.debts.length > 5 ? `<p class="text-xs text-stone-400 text-center">+ ${w.debts.length - 5} more items</p>` : ''}
                            </div>
                        </div>
                    `).join('') : '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-stone-500">All workers have no outstanding debts! 🎉</p></div>'}
                `;
            }
        } catch (e) { document.getElementById('swdContent').innerHTML = '<p class="text-red-500 text-center py-8">Failed to load.</p>'; }
    }
}
