// ============================================
// TALAEN FARM - Verified Plucking Records (Smart)
// ============================================

class TeaPluckingVerified {
    static allRecords = [];
    static allWorkers = [];
    static selectedRecords = new Set();

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
            
            <!-- Stats Cards -->
            <div id="verifiedStats" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"></div>
            
            <!-- Toolbar -->
            <div class="bg-white rounded-2xl border border-stone-200 p-4 mb-4 shadow-sm">
                <div class="flex flex-wrap items-center gap-3">
                    <div class="relative flex-1 min-w-[200px]">
                        <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                        <input type="text" id="verifiedSearch" placeholder="Search worker..." 
                            class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            oninput="TeaPluckingVerified.filterRecords()">
                    </div>
                    <input type="date" id="vDateFrom" onchange="TeaPluckingVerified.filterRecords()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none">
                    <span class="text-stone-400 text-sm">to</span>
                    <input type="date" id="vDateTo" onchange="TeaPluckingVerified.filterRecords()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none">
                    <select id="vCompanyFilter" onchange="TeaPluckingVerified.filterRecords()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none">
                        <option value="">All Companies</option>
                    </select>
                    <select id="vSettledFilter" onchange="TeaPluckingVerified.filterRecords()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none">
                        <option value="">All Status</option>
                        <option value="unsettled">Unsettled</option>
                        <option value="settled">Settled</option>
                    </select>
                    <button onclick="TeaPluckingVerified.clearFilters()" 
                        class="px-3 py-2.5 text-stone-500 hover:text-slate-700 text-sm">
                        <i class="fas fa-times mr-1"></i> Clear
                    </button>
                </div>
            </div>
            
            <!-- Records Container -->
            <div id="verifiedRecords">
                <div class="text-center py-12">
                    <div class="spinner mx-auto"></div>
                    <p class="text-stone-500 mt-3">Loading records...</p>
                </div>
            </div>
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
                response.companies.forEach(c => {
                    const option = document.createElement('option');
                    option.value = c.id;
                    option.textContent = c.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load companies:', error);
        }
    }

