// ============================================
// TALAEN FARM - Input Cost Tracking
// ============================================

class TeaInputCosts {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6"><h1 class="text-2xl font-bold text-slate-800 tracking-tight">💰 Input Costs</h1><p class="text-stone-500 text-sm mt-1">Track all farm input costs and expenses</p></div>
            <div id="costsContainer"><div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading costs...</p></div></div>
        `;
        await TeaInputCosts.loadCosts();
    }

    static async loadCosts() {
        try {
            const res = await api.getInputCosts();
            if (res.success) {
                document.getElementById('costsContainer').innerHTML = `
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4"><p class="text-xs font-medium text-stone-500 uppercase mb-2">Total Cost</p><p class="text-2xl font-bold text-red-700">KES ${res.total_cost.toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4"><p class="text-xs font-medium text-stone-500 uppercase mb-2">Input Costs</p><p class="text-2xl font-bold text-amber-700">KES ${res.total_input_cost.toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4"><p class="text-xs font-medium text-stone-500 uppercase mb-2">Fertilizer Costs</p><p class="text-2xl font-bold text-sky-700">KES ${res.total_fertilizer_cost.toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
                    </div>
                    <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                        <h3 class="font-semibold text-slate-800 mb-4">Monthly Breakdown</h3>
                        ${(res.monthly_breakdown||[]).map(m => `
                            <div class="flex justify-between py-2 border-b border-stone-100"><span class="text-sm text-stone-600">${m.month}</span><span class="font-semibold text-red-600">KES ${m.cost.toFixed(2)}</span></div>
                        `).join('') || '<p class="text-stone-400">No data</p>'}
                    </div>`;
            }
        } catch (e) { document.getElementById('costsContainer').innerHTML = '<p class="text-red-500 text-center py-8">Failed to load costs.</p>'; }
    }
}
