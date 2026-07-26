// ============================================
// TALAEN FARM - Worker Store Purchases
// ============================================

class TeaWorkerStorePurchases {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6"><h1 class="text-2xl font-bold text-slate-800 tracking-tight">🛒 My Store Purchases</h1><p class="text-stone-500 text-sm mt-1">Items taken from the store on debt</p></div>
            <div id="wspContent"><div class="text-center py-12"><div class="spinner mx-auto"></div></div></div>
        `;
        await TeaWorkerStorePurchases.load();
    }

    static async load() {
        try {
            const res = await api.getDebts();
            if (res.success) {
                const debts = res.debts;
                const total = debts.reduce((s,d) => s + parseFloat(d.amount), 0);
                const unsettled = debts.filter(d => !d.is_settled && !d.is_reversed);
                const unsettledTotal = unsettled.reduce((s,d) => s + parseFloat(d.amount), 0);
                const settled = debts.filter(d => d.is_settled);
                const settledTotal = settled.reduce((s,d) => s + parseFloat(d.amount), 0);

                // Group by date
                const grouped = {};
                debts.forEach(d => {
                    const date = d.debt_date;
                    if (!grouped[date]) grouped[date] = [];
                    grouped[date].push(d);
                });

                const groupedHtml = Object.entries(grouped).sort((a,b) => b[0].localeCompare(a[0])).map(([date, items]) => `
                    <div class="mb-4">
                        <h4 class="text-sm font-semibold text-slate-700 mb-2">📅 ${new Date(date).toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'short', year:'numeric'})}</h4>
                        ${items.map(d => `
                            <div class="flex items-center justify-between p-3 rounded-xl border ${d.is_settled ? 'border-emerald-200 bg-emerald-50/30' : d.is_reversed ? 'border-stone-200 bg-stone-50' : 'border-amber-200 bg-amber-50/30'} mb-1">
                                <div class="flex items-center gap-3">
                                    <span class="text-lg">${d.description?.includes('oil')||d.description?.includes('Oil')?'🍳':d.description?.includes('soap')||d.description?.includes('Soap')?'🧼':d.description?.includes('flour')||d.description?.includes('Flour')?'🌽':d.description?.includes('rice')||d.description?.includes('Rice')?'🍚':'📦'}</span>
                                    <div><p class="text-sm font-medium text-slate-700">${d.description||'Item'}</p><p class="text-xs text-stone-400">KES ${parseFloat(d.amount).toFixed(2)}</p></div>
                                </div>
                                <span class="badge ${d.is_settled?'bg-emerald-50 text-emerald-700 border-emerald-200':d.is_reversed?'bg-stone-50 text-stone-500 border-stone-200':'bg-amber-50 text-amber-700 border-amber-200'}">${d.is_settled?'Settled':d.is_reversed?'Reversed':'Unsettled'}</span>
                            </div>
                        `).join('')}
                    </div>
                `).join('');

                document.getElementById('wspContent').innerHTML = `
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4"><p class="text-xs font-medium text-stone-500 uppercase mb-2">Total</p><p class="text-2xl font-bold text-slate-800">KES ${total.toFixed(2)}</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-amber-200 p-4 bg-amber-50/30"><p class="text-xs font-medium text-amber-600 uppercase mb-2">Unsettled</p><p class="text-2xl font-bold text-amber-700">KES ${unsettledTotal.toFixed(2)}</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-emerald-200 p-4 bg-emerald-50/30"><p class="text-xs font-medium text-emerald-600 uppercase mb-2">Settled</p><p class="text-2xl font-bold text-emerald-700">KES ${settledTotal.toFixed(2)}</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4"><p class="text-xs font-medium text-stone-500 uppercase mb-2">Items</p><p class="text-2xl font-bold text-slate-800">${unsettled.length}</p></div>
                    </div>
                    <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">${groupedHtml || '<p class="text-stone-400 text-center">No purchases.</p>'}</div>`;
            }
        } catch (e) { document.getElementById('wspContent').innerHTML = '<p class="text-red-500 text-center py-8">Failed to load.</p>'; }
    }
}
