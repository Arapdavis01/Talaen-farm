// ============================================
// TALAEN FARM - Verified Plucking Records (Smart)
// ============================================

class TeaPluckingVerified {
    static allRecords = [];
    static allWorkers = [];
    static selectedRecords = new Set();
    static _selfReportedData = null;

    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Verified Plucking</h1>
                    <p class="text-stone-500 text-sm mt-1">Owner verified plucking records</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="TeaPluckingVerified.exportCSV()" 
                        class="bg-white border border-stone-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-stone-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm">
                        <i class="fas fa-download"></i> Export All
                    </button>
                    <button onclick="TeaPluckingVerified.showAddForm()" 
                        class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-600/20">
                        <i class="fas fa-plus"></i> Record Verified Plucking
                    </button>
                </div>
            </div>
            
            <div id="verifiedStats" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"></div>
            
            <div class="bg-white rounded-2xl border border-stone-200 p-4 mb-4 shadow-sm">
                <div class="flex flex-wrap items-center gap-3">
                    <div class="relative flex-1 min-w-[200px]">
                        <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                        <input type="text" id="verifiedSearch" placeholder="Search worker..." 
                            class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            oninput="TeaPluckingVerified.filterRecords()">
                    </div>
                    <input type="date" id="vDateFrom" onchange="TeaPluckingVerified.filterRecords()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                    <span class="text-stone-400 text-sm">to</span>
                    <input type="date" id="vDateTo" onchange="TeaPluckingVerified.filterRecords()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                    <select id="vCompanyFilter" onchange="TeaPluckingVerified.filterRecords()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"><option value="">All Companies</option></select>
                    <select id="vSettledFilter" onchange="TeaPluckingVerified.filterRecords()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                        <option value="">All Status</option><option value="unsettled">Unsettled</option><option value="settled">Settled</option>
                    </select>
                    <button onclick="TeaPluckingVerified.clearFilters()" class="px-3 py-2.5 text-stone-500 hover:text-slate-700 text-sm"><i class="fas fa-times mr-1"></i> Clear</button>
                </div>
            </div>
            
