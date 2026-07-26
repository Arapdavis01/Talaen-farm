// ============================================
// TALAEN FARM - Worker Debts (Rolled + Store)
// ============================================

class TeaWorkerDebts {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6"><h1 class="text-2xl font-bold text-slate-800 tracking-tight">💳 My Debts</h1><p class="text-stone-500 text-sm mt-1">Rolled debt from previous payments + new store debt</p></div>
            <div id="wdContent"><div class="text-center py-12"><div class="spinner mx-auto"></div></div></div>
        `;
        await TeaWorkerDebts.load();
    }

    static async load() {
        try {
            const [workerRes, debtsRes] = await Promise.all([api.get('/tea/worker/dashboard'), api.getDebts()]);
            if (workerRes.success) {
                const s = workerRes.stats;
                const allDebts = debtsRes.debts || [];
                const storeDebts = allDebts.filter(d => !d.is_settled && !d.is_reversed);
                const newStoreDebt = storeDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);
                const rolledDebt = s.rolled_debt || 0;
                const totalDebt = rolledDebt + newStoreDebt;

                document.getElementById('wdContent').innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="stat-card bg-white rounded-2xl border border-red-200 p-4 shadow-sm bg-red-50/30"><p class="text-xs font-medium text-red-600 uppercase mb-2">Rolled Debt ${s.roll_count > 0 ? `(Cycle #${s.roll_count})` : ''}</p><p class="text-2xl font-bold text-red-700">KES ${rolledDebt.toFixed(2)}</p><p class="text-xs text-red-500 mt-1">From previous unpaid cycles</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-amber-200 p-4 shadow-sm bg-amber-50/30"><p class="text-xs font-medium text-amber-600 uppercase mb-2">New Store Debt</p><p class="text-2xl font-bold text-amber-700">KES ${newStoreDebt.toFixed(2)}</p><p class="text-xs text-amber-500 mt-1">${storeDebts.length} item(s) from store</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase mb-2">Total Debt</p><p class="text-2xl font-bold text-slate-800">KES ${totalDebt.toFixed(2)}</p></div>
                    </div>
                    ${storeDebts.length > 0 ? `
                        <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                            <h3 class="font-semibold text-slate-800 mb-3">📋 Store Debt Items</h3>
                            ${storeDebts.map(d => `<div class="flex justify-between py-2 border-b border-stone-100 text-sm"><span>${new Date(d.debt_date).toLocaleDateString('en-GB')} - ${d.description||'Item'}</span><span class="font-semibold text-red-600">KES ${parseFloat(d.amount).toFixed(2)}</span></div>`).join('')}
                        </div>
                    ` : '<p class="text-stone-400 text-center">No store debt items.</p>'}
                `;
            }
        } catch (e) { document.getElementById('wdContent').innerHTML = '<p class="text-red-500 text-center py-8">Failed to load.</p>'; }
    }
}
