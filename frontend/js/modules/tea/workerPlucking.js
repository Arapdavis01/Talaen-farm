// ============================================
// TALAEN FARM - Worker Plucking History
// ============================================

class TeaWorkerPlucking {
    static allRecords = [];

    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6"><h1 class="text-2xl font-bold text-slate-800 tracking-tight">📋 My Plucking History</h1><p class="text-stone-500 text-sm mt-1">View all your plucking records</p></div>
            <div class="bg-white rounded-2xl border border-stone-200 p-4 mb-4 shadow-sm">
                <div class="flex flex-wrap items-center gap-3">
                    <input type="date" id="wpDateFrom" onchange="TeaWorkerPlucking.filter()" class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                    <span class="text-stone-400 text-sm">to</span>
                    <input type="date" id="wpDateTo" onchange="TeaWorkerPlucking.filter()" class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                    <button onclick="TeaWorkerPlucking.clearFilters()" class="px-3 py-2.5 text-stone-500 hover:text-slate-700 text-sm"><i class="fas fa-times mr-1"></i>Clear</button>
                </div>
            </div>
            <div id="wpRecords"><div class="text-center py-12"><div class="spinner mx-auto"></div></div></div>
        `;
        await TeaWorkerPlucking.loadRecords();
    }

    static async loadRecords() {
        try {
            const res = await api.getSelfPlucking();
            if (res.success) { TeaWorkerPlucking.allRecords = res.records; TeaWorkerPlucking.render(res.records); }
            else { document.getElementById('wpRecords').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-stone-500">No records found.</p></div>'; }
        } catch (e) { document.getElementById('wpRecords').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-red-500">Failed to load.</p></div>'; }
    }

    static render(records) {
        if (records.length === 0) { document.getElementById('wpRecords').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-stone-500">No records.</p></div>'; return; }
        const totalKg = records.reduce((s,r) => s + parseFloat(r.weight_kg), 0);
        const rows = records.map(r => `<tr class="hover:bg-stone-50"><td class="px-4 py-3">${new Date(r.plucking_date).toLocaleDateString('en-GB')}</td><td class="px-4 py-3">${r.companies?.name||'N/A'}</td><td class="px-4 py-3">${r.blocks?.name||'N/A'}</td><td class="px-4 py-3"><span class="font-semibold text-emerald-700">${r.weight_kg} kg</span></td><td class="px-4 py-3">${r.field_grade||'—'}</td></tr>`).join('');
        document.getElementById('wpRecords').innerHTML = `<div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"><div class="overflow-x-auto"><table class="responsive-table w-full"><thead><tr class="bg-stone-50/80 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wider"><th class="px-4 py-3">Date</th><th class="px-4 py-3">Company</th><th class="px-4 py-3">Block</th><th class="px-4 py-3">Weight</th><th class="px-4 py-3">Grade</th></tr></thead><tbody class="divide-y divide-stone-100">${rows}</tbody><tfoot><tr class="bg-emerald-50 font-bold"><td class="px-4 py-3" colspan="3">Total</td><td class="px-4 py-3 text-emerald-700">${totalKg.toFixed(2)} kg</td><td></td></tr></tfoot></table></div></div>`;
    }

    static filter() {
        const df = document.getElementById('wpDateFrom')?.value||'';
        const dt = document.getElementById('wpDateTo')?.value||'';
        let f = [...TeaWorkerPlucking.allRecords];
        if (df) f = f.filter(r => r.plucking_date >= df);
        if (dt) f = f.filter(r => r.plucking_date <= dt);
        TeaWorkerPlucking.render(f);
    }

    static clearFilters() {
        document.getElementById('wpDateFrom').value = '';
        document.getElementById('wpDateTo').value = '';
        TeaWorkerPlucking.render(TeaWorkerPlucking.allRecords);
    }
}