            <div id="verifiedRecords"><div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading records...</p></div></div>
        `;

        await TeaPluckingVerified.loadCompanyFilter();
        await TeaPluckingVerified.loadRecords();
        await TeaPluckingVerified.loadStats();
    }

    static async loadCompanyFilter() {
        try {
            const response = await api.getCompanies();
            if (response.success) {
                const select = document.getElementById('vCompanyFilter');
                response.companies.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; select.appendChild(o); });
            }
        } catch (error) { console.error('Failed to load companies:', error); }
    }

    static async loadStats() {
        try {
            const response = await api.getVerifiedPlucking();
            if (response.success) {
                const records = response.records;
                const today = new Date().toISOString().split('T')[0];
                const todayKg = records.filter(r => r.plucking_date === today).reduce((s, r) => s + parseFloat(r.weight_kg), 0);
                const totalKg = records.reduce((s, r) => s + parseFloat(r.weight_kg), 0);
                const unsettled = records.filter(r => !r.is_settled).length;
                const settled = records.filter(r => r.is_settled).length;
                document.getElementById('verifiedStats').innerHTML = `
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Records</p><p class="text-2xl font-bold text-slate-800">${records.length}</p></div>
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Today's Kg</p><p class="text-2xl font-bold text-emerald-700">${todayKg.toFixed(2)}</p></div>
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"><p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Kg</p><p class="text-2xl font-bold text-sky-700">${totalKg.toFixed(2)}</p></div>
                    <div class="stat-card bg-white rounded-2xl border border-amber-200 p-4 shadow-sm bg-amber-50/30"><p class="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">⚠️ Unsettled</p><p class="text-2xl font-bold text-amber-700">${unsettled}</p></div>
                    <div class="stat-card bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/30"><p class="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">✅ Settled</p><p class="text-2xl font-bold text-emerald-700">${settled}</p></div>`;
            }
        } catch (error) { console.error('Failed to load stats:', error); }
    }

    static async loadRecords() {
        try {
            const response = await api.getVerifiedPlucking();
            if (response.success) { TeaPluckingVerified.allRecords = response.records; TeaPluckingVerified.renderRecords(TeaPluckingVerified.allRecords); }
            else { document.getElementById('verifiedRecords').innerHTML = `<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-check-double text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No verified plucking records found.</p></div>`; }
        } catch (error) { document.getElementById('verifiedRecords').innerHTML = `<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i><p class="text-red-500">Failed to load records.</p></div>`; }
    }

    static getRecordedByBadge(record) {
        if (!record.users) return '<span class="text-stone-400 text-xs">—</span>';
        const u = record.users.username || 'Unknown';
        return (record.users.role === 'farm_owner' || record.users.role === 'supervisor')
            ? `<span class="badge bg-indigo-50 text-indigo-700 border border-indigo-200"><i class="fas fa-user-shield text-[9px] mr-1"></i>${u}</span>`
            : `<span class="badge bg-stone-50 text-stone-600 border border-stone-200">${u}</span>`;
    }

    static renderRecords(records) {
        if (records.length === 0) { document.getElementById('verifiedRecords').innerHTML = `<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-search text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No records match your filters.</p></div>`; return; }
        const rows = records.map(r => `
            <tr class="hover:bg-stone-50 transition-colors">
                <td class="px-4 py-3" onclick="event.stopPropagation()"><input type="checkbox" class="v-checkbox rounded border-stone-300" value="${r.id}" onchange="TeaPluckingVerified.toggleSelect('${r.id}', this.checked)"></td>
                <td class="px-4 py-3" data-label="Date">${new Date(r.plucking_date).toLocaleDateString('en-GB')}</td>
                <td class="px-4 py-3" data-label="Worker">${r.tea_workers?.full_name || 'N/A'}</td>
                <td class="px-4 py-3" data-label="Company">${r.companies?.name || 'N/A'}</td>
                <td class="px-4 py-3" data-label="Block">${r.blocks?.name || 'N/A'}</td>
                <td class="px-4 py-3" data-label="Weight"><span class="font-semibold text-emerald-700">${parseFloat(r.weight_kg).toFixed(2)} kg</span></td>
                <td class="px-4 py-3" data-label="Status"><span class="badge ${r.is_settled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">${r.is_settled ? 'Settled' : 'Unsettled'}</span></td>
                <td class="px-4 py-3" data-label="Recorded By">${TeaPluckingVerified.getRecordedByBadge(r)}</td>
                <td class="px-4 py-3" data-label="Actions" onclick="event.stopPropagation()">
                    <div class="flex gap-1">
                        <button onclick="TeaPluckingVerified.showEditForm('${r.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50" title="Edit"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="TeaPluckingVerified.deleteRecord('${r.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50" title="Delete"><i class="fas fa-trash-alt text-xs"></i></button>
                    </div>
                </td>
            </tr>`).join('');
        document.getElementById('verifiedRecords').innerHTML = `<div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"><div class="overflow-x-auto"><table class="responsive-table w-full"><thead><tr class="bg-stone-50/80 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wider"><th class="px-4 py-3 w-10"><input type="checkbox" id="selectAllV" onchange="TeaPluckingVerified.toggleSelectAll(this.checked)" class="rounded border-stone-300"></th><th class="px-4 py-3">Date</th><th class="px-4 py-3">Worker</th><th class="px-4 py-3">Company</th><th class="px-4 py-3">Block</th><th class="px-4 py-3">Weight</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Recorded By</th><th class="px-4 py-3">Actions</th></tr></thead><tbody class="divide-y divide-stone-100">${rows}</tbody></table></div></div>`;
    }

    static filterRecords() {
        const s = (document.getElementById('verifiedSearch')?.value || '').toLowerCase();
        const df = document.getElementById('vDateFrom')?.value || '';
        const dt = document.getElementById('vDateTo')?.value || '';
        const co = document.getElementById('vCompanyFilter')?.value || '';
        const st = document.getElementById('vSettledFilter')?.value || '';
        let f = [...TeaPluckingVerified.allRecords];
        if (s) f = f.filter(r => r.tea_workers?.full_name?.toLowerCase().includes(s));
        if (df) f = f.filter(r => r.plucking_date >= df);
        if (dt) f = f.filter(r => r.plucking_date <= dt);
        if (co) f = f.filter(r => r.company_id === co);
        if (st === 'settled') f = f.filter(r => r.is_settled);
        if (st === 'unsettled') f = f.filter(r => !r.is_settled);
        TeaPluckingVerified.renderRecords(f);
    }

    static clearFilters() {
        ['verifiedSearch','vDateFrom','vDateTo','vCompanyFilter','vSettledFilter'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        TeaPluckingVerified.renderRecords(TeaPluckingVerified.allRecords);
    }

    static toggleSelect(id, checked) { if (checked) TeaPluckingVerified.selectedRecords.add(id); else TeaPluckingVerified.selectedRecords.delete(id); }
    static toggleSelectAll(checked) { document.querySelectorAll('.v-checkbox').forEach(cb => { cb.checked = checked; if (checked) TeaPluckingVerified.selectedRecords.add(cb.value); else TeaPluckingVerified.selectedRecords.delete(cb.value); }); }

    static exportCSV() {
        const h = ['Date','Worker','Company','Block','Weight (kg)','Grade','Status','Recorded By'];
        const rows = TeaPluckingVerified.allRecords.map(r => [r.plucking_date, r.tea_workers?.full_name||'', r.companies?.name||'', r.blocks?.name||'', r.weight_kg, r.field_grade||'', r.is_settled?'Settled':'Unsettled', r.users?.username||'Unknown']);
        let csv = h.join(',') + '\n'; rows.forEach(r => { csv += r.map(v => `"${v}"`).join(',') + '\n'; });
        const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `verified_plucking_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
        showToast(`${TeaPluckingVerified.allRecords.length} records exported!`, 'success');
    }

    // ==================== ADD FORM ====================
    static async showAddForm() {
        try {
            const [workersRes, companiesRes, blocksRes] = await Promise.all([api.getTeaWorkers(), api.getCompanies(), api.getBlocks()]);
            TeaPluckingVerified.allWorkers = workersRes.workers.filter(w => w.is_active);
            const co = companiesRes.companies.filter(c => c.is_active).map(c => `<option value="${c.id}">${c.name} (KES ${c.buying_rate}/kg)</option>`).join('');
            const bo = blocksRes.blocks.filter(b => b.is_active).map(b => `<option value="${b.id}">${b.name}</option>`).join('');

            modal.openForm('Record Verified Plucking', `
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Search Worker *</label>
                    <div class="relative"><i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                        <input type="text" id="vWorkerSearch" class="w-full pl-10 pr-4 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="Search by name, phone or ID number..." oninput="TeaPluckingVerified.searchWorkers()">
                    </div>
                    <input type="hidden" id="vWorker" required>
                    <div id="vWorkerSearchResults" class="mt-2 max-h-48 overflow-y-auto space-y-1"></div>
                    <div id="vWorkerStatus" class="mt-2"></div>
                </div>
                <div id="selfReportedData" class="hidden bg-sky-50 border border-sky-200 rounded-xl p-4 mt-2">
                    <h4 class="text-xs font-semibold text-sky-700 uppercase tracking-wider mb-3"><i class="fas fa-user-edit mr-1"></i> Self-Reported Data</h4>
                    <div id="selfReportedContent" class="space-y-2 text-sm"></div>
                    <button type="button" onclick="TeaPluckingVerified.useSelfReportedData()" class="mt-3 w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"><i class="fas fa-copy mr-1.5"></i> Use This Data</button>
                </div>
                <div class="border-t border-stone-200 pt-4 mt-4">
                    <p class="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Verified Data</p>
                    <div class="space-y-3">
                        <div><label class="block text-sm font-medium text-slate-700 mb-1">Date *</label><input type="date" id="vDate" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" value="${new Date().toISOString().split('T')[0]}" onchange="TeaPluckingVerified.onDateChange()"></div>
                        <div><label class="block text-sm font-medium text-slate-700 mb-1">Company *</label><select id="vCompany" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"><option value="">Select Company</option>${co}</select></div>
                        <div><label class="block text-sm font-medium text-slate-700 mb-1">Block *</label><select id="vBlock" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"><option value="">Select Block</option>${bo}</select></div>
                        <div><label class="block text-sm font-medium text-slate-700 mb-1">Weight (kg) *</label><input type="number" id="vWeight" step="0.01" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="Enter weight in kg"></div>
                        <div><label class="block text-sm font-medium text-slate-700 mb-1">Grade <span class="text-stone-400 font-normal">(optional)</span></label><input type="text" id="vGrade" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="e.g., Grade A"></div>
                        <div><label class="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea id="vNotes" rows="2" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></textarea></div>
                    </div>
                </div>
            `, async () => {
                const wid = document.getElementById('vWorker').value;
                if (!wid) { showToast('Please select a worker.', 'warning'); return; }
                const data = { worker_id: wid, plucking_date: document.getElementById('vDate').value, company_id: document.getElementById('vCompany').value, block_id: document.getElementById('vBlock').value, weight_kg: parseFloat(document.getElementById('vWeight').value), field_grade: document.getElementById('vGrade').value || null, notes: document.getElementById('vNotes').value || null };
                try {
                    const resp = await api.recordVerifiedPlucking(data);
                    if (resp.success) { modal.close(); showToast('Verified plucking recorded!', 'success'); await TeaPluckingVerified.loadRecords(); await TeaPluckingVerified.loadStats(); }
                } catch (error) { showToast(error.message, 'error'); }
            }, { submitText: 'Verify & Save', submitIcon: 'fa-check-double', icon: 'fa-check-double', size: 'max-w-xl' });
        } catch (error) { showToast('Error loading form data.', 'error'); }
    }

    static searchWorkers() {
        const search = (document.getElementById('vWorkerSearch')?.value || '').toLowerCase();
        const rd = document.getElementById('vWorkerSearchResults');
        const wi = document.getElementById('vWorker');
        const sd = document.getElementById('vWorkerStatus');
        const sdd = document.getElementById('selfReportedData');
        if (!rd) return;
        if (sdd) sdd.classList.add('hidden');
        if (search.length < 2) { rd.innerHTML = '<p class="text-xs text-stone-400 p-2">Type at least 2 characters...</p>'; wi.value = ''; if (sd) sd.innerHTML = ''; return; }
        const f = TeaPluckingVerified.allWorkers.filter(w => w.full_name.toLowerCase().includes(search) || (w.phone&&w.phone.includes(search)) || (w.id_number&&w.id_number.includes(search))).slice(0,8);
        if (f.length === 0) { rd.innerHTML = '<p class="text-xs text-stone-400 p-2">No workers found.</p>'; return; }
        rd.innerHTML = f.map(w => `<div class="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-all" onclick="TeaPluckingVerified.selectWorker('${w.id}','${w.full_name}')"><div class="flex items-center gap-2.5"><div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><span class="text-emerald-700 font-bold text-xs">${w.full_name.charAt(0)}</span></div><div><p class="text-sm font-medium text-slate-700">${w.full_name}</p><p class="text-[10px] text-stone-400">${w.phone||'No phone'}</p></div></div><i class="fas fa-chevron-right text-stone-300 text-xs"></i></div>`).join('');
    }

    static async selectWorker(workerId, workerName) {
        document.getElementById('vWorker').value = workerId;
        document.getElementById('vWorkerSearch').value = workerName;
        document.getElementById('vWorkerSearchResults').innerHTML = '';
        const sd = document.getElementById('vWorkerStatus');
        if (sd) sd.innerHTML = '';
        const date = document.getElementById('vDate')?.value || new Date().toISOString().split('T')[0];
        await TeaPluckingVerified.loadSelfReportedData(workerId, date);
        await TeaPluckingVerified.checkExistingVerification(workerId, date, workerName);
    }

    static onDateChange() {
        const wid = document.getElementById('vWorker')?.value;
        const date = document.getElementById('vDate')?.value;
        if (wid && date) {
            TeaPluckingVerified.loadSelfReportedData(wid, date);
            TeaPluckingVerified.checkExistingVerification(wid, date);
        }
    }

    static async loadSelfReportedData(workerId, date) {
        const sdd = document.getElementById('selfReportedData');
        const sdc = document.getElementById('selfReportedContent');
        if (!sdd || !sdc) return;
        try {
            const resp = await api.checkWorkerPlucking(workerId, date);
            if (resp.success && resp.records.length > 0) {
                sdd.classList.remove('hidden');
                sdc.innerHTML = resp.records.map(r => `<div class="flex justify-between items-center bg-white rounded-lg p-2.5 border border-sky-100"><div class="text-xs text-stone-600"><span class="font-medium">${r.weight_kg} kg</span> • ${r.companies?.name||'N/A'} • ${r.blocks?.name||'N/A'}${r.field_grade?' • Grade: '+r.field_grade:''}</div></div>`).join('');
                TeaPluckingVerified._selfReportedData = resp.records[0];
            } else { sdd.classList.remove('hidden'); sdc.innerHTML = '<p class="text-xs text-stone-400">No self-reported data for this date.</p>'; TeaPluckingVerified._selfReportedData = null; }
        } catch (e) { sdd.classList.add('hidden'); }
    }

    static useSelfReportedData() {
        const d = TeaPluckingVerified._selfReportedData;
        if (!d) { showToast('No self-reported data available.', 'warning'); return; }
        document.getElementById('vCompany').value = d.company_id || '';
        document.getElementById('vBlock').value = d.block_id || '';
        document.getElementById('vWeight').value = d.weight_kg || '';
        document.getElementById('vGrade').value = d.field_grade || '';
        document.getElementById('vNotes').value = d.notes || '';
        showToast('Self-reported data loaded! Review and click Verify & Save.', 'info');
    }

    static async checkExistingVerification(workerId, date, workerName) {
        const sd = document.getElementById('vWorkerStatus');
        if (!workerId || !date || !sd) return false;
        const ex = TeaPluckingVerified.allRecords.find(r => r.worker_id === workerId && r.plucking_date === date);
        if (ex) {
            const by = ex.users?.username || 'another user';
            sd.innerHTML = `<div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2"><div class="flex items-center gap-2"><i class="fas fa-exclamation-triangle text-amber-500"></i><span class="text-sm text-amber-700 font-medium">Already verified for this date!</span></div><p class="text-xs text-amber-600 mt-1 ml-7">${ex.weight_kg} kg - ${ex.companies?.name||'N/A'} (Verified by: ${by})</p><button onclick="TeaPluckingVerified.showEditForm('${ex.id}')" class="text-xs text-amber-700 underline mt-1 ml-7 hover:text-amber-800"><i class="fas fa-edit mr-1"></i>Edit existing record</button></div>`;
            return true;
        } else {
            const w = TeaPluckingVerified.allWorkers.find(w => w.id === workerId);
            if (w) sd.innerHTML = `<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 mt-2"><i class="fas fa-check-circle text-emerald-500"></i><span class="text-sm text-emerald-700 font-medium">${workerName||w.full_name} selected</span><span class="text-xs text-emerald-600 ml-auto">Ready to verify</span></div>`;
            return false;
        }
    }

    static async showEditForm(recordId) {
        const rec = TeaPluckingVerified.allRecords.find(r => r.id === recordId);
        if (!rec) { showToast('Record not found.', 'error'); return; }
        try {
            const [cr, br] = await Promise.all([api.getCompanies(), api.getBlocks()]);
            modal.openForm('Edit Verified Plucking', `
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Worker</label><input type="text" value="${rec.tea_workers?.full_name||''}" disabled class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-stone-50 text-stone-500"></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Date</label><input type="date" id="editVDate" value="${rec.plucking_date}" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Company</label><select id="editVCompany" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white">${cr.companies.map(c => `<option value="${c.id}" ${rec.company_id===c.id?'selected':''}>${c.name}</option>`).join('')}</select></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Block</label><select id="editVBlock" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white">${br.blocks.map(b => `<option value="${b.id}" ${rec.block_id===b.id?'selected':''}>${b.name}</option>`).join('')}</select></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Weight (kg)</label><input type="number" id="editVWeight" value="${rec.weight_kg}" step="0.01" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Grade</label><input type="text" id="editVGrade" value="${rec.field_grade||''}" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label><textarea id="editVNotes" rows="2" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">${rec.notes||''}</textarea></div>
            `, async () => {
                const ud = { plucking_date: document.getElementById('editVDate').value, company_id: document.getElementById('editVCompany').value, block_id: document.getElementById('editVBlock').value, weight_kg: parseFloat(document.getElementById('editVWeight').value), field_grade: document.getElementById('editVGrade').value||null, notes: document.getElementById('editVNotes').value||null };
                try {
                    const resp = await api.updateVerifiedPlucking(recordId, ud);
                    if (resp.success) { modal.close(); showToast('Record updated!', 'success'); await TeaPluckingVerified.loadRecords(); await TeaPluckingVerified.loadStats(); }
                } catch (error) { showToast(error.message, 'error'); }
            }, { submitText: 'Update', submitIcon: 'fa-save', icon: 'fa-edit', size: 'max-w-xl' });
        } catch (e) { showToast('Error loading form.', 'error'); }
    }

    static async deleteRecord(recordId) {
        modal.openConfirm('Delete Record', 'Delete this verified plucking record? This cannot be undone.', async () => {
            try { const resp = await api.deleteVerifiedPlucking(recordId); if (resp.success) { showToast('Record deleted!', 'success'); await TeaPluckingVerified.loadRecords(); await TeaPluckingVerified.loadStats(); } } catch (e) { showToast(e.message, 'error'); }
        }, { confirmText: 'Delete', type: 'danger' });
    }
}
