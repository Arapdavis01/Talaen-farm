// ============================================
// TALAEN FARM - Tea Reports (Enhanced)
// ============================================

class TeaReports {
    static currentTab = 'profit';

    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Tea Reports</h1>
                <p class="text-stone-500 text-sm mt-1">Comprehensive analysis and insights</p>
            </div>
            
            <!-- Tabs -->
            <div class="flex flex-wrap gap-2 mb-6 border-b border-stone-200 pb-2">
                <button onclick="TeaReports.switchTab('profit')" id="tabProfit" class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700">💰 Profit</button>
                <button onclick="TeaReports.switchTab('production')" id="tabProduction" class="px-5 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-50">📊 Production</button>
                <button onclick="TeaReports.switchTab('workers')" id="tabWorkers" class="px-5 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-50">👷 Workers</button>
                <button onclick="TeaReports.switchTab('debts')" id="tabDebts" class="px-5 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-50">💳 Debts</button>
                <div class="flex-1"></div>
                <button onclick="TeaReports.printReport()" class="px-4 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm hover:bg-stone-50 flex items-center gap-2"><i class="fas fa-print"></i> Print</button>
                <button onclick="TeaReports.exportCSV()" class="px-4 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm hover:bg-stone-50 flex items-center gap-2"><i class="fas fa-download"></i> Export</button>
            </div>
            
            <!-- Date Filters -->
            <div class="bg-white rounded-2xl border border-stone-200 p-4 mb-6 shadow-sm">
                <div class="flex flex-wrap items-center gap-3">
                    <span class="text-sm font-medium text-stone-600">Period:</span>
                    <input type="date" id="reportDateFrom" onchange="TeaReports.loadCurrentTab()" class="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                    <span class="text-stone-400 text-sm">to</span>
                    <input type="date" id="reportDateTo" onchange="TeaReports.loadCurrentTab()" class="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                    <button onclick="TeaReports.clearDates()" class="px-3 py-2 text-stone-500 hover:text-slate-700 text-sm"><i class="fas fa-times mr-1"></i>Clear</button>
                </div>
            </div>
            
