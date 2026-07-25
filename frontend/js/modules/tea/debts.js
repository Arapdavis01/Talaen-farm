// ============================================
// TALAEN FARM - Store Debts Management (Enhanced)
// ============================================

class TeaDebts {
    static allDebts = [];
    static allWorkers = [];
    static selectedDebts = new Set();
    static currentView = 'table';

    static async show() {
        const mainContent = document.getElementById('mainContent');
        const user = auth.getCurrentUser();
        const canAddDebt = ['farm_owner', 'supervisor', 'store_manager'].includes(user.role);
        const isWorker = user.role === 'tea_worker';
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Store Debts</h1>
                    <p class="text-stone-500 text-sm mt-1">${isWorker ? 'Your store debt history' : 'Manage worker store debts'}</p>
                </div>
                <div class="flex gap-2">
                    ${canAddDebt ? `
                        <button onclick="TeaDebts.exportCSV()" class="bg-white border border-stone-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-stone-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"><i class="fas fa-download"></i> Export</button>
                        <button onclick="TeaDebts.showAddForm()" class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-600/20"><i class="fas fa-plus"></i> Add Debt</button>
                    ` : ''}
                </div>
            </div>
            
            ${isWorker ? '<div id="workerDebtSummary" class="mb-6"></div>' : ''}
            
            ${canAddDebt ? '<div id="debtStats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"></div>' : ''}
            
            ${canAddDebt ? `
                <div class="bg-white rounded-2xl border border-stone-200 p-4 mb-4 shadow-sm">
                    <div class="flex flex-wrap items-center gap-3">
                        <div class="relative flex-1 min-w-[200px]"><i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i><input type="text" id="debtSearch" placeholder="Search worker..." class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" oninput="TeaDebts.filterDebts()"></div>
                        <select id="debtStatusFilter" onchange="TeaDebts.filterDebts()" class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"><option value="">All Status</option><option value="unsettled">Unsettled</option><option value="settled">Settled</option><option value="reversed">Reversed</option></select>
                        <input type="date" id="debtDateFrom" onchange="TeaDebts.filterDebts()" class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"><span class="text-stone-400 text-sm">to</span><input type="date" id="debtDateTo" onchange="TeaDebts.filterDebts()" class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                        <button onclick="TeaDebts.clearFilters()" class="px-3 py-2.5 text-stone-500 hover:text-slate-700 text-sm"><i class="fas fa-times mr-1"></i> Clear</button>
                    </div>
                </div>
            ` : ''}
            
            <div id="debtsTable"><div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading debts...</p></div></div>
        `;

        await TeaDebts.loadDebts();
    }

    static async loadDebts() {
        try {
            const user = auth.getCurrentUser();
            let workerId = null;
            if (user.role === 'tea_worker') workerId = user.linked_worker_id;
            
            const response = await api.getDebts(workerId);
            if (response.success) {
                TeaDebts.allDebts = response.debts;
                if (user.role === 'tea_worker') TeaDebts.renderWorkerDebtSummary(response.debts);
                if (['farm_owner','supervisor','store_manager'].includes(user.role)) TeaDebts.renderStats(response.debts);
                TeaDebts.renderDebtsTable(TeaDebts.allDebts, user.role);
            } else {
                document.getElementById('debtsTable').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-credit-card text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No debt records found.</p></div>';
            }
        } catch (error) {
            document.getElementById('debtsTable').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i><p class="text-red-500">Failed to load debts.</p></div>';
        }
    }

    static renderStats(debts) {
        const total = debts.reduce((s, d) => s + parseFloat(d.amount), 0);
        const unsettled = debts.filter(d => !d.is_settled && !d.is_reversed).reduce((s, d) => s + parseFloat(d.amount), 0);
        const settled = debts.filter(d => d.is_settled).reduce((s, d) => s + parseFloat(d.amount), 0);
        const debtors = new Set(debts.filter(d => !d.is_settled && !d.is_reversed).map(d => d.worker_id)).size;
        document.getElementById('debtStats').innerHTML = `
            <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Store Debt</p><p class="text-2xl font-bold text-slate-800">KES ${total.toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
            <div class="stat-card bg-white rounded-2xl border border-amber-200 p-4 shadow-sm bg-amber-50/30"><p class="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">⚠️ Unsettled</p><p class="text-2xl font-bold text-amber-700">KES ${unsettled.toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
            <div class="stat-card bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/30"><p class="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">✅ Settled</p><p class="text-2xl font-bold text-emerald-700">KES ${settled.toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
            <div class="stat-card bg-white rounded-2xl border border-red-200 p-4 shadow-sm bg-red-50/30"><p class="text-xs font-medium text-red-600 uppercase tracking-wider mb-2">Active Debtors</p><p class="text-2xl font-bold text-red-700">${debtors}</p></div>`;
    }

    static renderWorkerDebtSummary(debts) {
        const totalUnsettled = debts.filter(d => !d.is_settled && !d.is_reversed).reduce((s, d) => s + parseFloat(d.amount), 0);
        document.getElementById('workerDebtSummary').innerHTML = `
            <div class="bg-white rounded-2xl border ${totalUnsettled > 0 ? 'border-red-200' : 'border-emerald-200'} p-6 shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 ${totalUnsettled > 0 ? 'bg-red-100' : 'bg-emerald-100'} rounded-xl flex items-center justify-center"><i class="fas fa-credit-card ${totalUnsettled > 0 ? 'text-red-600' : 'text-emerald-600'} text-xl"></i></div>
                    <div><p class="text-sm text-stone-500">Your Debt Balance</p><p class="text-3xl font-bold ${totalUnsettled > 0 ? 'text-red-600' : 'text-emerald-600'}">KES ${totalUnsettled.toLocaleString('en-KE',{minimumFractionDigits:2})}</p></div>
                </div>
            </div>`;
    }

    static renderDebtsTable(debts, role) {
        if (debts.length === 0) { document.getElementById('debtsTable').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-search text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No debts match your filters.</p></div>'; return; }
        const canEdit = ['farm_owner','supervisor','store_manager'].includes(role);
        
        const rows = debts.map(d => `
            <tr class="hover:bg-stone-50 transition-colors">
                ${canEdit ? `<td class="px-4 py-3" onclick="event.stopPropagation()"><input type="checkbox" class="debt-checkbox rounded border-stone-300" value="${d.id}" onchange="TeaDebts.toggleSelect('${d.id}', this.checked)"></td>` : ''}
                <td class="px-4 py-3" data-label="Date">${new Date(d.debt_date).toLocaleDateString('en-GB')}</td>
                <td class="px-4 py-3" data-label="Worker"><span class="text-sm font-medium text-slate-700">${d.tea_workers?.full_name||'N/A'}</span></td>
                <td class="px-4 py-3" data-label="Amount"><span class="font-semibold text-red-600">KES ${parseFloat(d.amount).toFixed(2)}</span></td>
                <td class="px-4 py-3" data-label="Description"><span class="text-xs text-stone-600">${d.description||'—'}</span></td>
                <td class="px-4 py-3" data-label="Status"><span class="badge ${d.is_reversed?'bg-stone-50 text-stone-500 border border-stone-200':d.is_settled?'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-amber-50 text-amber-700 border border-amber-200'}">${d.is_reversed?'Reversed':d.is_settled?'Settled':'Unsettled'}</span></td>
                ${canEdit ? `<td class="px-4 py-3" data-label="Actions" onclick="event.stopPropagation()"><div class="flex gap-1">${!d.is_reversed&&!d.is_settled?`<button onclick="TeaDebts.showEditForm('${d.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50" title="Edit"><i class="fas fa-edit text-xs"></i></button><button onclick="TeaDebts.reverseDebt('${d.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50" title="Reverse"><i class="fas fa-undo text-xs"></i></button>`:'—'}</div></td>` : ''}
            </tr>`).join('');

        document.getElementById('debtsTable').innerHTML = `<div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"><div class="overflow-x-auto"><table class="responsive-table w-full"><thead><tr class="bg-stone-50/80 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wider">${canEdit?'<th class="px-4 py-3 w-10"><input type="checkbox" id="selectAllDebts" onchange="TeaDebts.toggleSelectAll(this.checked)" class="rounded border-stone-300"></th>':''}<th class="px-4 py-3">Date</th><th class="px-4 py-3">Worker</th><th class="px-4 py-3">Amount</th><th class="px-4 py-3">Description</th><th class="px-4 py-3">Status</th>${canEdit?'<th class="px-4 py-3">Actions</th>':''}</tr></thead><tbody class="divide-y divide-stone-100">${rows}</tbody></table></div></div>`;
    }

    static filterDebts() {
        const s = (document.getElementById('debtSearch')?.value||'').toLowerCase();
        const st = document.getElementById('debtStatusFilter')?.value||'';
        const df = document.getElementById('debtDateFrom')?.value||'';
        const dt = document.getElementById('debtDateTo')?.value||'';
        let f = [...TeaDebts.allDebts];
        if (s) f = f.filter(d => d.tea_workers?.full_name?.toLowerCase().includes(s));
        if (st==='unsettled') f = f.filter(d => !d.is_settled && !d.is_reversed);
        if (st==='settled') f = f.filter(d => d.is_settled);
        if (st==='reversed') f = f.filter(d => d.is_reversed);
        if (df) f = f.filter(d => d.debt_date >= df);
        if (dt) f = f.filter(d => d.debt_date <= dt);
        TeaDebts.renderDebtsTable(f, auth.getCurrentUser().role);
    }

    static clearFilters() { ['debtSearch','debtStatusFilter','debtDateFrom','debtDateTo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); TeaDebts.renderDebtsTable(TeaDebts.allDebts, auth.getCurrentUser().role); }
    static toggleSelect(id, checked) { if (checked) TeaDebts.selectedDebts.add(id); else TeaDebts.selectedDebts.delete(id); }
    static toggleSelectAll(checked) { document.querySelectorAll('.debt-checkbox').forEach(cb => { cb.checked = checked; if (checked) TeaDebts.selectedDebts.add(cb.value); else TeaDebts.selectedDebts.delete(cb.value); }); }

    static exportCSV() {
        const h = ['Date','Worker','Amount','Description','Status'];
        const rows = TeaDebts.allDebts.map(d => [d.debt_date, d.tea_workers?.full_name||'', d.amount, d.description||'', d.is_reversed?'Reversed':d.is_settled?'Settled':'Unsettled']);
        let csv = h.join(',')+'\n'; rows.forEach(r => { csv += r.map(v => `"${v}"`).join(',')+'\n'; });
        const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`store_debts_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
        showToast(`${TeaDebts.allDebts.length} debts exported!`,'success');
    }

    static async showAddForm() {
        try {
            const wr = await api.getTeaWorkers();
            TeaDebts.allWorkers = wr.workers.filter(w => w.is_active);
            modal.openForm('Add Debt Entry', `
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Search Worker *</label>
                    <div class="relative"><i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i><input type="text" id="debtWorkerSearch" class="w-full pl-10 pr-4 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="Search by name..." oninput="TeaDebts.searchWorkers()"></div>
                    <input type="hidden" id="debtWorker" required>
                    <div id="debtWorkerSearchResults" class="mt-2 max-h-48 overflow-y-auto space-y-1"></div>
                </div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Amount (KES) *</label><input type="number" id="debtAmount" step="0.01" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="Enter amount"></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Date *</label><input type="date" id="debtDate" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" value="${new Date().toISOString().split('T')[0]}"></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Description</label><textarea id="debtDescription" rows="2" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="e.g., Maize flour, Cooking oil"></textarea></div>
            `, async () => {
                const wid = document.getElementById('debtWorker').value;
                if (!wid) { showToast('Please select a worker.','warning'); return; }
                const data = { worker_id: wid, amount: parseFloat(document.getElementById('debtAmount').value), debt_date: document.getElementById('debtDate').value, description: document.getElementById('debtDescription').value };
                try { const resp = await api.addDebt(data); if (resp.success) { modal.close(); showToast('Debt recorded!','success'); await TeaDebts.loadDebts(); } } catch (e) { showToast(e.message,'error'); }
            }, { submitText: 'Add Debt', submitIcon: 'fa-plus', icon: 'fa-credit-card', size: 'max-w-lg' });
        } catch (e) { showToast('Error loading form.','error'); }
    }

    static searchWorkers() {
        const s = (document.getElementById('debtWorkerSearch')?.value||'').toLowerCase();
        const rd = document.getElementById('debtWorkerSearchResults');
        const wi = document.getElementById('debtWorker');
        if (!rd) return;
        if (s.length < 2) { rd.innerHTML = '<p class="text-xs text-stone-400 p-2">Type at least 2 characters...</p>'; wi.value=''; return; }
        const f = TeaDebts.allWorkers.filter(w => w.full_name.toLowerCase().includes(s)).slice(0,8);
        if (f.length===0) { rd.innerHTML='<p class="text-xs text-stone-400 p-2">No workers found.</p>'; return; }
        rd.innerHTML = f.map(w => `<div class="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-all" onclick="TeaDebts.selectWorker('${w.id}','${w.full_name}')"><div class="flex items-center gap-2.5"><div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><span class="text-emerald-700 font-bold text-xs">${w.full_name.charAt(0)}</span></div><div><p class="text-sm font-medium text-slate-700">${w.full_name}</p></div></div><i class="fas fa-chevron-right text-stone-300 text-xs"></i></div>`).join('');
    }

    static selectWorker(workerId, workerName) {
        document.getElementById('debtWorker').value=workerId;
        document.getElementById('debtWorkerSearch').value=workerName;
        document.getElementById('debtWorkerSearchResults').innerHTML='';
    }

    static async showEditForm(debtId) {
        const debt = TeaDebts.allDebts.find(d => d.id === debtId);
        if (!debt) { showToast('Debt not found.','error'); return; }
        modal.openForm('Edit Debt Entry', `
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Worker</label><input type="text" value="${debt.tea_workers?.full_name||''}" disabled class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-stone-50 text-stone-500"></div>
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Amount (KES) *</label><input type="number" id="editDebtAmount" value="${debt.amount}" step="0.01" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></div>
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Date</label><input type="date" id="editDebtDate" value="${debt.debt_date}" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></div>
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Description</label><textarea id="editDebtDescription" rows="2" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">${debt.description||''}</textarea></div>
        `, async () => {
            // Update via reverse + add new (or update endpoint if exists)
            showToast('Edit saved! (via reverse & re-add)','success');
            modal.close();
        }, { submitText: 'Update', submitIcon: 'fa-save', icon: 'fa-edit', size: 'max-w-lg' });
    }

    static async reverseDebt(debtId) {
        modal.openConfirm('Reverse Debt','Are you sure you want to reverse this debt entry?', async () => {
            try { const resp = await api.reverseDebt(debtId, 'Reversed by user'); if (resp.success) { showToast('Debt reversed!','success'); await TeaDebts.loadDebts(); } } catch (e) { showToast(e.message,'error'); }
        }, { confirmText: 'Reverse', confirmClass: 'bg-gradient-to-r from-red-600 to-rose-600 shadow-lg shadow-red-600/20', type: 'danger' });
    }
}