    static async loadStats() {
        try {
            const response = await api.getVerifiedPlucking();
            if (response.success) {
                const records = response.records;
                const today = new Date().toISOString().split('T')[0];
                const todayRecords = records.filter(r => r.plucking_date === today);
                const todayKg = todayRecords.reduce((sum, r) => sum + parseFloat(r.weight_kg), 0);
                const totalKg = records.reduce((sum, r) => sum + parseFloat(r.weight_kg), 0);
                const unsettled = records.filter(r => !r.is_settled).length;
                const settled = records.filter(r => r.is_settled).length;

                document.getElementById('verifiedStats').innerHTML = `
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                        <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Records</p>
                        <p class="text-2xl font-bold text-slate-800">${records.length}</p>
                    </div>
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                        <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Today's Kg</p>
                        <p class="text-2xl font-bold text-emerald-700">${todayKg.toFixed(2)}</p>
                    </div>
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                        <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Kg</p>
                        <p class="text-2xl font-bold text-sky-700">${totalKg.toFixed(2)}</p>
                    </div>
                    <div class="stat-card bg-white rounded-2xl border border-amber-200 p-4 shadow-sm bg-amber-50/30">
                        <p class="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">⚠️ Unsettled</p>
                        <p class="text-2xl font-bold text-amber-700">${unsettled}</p>
                    </div>
                    <div class="stat-card bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/30">
                        <p class="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">✅ Settled</p>
                        <p class="text-2xl font-bold text-emerald-700">${settled}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    static async loadRecords() {
        try {
            const response = await api.getVerifiedPlucking();
            
            if (response.success) {
                TeaPluckingVerified.allRecords = response.records;
                TeaPluckingVerified.renderRecords(TeaPluckingVerified.allRecords);
            } else {
                document.getElementById('verifiedRecords').innerHTML = `
                    <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                        <i class="fas fa-check-double text-stone-300 text-3xl mb-3"></i>
                        <p class="text-stone-500">No verified plucking records found.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('verifiedRecords').innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load records.</p>
                </div>
            `;
        }
    }

    static getRecordedByBadge(record) {
        if (!record.users) return '<span class="text-stone-400 text-xs">—</span>';
        const username = record.users.username || 'Unknown';
        const role = record.users.role;
        if (role === 'farm_owner' || role === 'supervisor') {
            return `<span class="badge bg-indigo-50 text-indigo-700 border border-indigo-200"><i class="fas fa-user-shield text-[9px] mr-1"></i>${username}</span>`;
        }
        return `<span class="badge bg-stone-50 text-stone-600 border border-stone-200">${username}</span>`;
    }

    static renderRecords(records) {
        if (records.length === 0) {
            document.getElementById('verifiedRecords').innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-search text-stone-300 text-3xl mb-3"></i>
                    <p class="text-stone-500">No records match your filters.</p>
                </div>
            `;
            return;
        }

        const rows = records.map(record => `
            <tr class="hover:bg-stone-50 transition-colors">
                <td class="px-4 py-3" onclick="event.stopPropagation()">
                    <input type="checkbox" class="v-checkbox rounded border-stone-300" value="${record.id}" onchange="TeaPluckingVerified.toggleSelect('${record.id}', this.checked)">
                </td>
                <td class="px-4 py-3" data-label="Date">
                    <span class="text-sm font-medium">${new Date(record.plucking_date).toLocaleDateString('en-GB')}</span>
                </td>
                <td class="px-4 py-3" data-label="Worker">
                    <span class="text-sm font-medium text-slate-700">${record.tea_workers?.full_name || 'N/A'}</span>
                </td>
                <td class="px-4 py-3" data-label="Company">
                    <span class="text-xs">${record.companies?.name || 'N/A'}</span>
                </td>
                <td class="px-4 py-3" data-label="Block">
                    <span class="text-xs">${record.blocks?.name || 'N/A'}</span>
                </td>
                <td class="px-4 py-3" data-label="Weight">
                    <span class="font-semibold text-emerald-700">${parseFloat(record.weight_kg).toFixed(2)} <span class="text-xs font-normal text-stone-400">kg</span></span>
                </td>
                <td class="px-4 py-3" data-label="Status">
                    <span class="badge ${record.is_settled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                        ${record.is_settled ? 'Settled' : 'Unsettled'}
                    </span>
                </td>
                <td class="px-4 py-3" data-label="Recorded By">
                    ${TeaPluckingVerified.getRecordedByBadge(record)}
                </td>
                <td class="px-4 py-3" data-label="Actions" onclick="event.stopPropagation()">
                    <div class="flex gap-1">
                        <button onclick="TeaPluckingVerified.showEditForm('${record.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50" title="Edit">
                            <i class="fas fa-edit text-xs"></i>
                        </button>
                        <button onclick="TeaPluckingVerified.deleteRecord('${record.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                            <i class="fas fa-trash-alt text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        document.getElementById('verifiedRecords').innerHTML = `
            <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="responsive-table w-full">
                        <thead>
                            <tr class="bg-stone-50/80 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                                <th class="px-4 py-3 w-10"><input type="checkbox" id="selectAllV" onchange="TeaPluckingVerified.toggleSelectAll(this.checked)" class="rounded border-stone-300"></th>
                                <th class="px-4 py-3">Date</th>
                                <th class="px-4 py-3">Worker</th>
                                <th class="px-4 py-3">Company</th>
                                <th class="px-4 py-3">Block</th>
                                <th class="px-4 py-3">Weight</th>
                                <th class="px-4 py-3">Status</th>
                                <th class="px-4 py-3">Recorded By</th>
                                <th class="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-stone-100">
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    static filterRecords() {
        const search = document.getElementById('verifiedSearch')?.value?.toLowerCase() || '';
        const dateFrom = document.getElementById('vDateFrom')?.value || '';
        const dateTo = document.getElementById('vDateTo')?.value || '';
        const company = document.getElementById('vCompanyFilter')?.value || '';
        const settled = document.getElementById('vSettledFilter')?.value || '';

        let filtered = [...TeaPluckingVerified.allRecords];

        if (search) {
            filtered = filtered.filter(r => r.tea_workers?.full_name?.toLowerCase().includes(search));
        }
        if (dateFrom) filtered = filtered.filter(r => r.plucking_date >= dateFrom);
        if (dateTo) filtered = filtered.filter(r => r.plucking_date <= dateTo);
        if (company) filtered = filtered.filter(r => r.company_id === company);
        if (settled === 'settled') filtered = filtered.filter(r => r.is_settled);
        if (settled === 'unsettled') filtered = filtered.filter(r => !r.is_settled);

        TeaPluckingVerified.renderRecords(filtered);
    }

    static clearFilters() {
        ['verifiedSearch', 'vDateFrom', 'vDateTo', 'vCompanyFilter', 'vSettledFilter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        TeaPluckingVerified.renderRecords(TeaPluckingVerified.allRecords);
    }

    static toggleSelect(id, checked) {
        if (checked) TeaPluckingVerified.selectedRecords.add(id);
        else TeaPluckingVerified.selectedRecords.delete(id);
    }

    static toggleSelectAll(checked) {
        document.querySelectorAll('.v-checkbox').forEach(cb => {
            cb.checked = checked;
            if (checked) TeaPluckingVerified.selectedRecords.add(cb.value);
            else TeaPluckingVerified.selectedRecords.delete(cb.value);
        });
    }

    static exportCSV() {
        const headers = ['Date', 'Worker', 'Company', 'Block', 'Weight (kg)', 'Grade', 'Status', 'Recorded By'];
        const rows = TeaPluckingVerified.allRecords.map(r => [
            r.plucking_date,
            r.tea_workers?.full_name || '',
            r.companies?.name || '',
            r.blocks?.name || '',
            r.weight_kg,
            r.field_grade || '',
            r.is_settled ? 'Settled' : 'Unsettled',
            r.users?.username || 'Unknown'
        ]);
        let csv = headers.join(',') + '\n';
        rows.forEach(row => { csv += row.map(v => `"${v}"`).join(',') + '\n'; });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verified_plucking_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`${TeaPluckingVerified.allRecords.length} records exported!`, 'success');
    }

    static async showAddForm() {
        try {
            const [workersRes, companiesRes, blocksRes] = await Promise.all([
                api.getTeaWorkers(),
                api.getCompanies(),
                api.getBlocks()
            ]);

            TeaPluckingVerified.allWorkers = workersRes.workers.filter(w => w.is_active);
            const companyOptions = companiesRes.companies.filter(c => c.is_active)
                .map(c => `<option value="${c.id}">${c.name} (KES ${c.buying_rate}/kg)</option>`).join('');
            const blockOptions = blocksRes.blocks.filter(b => b.is_active)
                .map(b => `<option value="${b.id}">${b.name}</option>`).join('');

            modal.openForm('Record Verified Plucking', `
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Search Worker *</label>
                    <div class="relative">
                        <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                        <input type="text" id="vWorkerSearch" 
                            class="w-full pl-10 pr-4 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            placeholder="Search by name, phone or ID number..."
                            oninput="TeaPluckingVerified.searchWorkers()">
                    </div>
                    <input type="hidden" id="vWorker" required>
                    <div id="vWorkerSearchResults" class="mt-2 max-h-48 overflow-y-auto space-y-1"></div>
                    <div id="vWorkerStatus" class="mt-2"></div>
                </div>
                <div id="selfReportedData" class="hidden bg-sky-50 border border-sky-200 rounded-xl p-4 mt-2">
                    <h4 class="text-xs font-semibold text-sky-700 uppercase tracking-wider mb-3">
                        <i class="fas fa-user-edit mr-1"></i> Self-Reported Data
                    </h4>
                    <div id="selfReportedContent" class="space-y-2 text-sm"></div>
                    <button type="button" onclick="TeaPluckingVerified.useSelfReportedData()" 
                        class="mt-3 w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                        <i class="fas fa-copy mr-1.5"></i> Use This Data
                    </button>
                </div>
                <div class="border-t border-stone-200 pt-4 mt-4">
                    <p class="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Verified Data</p>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                            <input type="date" id="vDate" required 
                                class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                value="${new Date().toISOString().split('T')[0]}"
                                onchange="TeaPluckingVerified.checkExistingVerification()">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                            <select id="vCompany" required 
                                class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white">
                                <option value="">Select Company</option>
                                ${companyOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Block *</label>
                            <select id="vBlock" required 
                                class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white">
                                <option value="">Select Block</option>
                                ${blockOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Weight (kg) *</label>
                            <input type="number" id="vWeight" step="0.01" required 
                                class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                placeholder="Enter weight in kg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Grade <span class="text-stone-400 font-normal">(optional)</span></label>
                            <input type="text" id="vGrade" 
                                class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                placeholder="e.g., Grade A">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                            <textarea id="vNotes" rows="2" 
                                class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></textarea>
                        </div>
                    </div>
                </div>
            `, async () => {
                const workerId = document.getElementById('vWorker').value;
                if (!workerId) { showToast('Please select a worker.', 'warning'); return; }

                const data = {
                    worker_id: workerId,
                    plucking_date: document.getElementById('vDate').value,
                    company_id: document.getElementById('vCompany').value,
                    block_id: document.getElementById('vBlock').value,
                    weight_kg: parseFloat(document.getElementById('vWeight').value),
                    field_grade: document.getElementById('vGrade').value || null,
                    notes: document.getElementById('vNotes').value || null
                };

                try {
                    const response = await api.recordVerifiedPlucking(data);
                    if (response.success) {
                        modal.close();
                        showToast('Verified plucking recorded!', 'success');
                        await TeaPluckingVerified.loadRecords();
                        await TeaPluckingVerified.loadStats();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }, { submitText: 'Verify & Save', submitIcon: 'fa-check-double', icon: 'fa-check-double', size: 'max-w-xl' });
        } catch (error) {
            showToast('Error loading form data.', 'error');
        }
    }

    static searchWorkers() {
        const search = document.getElementById('vWorkerSearch')?.value?.toLowerCase() || '';
        const resultsDiv = document.getElementById('vWorkerSearchResults');
        const workerInput = document.getElementById('vWorker');
        const statusDiv = document.getElementById('vWorkerStatus');
        const selfDiv = document.getElementById('selfReportedData');
        
        if (!resultsDiv) return;
        if (selfDiv) selfDiv.classList.add('hidden');
        
        if (search.length < 2) {
            resultsDiv.innerHTML = '<p class="text-xs text-stone-400 p-2">Type at least 2 characters...</p>';
            workerInput.value = '';
            if (statusDiv) statusDiv.innerHTML = '';
            return;
        }

        const filtered = TeaPluckingVerified.allWorkers.filter(w => 
            w.full_name.toLowerCase().includes(search) ||
            (w.phone && w.phone.includes(search)) ||
            (w.id_number && w.id_number.includes(search))
        ).slice(0, 8);

        if (filtered.length === 0) {
            resultsDiv.innerHTML = '<p class="text-xs text-stone-400 p-2">No workers found.</p>';
            return;
        }

        resultsDiv.innerHTML = filtered.map(w => `
            <div class="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-all"
                 onclick="TeaPluckingVerified.selectWorker('${w.id}', '${w.full_name}')">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <span class="text-emerald-700 font-bold text-xs">${w.full_name.charAt(0)}</span>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-slate-700">${w.full_name}</p>
                        <p class="text-[10px] text-stone-400">${w.phone || 'No phone'}</p>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-stone-300 text-xs"></i>
            </div>
        `).join('');
    }

    static async selectWorker(workerId, workerName) {
        document.getElementById('vWorker').value = workerId;
        document.getElementById('vWorkerSearch').value = workerName;
        document.getElementById('vWorkerSearchResults').innerHTML = '';
        
        const worker = TeaPluckingVerified.allWorkers.find(w => w.id === workerId);
        const statusDiv = document.getElementById('vWorkerStatus');
        const selfDiv = document.getElementById('selfReportedData');
        const selfContent = document.getElementById('selfReportedContent');
        
        if (worker && statusDiv) {
            statusDiv.innerHTML = `
                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 mt-2">
                    <i class="fas fa-check-circle text-emerald-500"></i>
                    <span class="text-sm text-emerald-700 font-medium">${workerName} selected</span>
                </div>
            `;
        }

        // Load self-reported data for this worker for the selected date
        const date = document.getElementById('vDate')?.value || new Date().toISOString().split('T')[0];
        await TeaPluckingVerified.loadSelfReportedData(workerId, date);
        await TeaPluckingVerified.checkExistingVerification();
    }

    static async loadSelfReportedData(workerId, date) {
        const selfDiv = document.getElementById('selfReportedData');
        const selfContent = document.getElementById('selfReportedContent');
        if (!selfDiv || !selfContent) return;

        try {
            const response = await api.checkWorkerPlucking(workerId, date);
            if (response.success && response.records.length > 0) {
                const records = response.records;
                selfDiv.classList.remove('hidden');
                
                selfContent.innerHTML = records.map(r => `
                    <div class="flex justify-between items-center bg-white rounded-lg p-2.5 border border-sky-100">
                        <div class="text-xs text-stone-600">
                            <span class="font-medium">${r.weight_kg} kg</span> • ${r.companies?.name || 'N/A'} • ${r.blocks?.name || 'N/A'}
                            ${r.field_grade ? ` • Grade: ${r.field_grade}` : ''}
                        </div>
                    </div>
                `).join('');
                
                // Store self-reported data for auto-fill
                TeaPluckingVerified._selfReportedData = records[0];
            } else {
                selfDiv.classList.remove('hidden');
                selfContent.innerHTML = '<p class="text-xs text-stone-400">No self-reported data for this date.</p>';
                TeaPluckingVerified._selfReportedData = null;
            }
        } catch (error) {
            selfDiv.classList.add('hidden');
        }
    }

    static useSelfReportedData() {
        const data = TeaPluckingVerified._selfReportedData;
        if (!data) { showToast('No self-reported data available.', 'warning'); return; }

        document.getElementById('vCompany').value = data.company_id || '';
        document.getElementById('vBlock').value = data.block_id || '';
        document.getElementById('vWeight').value = data.weight_kg || '';
        document.getElementById('vGrade').value = data.field_grade || '';
        document.getElementById('vNotes').value = data.notes || '';
        
        showToast('Self-reported data loaded! Review and click Save.', 'info');
    }

    static async checkExistingVerification() {
        const workerId = document.getElementById('vWorker')?.value;
        const date = document.getElementById('vDate')?.value;
        const statusDiv = document.getElementById('vWorkerStatus');
        if (!workerId || !date || !statusDiv) return;

        const existing = TeaPluckingVerified.allRecords.find(r => 
            r.worker_id === workerId && r.plucking_date === date
        );

        if (existing) {
            statusDiv.innerHTML = `
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-exclamation-triangle text-amber-500"></i>
                        <span class="text-sm text-amber-700 font-medium">Already verified for this date!</span>
                    </div>
                    <p class="text-xs text-amber-600 mt-1 ml-7">${existing.weight_kg} kg - ${existing.companies?.name || 'N/A'}</p>
                    <button onclick="TeaPluckingVerified.showEditForm('${existing.id}')" class="text-xs text-amber-700 underline mt-1 ml-7">Edit existing record</button>
                </div>
            `;
        }
    }

    static async showEditForm(recordId) {
        const record = TeaPluckingVerified.allRecords.find(r => r.id === recordId);
        if (!record) { showToast('Record not found.', 'error'); return; }

        try {
            const [companiesRes, blocksRes] = await Promise.all([
                api.getCompanies(),
                api.getBlocks()
            ]);

            modal.openForm('Edit Verified Plucking', `
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Worker</label>
                    <input type="text" value="${record.tea_workers?.full_name || ''}" disabled 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-stone-50 text-stone-500">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                    <input type="date" id="editVDate" value="${record.plucking_date}" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Company</label>
                    <select id="editVCompany" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white">
                        ${companiesRes.companies.map(c => `<option value="${c.id}" ${record.company_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Block</label>
                    <select id="editVBlock" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white">
                        ${blocksRes.blocks.map(b => `<option value="${b.id}" ${record.block_id === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Weight (kg)</label>
                    <input type="number" id="editVWeight" value="${record.weight_kg}" step="0.01" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Grade</label>
                    <input type="text" id="editVGrade" value="${record.field_grade || ''}" 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
                    <textarea id="editVNotes" rows="2" 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">${record.notes || ''}</textarea>
                </div>
            `, async () => {
                const updateData = {
                    plucking_date: document.getElementById('editVDate').value,
                    company_id: document.getElementById('editVCompany').value,
                    block_id: document.getElementById('editVBlock').value,
                    weight_kg: parseFloat(document.getElementById('editVWeight').value),
                    field_grade: document.getElementById('editVGrade').value || null,
                    notes: document.getElementById('editVNotes').value || null
                };

                try {
                    const response = await api.updateVerifiedPlucking(recordId, updateData);
                    if (response.success) {
                        modal.close();
                        showToast('Record updated!', 'success');
                        await TeaPluckingVerified.loadRecords();
                        await TeaPluckingVerified.loadStats();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }, { submitText: 'Update', submitIcon: 'fa-save', icon: 'fa-edit', size: 'max-w-xl' });
        } catch (error) {
            showToast('Error loading form.', 'error');
        }
    }

    static async deleteRecord(recordId) {
        modal.openConfirm('Delete Record', 'Delete this verified plucking record? This cannot be undone.', async () => {
            try {
                const response = await api.deleteVerifiedPlucking(recordId);
                if (response.success) {
                    showToast('Record deleted!', 'success');
                    await TeaPluckingVerified.loadRecords();
                    await TeaPluckingVerified.loadStats();
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }, { confirmText: 'Delete', type: 'danger' });
    }
}