            <!-- Report Content -->
            <div id="reportContent">
                <div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading report...</p></div>
            </div>
        `;

        await TeaReports.loadCurrentTab();
    }

    static async loadCurrentTab() {
        switch (TeaReports.currentTab) {
            case 'profit': await TeaReports.loadProfitReport(); break;
            case 'production': await TeaReports.loadProductionReport(); break;
            case 'workers': await TeaReports.loadWorkerReport(); break;
            case 'debts': await TeaReports.loadDebtReport(); break;
        }
    }

    static switchTab(tab) {
        TeaReports.currentTab = tab;
        ['profit','production','workers','debts'].forEach(t => {
            const el = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`);
            if (el) el.className = t === tab ? 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700' : 'px-5 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-50';
        });
        TeaReports.loadCurrentTab();
    }

    static getDateParams() {
        const p = {};
        const df = document.getElementById('reportDateFrom')?.value;
        const dt = document.getElementById('reportDateTo')?.value;
        if (df) p.start_date = df;
        if (dt) p.end_date = dt;
        return p;
    }

    static clearDates() {
        document.getElementById('reportDateFrom').value = '';
        document.getElementById('reportDateTo').value = '';
        TeaReports.loadCurrentTab();
    }

    // ==================== PROFIT REPORT ====================
    static async loadProfitReport() {
        const container = document.getElementById('reportContent');
        container.innerHTML = '<div class="text-center py-12"><div class="spinner mx-auto"></div></div>';
        try {
            const response = await api.getProfitReport(TeaReports.getDateParams());
            if (response.success) {
                const { report, total_profit, wage_rate_used } = response;
                if (report.length === 0) {
                    container.innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-chart-bar text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No settled plucking data available for reports.</p></div>';
                    return;
                }
                const totalRevenue = report.reduce((s,r) => s + r.revenue, 0);
                const totalLabor = report.reduce((s,r) => s + r.labor_cost, 0);

                container.innerHTML = `
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Revenue</p><p class="text-2xl font-bold text-sky-700">KES ${totalRevenue.toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Labor Cost</p><p class="text-2xl font-bold text-amber-700">KES ${totalLabor.toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/30"><p class="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">Total Profit</p><p class="text-2xl font-bold text-emerald-700">KES ${total_profit.toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Wage Rate</p><p class="text-2xl font-bold text-slate-800">KES ${wage_rate_used.toFixed(2)}/kg</p></div>
                    </div>
                    <h3 class="font-semibold text-slate-800 mb-4">Per Company Breakdown</h3>
                    <div class="space-y-4">
                        ${report.map(c => `
                            <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                                <div class="flex items-center justify-between mb-4">
                                    <h4 class="font-semibold text-slate-800">${c.company}</h4>
                                    <span class="badge bg-stone-50 text-stone-600 border border-stone-200">KES ${parseFloat(c.buying_rate).toFixed(2)}/kg</span>
                                </div>
                                <div class="grid grid-cols-4 gap-3">
                                    <div class="bg-sky-50 rounded-xl p-3 text-center"><p class="text-xs text-sky-600 mb-1">Kg Sold</p><p class="text-lg font-bold text-sky-700">${c.total_kg.toFixed(2)}</p></div>
                                    <div class="bg-green-50 rounded-xl p-3 text-center"><p class="text-xs text-green-600 mb-1">Revenue</p><p class="text-lg font-bold text-green-700">KES ${c.revenue.toFixed(2)}</p></div>
                                    <div class="bg-amber-50 rounded-xl p-3 text-center"><p class="text-xs text-amber-600 mb-1">Labor</p><p class="text-lg font-bold text-amber-700">KES ${c.labor_cost.toFixed(2)}</p></div>
                                    <div class="${c.profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'} rounded-xl p-3 text-center"><p class="text-xs ${c.profit >= 0 ? 'text-emerald-600' : 'text-red-600'} mb-1">Profit</p><p class="text-lg font-bold ${c.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}">KES ${c.profit.toFixed(2)}</p></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>`;
            }
        } catch (e) { container.innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-red-500">Failed to load profit report.</p></div>'; }
    }

    // ==================== PRODUCTION REPORT ====================
    static async loadProductionReport() {
        const container = document.getElementById('reportContent');
        container.innerHTML = '<div class="text-center py-12"><div class="spinner mx-auto"></div></div>';
        try {
            const response = await api.getProductionReport(TeaReports.getDateParams());
            if (response.success) {
                const { total_kg, total_self_kg, total_verified_kg, by_company, by_block, monthly_trend } = response;
                container.innerHTML = `
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Kg (Verified)</p><p class="text-2xl font-bold text-emerald-700">${(total_verified_kg||0).toFixed(2)} kg</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Kg (Self)</p><p class="text-2xl font-bold text-sky-700">${(total_self_kg||0).toFixed(2)} kg</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Records</p><p class="text-2xl font-bold text-slate-800">${(total_kg||0).toFixed(2)} kg</p></div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                            <h4 class="font-semibold text-slate-800 mb-4">By Company</h4>
                            ${by_company?.map(c => `<div class="flex justify-between py-2 border-b border-stone-100"><span class="text-sm text-stone-600">${c.name}</span><span class="font-semibold text-emerald-700">${c.total_kg.toFixed(2)} kg</span></div>`).join('') || '<p class="text-stone-400">No data</p>'}
                        </div>
                        <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                            <h4 class="font-semibold text-slate-800 mb-4">By Block</h4>
                            ${by_block?.map(b => `<div class="flex justify-between py-2 border-b border-stone-100"><span class="text-sm text-stone-600">${b.name}</span><span class="font-semibold text-emerald-700">${b.total_kg.toFixed(2)} kg</span></div>`).join('') || '<p class="text-stone-400">No data</p>'}
                        </div>
                    </div>`;
            }
        } catch (e) { container.innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-red-500">Failed to load production report.</p></div>'; }
    }

    // ==================== WORKER REPORT ====================
    static async loadWorkerReport() {
        const container = document.getElementById('reportContent');
        container.innerHTML = '<div class="text-center py-12"><div class="spinner mx-auto"></div></div>';
        try {
            const response = await api.getWorkerPerformanceReport(TeaReports.getDateParams());
            if (response.success) {
                const { top_workers, total_workers, avg_kg } = response;
                container.innerHTML = `
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Active Workers</p><p class="text-2xl font-bold text-slate-800">${total_workers||0}</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Avg Kg/Worker</p><p class="text-2xl font-bold text-sky-700">${(avg_kg||0).toFixed(2)} kg</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Top Performers</p><p class="text-2xl font-bold text-emerald-700">${(top_workers?.length||0)}</p></div>
                    </div>
                    <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                        <h4 class="font-semibold text-slate-800 mb-4">Top 10 Workers</h4>
                        ${top_workers?.map((w, i) => `
                            <div class="flex items-center justify-between py-2.5 border-b border-stone-100">
                                <div class="flex items-center gap-3">
                                    <span class="w-7 h-7 ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'} rounded-full flex items-center justify-center text-xs font-bold">${i+1}</span>
                                    <span class="text-sm font-medium text-slate-700">${w.full_name}</span>
                                </div>
                                <span class="font-semibold text-emerald-700 text-sm">${w.total_kg.toFixed(2)} kg</span>
                            </div>
                        `).join('') || '<p class="text-stone-400">No data</p>'}
                    </div>`;
            }
        } catch (e) { container.innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-red-500">Failed to load worker report.</p></div>'; }
    }

    // ==================== DEBT REPORT ====================
    static async loadDebtReport() {
        const container = document.getElementById('reportContent');
        container.innerHTML = '<div class="text-center py-12"><div class="spinner mx-auto"></div></div>';
        try {
            const response = await api.getDebtReport();
            if (response.success) {
                const { total_debt, unsettled_debt, settled_debt, debtor_count, by_worker } = response;
                container.innerHTML = `
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Debt</p><p class="text-2xl font-bold text-red-700">KES ${(total_debt||0).toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-amber-200 p-4 shadow-sm bg-amber-50/30"><p class="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">Unsettled</p><p class="text-2xl font-bold text-amber-700">KES ${(unsettled_debt||0).toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/30"><p class="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">Settled</p><p class="text-2xl font-bold text-emerald-700">KES ${(settled_debt||0).toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Debtors</p><p class="text-2xl font-bold text-slate-800">${debtor_count||0}</p></div>
                    </div>
                    <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                        <h4 class="font-semibold text-slate-800 mb-4">Debts by Worker</h4>
                        ${by_worker?.map(w => `<div class="flex justify-between py-2 border-b border-stone-100"><span class="text-sm text-stone-600">${w.full_name}</span><span class="font-semibold text-red-600">KES ${w.total_debt.toFixed(2)}</span></div>`).join('') || '<p class="text-stone-400">No debts</p>'}
                    </div>`;
            }
        } catch (e) { container.innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-red-500">Failed to load debt report.</p></div>'; }
    }

    static printReport() { window.print(); }

    static exportCSV() {
        const container = document.getElementById('reportContent');
        if (!container) return;
        let csv = '';
        const rows = container.querySelectorAll('table tr, .space-y-4 > div');
        if (rows.length > 0) {
            csv = 'Report Export\n';
            rows.forEach(row => { const cells = row.querySelectorAll('td, th, span, p'); if (cells.length > 0) { csv += Array.from(cells).map(c => `"${c.textContent.trim()}"`).join(',') + '\n'; } });
        }
        const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`tea_report_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
        showToast('Report exported!','success');
    }
}
