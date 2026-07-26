// ============================================
// TALAEN FARM - Seasonal Analysis
// ============================================

class TeaSeasonalAnalysis {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6"><h1 class="text-2xl font-bold text-slate-800 tracking-tight">📊 Seasonal Analysis</h1><p class="text-stone-500 text-sm mt-1">Production trends across months and seasons</p></div>
            <div id="seasonalContainer"><div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading analysis...</p></div></div>
        `;
        await TeaSeasonalAnalysis.loadAnalysis();
    }

    static async loadAnalysis() {
        try {
            const res = await api.getSeasonalAnalysis();
            if (res.success) {
                const seasons = res.seasons;
                const monthly = res.monthly || [];
                const byBlock = res.by_block || {};
                const maxKg = Math.max(...monthly.map(m=>m.kg), 1);

                document.getElementById('seasonalContainer').innerHTML = `
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div class="stat-card bg-white rounded-2xl border border-sky-200 p-4 shadow-sm bg-sky-50/30"><p class="text-xs font-medium text-sky-600 uppercase mb-2">Jan-Mar</p><p class="text-2xl font-bold text-sky-700">${(seasons['Jan-Mar']||0).toFixed(0)} kg</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/30"><p class="text-xs font-medium text-emerald-600 uppercase mb-2">Apr-Jun</p><p class="text-2xl font-bold text-emerald-700">${(seasons['Apr-Jun']||0).toFixed(0)} kg</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-amber-200 p-4 shadow-sm bg-amber-50/30"><p class="text-xs font-medium text-amber-600 uppercase mb-2">Jul-Sep</p><p class="text-2xl font-bold text-amber-700">${(seasons['Jul-Sep']||0).toFixed(0)} kg</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-red-200 p-4 shadow-sm bg-red-50/30"><p class="text-xs font-medium text-red-600 uppercase mb-2">Oct-Dec</p><p class="text-2xl font-bold text-red-700">${(seasons['Oct-Dec']||0).toFixed(0)} kg</p></div>
                    </div>
                    
                    <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm mb-6">
                        <h3 class="font-semibold text-slate-800 mb-4">📈 Monthly Production</h3>
                        <div class="space-y-3">
                            ${monthly.map(m => `
                                <div class="flex items-center gap-3">
                                    <span class="text-xs text-stone-500 w-16">${m.month}</span>
                                    <div class="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
                                        <div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-end pr-2" style="width:${(m.kg/maxKg)*100}%">
                                            <span class="text-[10px] text-white font-medium">${m.kg.toFixed(0)} kg</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                        <h3 class="font-semibold text-slate-800 mb-4">📍 By Block</h3>
                        <div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-xs text-stone-500 uppercase"><th class="py-2">Block</th>${monthly.slice(0,6).map(m=>`<th class="py-2 px-2">${m.month}</th>`).join('')}</tr></thead><tbody>${Object.entries(byBlock).map(([block,data]) => `<tr class="border-t border-stone-100"><td class="py-2 font-medium text-slate-700">${block}</td>${monthly.slice(0,6).map(m=>`<td class="py-2 px-2 text-center">${(data[m.month]||0).toFixed(0)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
                    </div>`;
            }
        } catch (e) { document.getElementById('seasonalContainer').innerHTML = '<p class="text-red-500 text-center py-8">Failed to load analysis.</p>'; }
    }
}
