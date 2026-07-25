// ============================================
// TALAEN FARM - Self Plucking Records (Enhanced)
// ============================================

class TeaPluckingSelf {
    static currentView = 'table';
    static selectedRecords = new Set();
    static allRecords = [];
    static allWorkers = [];
    static selectedWorker = null;

    static async show() {
        const mainContent = document.getElementById('mainContent');
        const user = auth.getCurrentUser();
        const isWorker = user.role === 'tea_worker';
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Self Plucking Records</h1>
                    <p class="text-stone-500 text-sm mt-1">${isWorker ? 'Record your daily plucking' : 'View and manage worker self-reported plucking'}</p>
                </div>
                <div class="flex gap-2">
                    ${!isWorker ? `
                        <button onclick="TeaPluckingSelf.exportCSV()" 
                            class="bg-white border border-stone-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-stone-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm">
                            <i class="fas fa-download"></i> Export
                        </button>
                    ` : ''}
                    <button onclick="TeaPluckingSelf.showAddForm()" 
                        class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-600/20">
                        <i class="fas fa-plus"></i> Record Plucking
                    </button>
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div id="pluckingStats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"></div>
            
            <!-- Toolbar -->
            ${!isWorker ? `
                <div class="bg-white rounded-2xl border border-stone-200 p-4 mb-4 shadow-sm">
                    <div class="flex flex-wrap items-center gap-3">
                        <div class="relative flex-1 min-w-[200px]">
                            <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                            <input type="text" id="pluckingSearch" placeholder="Search worker..." 
                                class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                oninput="TeaPluckingSelf.filterRecords()">
                        </div>
                        <input type="date" id="dateFrom" onchange="TeaPluckingSelf.filterRecords()" 
                            class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none">
                        <span class="text-stone-400 text-sm">to</span>
                        <input type="date" id="dateTo" onchange="TeaPluckingSelf.filterRecords()" 
                            class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none">
                        <select id="companyFilter" onchange="TeaPluckingSelf.filterRecords()" 
                            class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none">
                            <option value="">All Companies</option>
                        </select>
                        <button onclick="TeaPluckingSelf.clearFilters()" 
                            class="px-3 py-2.5 text-stone-500 hover:text-slate-700 text-sm">
                            <i class="fas fa-times mr-1"></i> Clear
                        </button>
                    </div>
                </div>
            ` : ''}
            
            <!-- Records Container -->
            <div id="pluckingRecords">
                <div class="text-center py-12">
                    <div class="spinner mx-auto"></div>
                    <p class="text-stone-500 mt-3">Loading records...</p>
                </div>
            </div>
        `;

        if (!isWorker) {
            await TeaPluckingSelf.loadCompanyFilter();
        }
        await TeaPluckingSelf.loadRecords();
        await TeaPluckingSelf.loadStats();
    }

    static async loadCompanyFilter() {
        try {
            const response = await api.getCompanies();
            if (response.success) {
                const select = document.getElementById('companyFilter');
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
            const user = auth.getCurrentUser();
            const isWorker = user.role === 'tea_worker';
            
            const response = await api.getSelfPlucking();
            if (response.success) {
                const records = response.records;
                const today = new Date().toISOString().split('T')[0];
                const todayRecords = records.filter(r => r.plucking_date === today);
                const todayKg = todayRecords.reduce((sum, r) => sum + parseFloat(r.weight_kg), 0);

                // Get all workers and count those who recorded today
                let recordedCount = 0;
                let notRecordedCount = 0;
                
                if (!isWorker) {
                    const workersRes = await api.getTeaWorkers();
                    const activeWorkers = workersRes.workers.filter(w => w.is_active);
                    const todayWorkerIds = new Set(todayRecords.map(r => r.worker_id));
                    recordedCount = todayWorkerIds.size;
                    notRecordedCount = activeWorkers.length - recordedCount;
                }

                document.getElementById('pluckingStats').innerHTML = `
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                        <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Records</p>
                        <p class="text-2xl font-bold text-slate-800">${records.length}</p>
                    </div>
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                        <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Today's Kg</p>
                        <p class="text-2xl font-bold text-emerald-700">${todayKg.toFixed(2)}</p>
                    </div>
                    ${!isWorker ? `
                        <div class="stat-card bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/30">
                            <p class="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">📝 Recorded Today</p>
                            <p class="text-2xl font-bold text-emerald-700">${recordedCount} workers</p>
                        </div>
                        <div class="stat-card bg-white rounded-2xl border border-amber-200 p-4 shadow-sm bg-amber-50/30">
                            <p class="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">❌ Not Recorded</p>
                            <p class="text-2xl font-bold text-amber-700">${notRecordedCount} workers</p>
                        </div>
                    ` : `
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                            <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Today's Records</p>
                            <p class="text-2xl font-bold text-sky-700">${todayRecords.length}</p>
                        </div>
                        <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                            <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">This Month</p>
                            <p class="text-2xl font-bold text-purple-700">${records.length}</p>
                        </div>
                    `}
                `;
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    static async loadRecords() {
        try {
            const user = auth.getCurrentUser();
            let workerId = null;
            
            if (user.role === 'tea_worker') {
                workerId = user.linked_worker_id;
            }
            
            const response = await api.getSelfPlucking(workerId);
            
            if (response.success) {
                TeaPluckingSelf.allRecords = response.records;
                TeaPluckingSelf.renderRecords(TeaPluckingSelf.allRecords);
            } else {
                document.getElementById('pluckingRecords').innerHTML = `
                    <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                        <i class="fas fa-leaf text-stone-300 text-3xl mb-3"></i>
                        <p class="text-stone-500">No plucking records found.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('pluckingRecords').innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load records.</p>
                </div>
            `;
        }
    }

    static renderRecords(records) {
        if (records.length === 0) {
            document.getElementById('pluckingRecords').innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-search text-stone-300 text-3xl mb-3"></i>
                    <p class="text-stone-500">No records match your filters.</p>
                </div>
            `;
            return;
        }

        const user = auth.getCurrentUser();
        const isAdmin = ['farm_owner', 'supervisor'].includes(user.role);

        const rows = records.map(record => `
            <tr class="hover:bg-stone-50 transition-colors">
                ${isAdmin ? `
                    <td class="px-4 py-3" onclick="event.stopPropagation()">
                        <input type="checkbox" class="record-checkbox rounded border-stone-300" value="${record.id}" onchange="TeaPluckingSelf.toggleSelect('${record.id}', this.checked)">
                    </td>
                ` : ''}
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
                <td class="px-4 py-3" data-label="Grade">
                    ${record.field_grade ? `<span class="badge bg-purple-50 text-purple-700 border border-purple-200">${record.field_grade}</span>` : '<span class="text-stone-400">—</span>'}
                </td>
                ${isAdmin ? `
                    <td class="px-4 py-3" data-label="Actions" onclick="event.stopPropagation()">
                        <div class="flex gap-1">
                            <button onclick="TeaPluckingSelf.showEditForm('${record.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50" title="Edit">
                                <i class="fas fa-edit text-xs"></i>
                            </button>
                            <button onclick="TeaPluckingSelf.deleteRecord('${record.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                                <i class="fas fa-trash-alt text-xs"></i>
                            </button>
                        </div>
                    </td>
                ` : ''}
            </tr>
        `).join('');

        document.getElementById('pluckingRecords').innerHTML = `
            <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="responsive-table w-full">
                        <thead>
                            <tr class="bg-stone-50/80 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                                ${isAdmin ? '<th class="px-4 py-3 w-10"><input type="checkbox" id="selectAllRecords" onchange="TeaPluckingSelf.toggleSelectAll(this.checked)" class="rounded border-stone-300"></th>' : ''}
                                <th class="px-4 py-3">Date</th>
                                <th class="px-4 py-3">Worker</th>
                                <th class="px-4 py-3">Company</th>
                                <th class="px-4 py-3">Block</th>
                                <th class="px-4 py-3">Weight</th>
                                <th class="px-4 py-3">Grade</th>
                                ${isAdmin ? '<th class="px-4 py-3">Actions</th>' : ''}
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
        const search = document.getElementById('pluckingSearch')?.value?.toLowerCase() || '';
        const dateFrom = document.getElementById('dateFrom')?.value || '';
        const dateTo = document.getElementById('dateTo')?.value || '';
        const company = document.getElementById('companyFilter')?.value || '';

        let filtered = [...TeaPluckingSelf.allRecords];

        if (search) {
            filtered = filtered.filter(r => 
                r.tea_workers?.full_name?.toLowerCase().includes(search)
            );
        }
        if (dateFrom) filtered = filtered.filter(r => r.plucking_date >= dateFrom);
        if (dateTo) filtered = filtered.filter(r => r.plucking_date <= dateTo);
        if (company) filtered = filtered.filter(r => r.company_id === company);

        TeaPluckingSelf.renderRecords(filtered);
    }

    static clearFilters() {
        const searchEl = document.getElementById('pluckingSearch');
        const dateFromEl = document.getElementById('dateFrom');
        const dateToEl = document.getElementById('dateTo');
        const companyEl = document.getElementById('companyFilter');
        
        if (searchEl) searchEl.value = '';
        if (dateFromEl) dateFromEl.value = '';
        if (dateToEl) dateToEl.value = '';
        if (companyEl) companyEl.value = '';
        
        TeaPluckingSelf.renderRecords(TeaPluckingSelf.allRecords);
    }

    static toggleSelect(id, checked) {
        if (checked) TeaPluckingSelf.selectedRecords.add(id);
        else TeaPluckingSelf.selectedRecords.delete(id);
    }

    static toggleSelectAll(checked) {
        document.querySelectorAll('.record-checkbox').forEach(cb => {
            cb.checked = checked;
            if (checked) TeaPluckingSelf.selectedRecords.add(cb.value);
            else TeaPluckingSelf.selectedRecords.delete(cb.value);
        });
    }

    static exportCSV() {
        const headers = ['Date', 'Worker', 'Company', 'Block', 'Weight (kg)', 'Grade'];
        const rows = TeaPluckingSelf.allRecords.map(r => [
            r.plucking_date,
            r.tea_workers?.full_name || '',
            r.companies?.name || '',
            r.blocks?.name || '',
            r.weight_kg,
            r.field_grade || ''
        ]);
        let csv = headers.join(',') + '\n';
        rows.forEach(row => { csv += row.map(v => `"${v}"`).join(',') + '\n'; });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'self_plucking.csv';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Records exported!', 'success');
    }

    static async showAddForm() {
        try {
            const [workersRes, companiesRes, blocksRes] = await Promise.all([
                api.getTeaWorkers(),
                api.getCompanies(),
                api.getBlocks()
            ]);

            const user = auth.getCurrentUser();
            const isWorker = user.role === 'tea_worker';
            TeaPluckingSelf.allWorkers = workersRes.workers.filter(w => w.is_active);

            const companyOptions = companiesRes.companies.filter(c => c.is_active)
                .map(c => `<option value="${c.id}">${c.name} (KES ${c.buying_rate}/kg)</option>`).join('');
            const blockOptions = blocksRes.blocks.filter(b => b.is_active)
                .map(b => `<option value="${b.id}">${b.name}</option>`).join('');

            modal.openForm('Record Self Plucking', `
                ${!isWorker ? `
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1.5">Search Worker *</label>
                        <div class="relative">
                            <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                            <input type="text" id="workerSearchInput" 
                                class="w-full pl-10 pr-4 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                placeholder="Search by name, phone or ID number..."
                                oninput="TeaPluckingSelf.searchWorkers()">
                        </div>
                        <input type="hidden" id="pluckingWorker" required>
                        <div id="workerSearchResults" class="mt-2 max-h-48 overflow-y-auto space-y-1"></div>
                        <div id="workerStatus" class="mt-2"></div>
                    </div>
                ` : ''}
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Date *</label>
                    <input type="date" id="pluckingDate" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value="${new Date().toISOString().split('T')[0]}"
                        onchange="TeaPluckingSelf.checkWorkerRecord()">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Company *</label>
                    <select id="pluckingCompany" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white">
                        <option value="">Select Company</option>
                        ${companyOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Block *</label>
                    <select id="pluckingBlock" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white">
                        <option value="">Select Block</option>
                        ${blockOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Weight (kg) *</label>
                    <input type="number" id="pluckingWeight" step="0.01" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        placeholder="Enter weight in kg">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Field/Grade</label>
                    <input type="text" id="pluckingGrade" 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        placeholder="e.g., Grade A">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
                    <textarea id="pluckingNotes" rows="2" 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></textarea>
                </div>
            `, async () => {
                const workerId = isWorker ? user.linked_worker_id : document.getElementById('pluckingWorker').value;
                const pluckingDate = document.getElementById('pluckingDate').value;

                if (!isWorker && !workerId) {
                    showToast('Please select a worker.', 'warning');
                    return;
                }

                // Check for duplicate
                const existing = TeaPluckingSelf.allRecords.find(r => 
                    r.worker_id === workerId && r.plucking_date === pluckingDate
                );
                if (existing) {
                    const proceed = confirm(`This worker already has a record for ${pluckingDate} (${existing.weight_kg} kg). Do you want to add another record?`);
                    if (!proceed) return;
                }

                const pluckingData = {
                    worker_id: workerId,
                    plucking_date: pluckingDate,
                    company_id: document.getElementById('pluckingCompany').value,
                    block_id: document.getElementById('pluckingBlock').value,
                    weight_kg: parseFloat(document.getElementById('pluckingWeight').value),
                    field_grade: document.getElementById('pluckingGrade').value,
                    notes: document.getElementById('pluckingNotes').value
                };

                try {
                    const response = await api.recordSelfPlucking(pluckingData);
                    if (response.success) {
                        modal.close();
                        showToast('Plucking recorded successfully!', 'success');
                        await TeaPluckingSelf.loadRecords();
                        await TeaPluckingSelf.loadStats();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }, { submitText: 'Record Plucking', submitIcon: 'fa-leaf', icon: 'fa-leaf', size: 'max-w-xl' });
        } catch (error) {
            showToast('Error loading form data.', 'error');
        }
    }

    static searchWorkers() {
        const search = document.getElementById('workerSearchInput')?.value?.toLowerCase() || '';
        const resultsDiv = document.getElementById('workerSearchResults');
        const workerInput = document.getElementById('pluckingWorker');
        const statusDiv = document.getElementById('workerStatus');
        
        if (!resultsDiv) return;
        
        if (search.length < 2) {
            resultsDiv.innerHTML = '<p class="text-xs text-stone-400 p-2">Type at least 2 characters to search...</p>';
            workerInput.value = '';
            statusDiv.innerHTML = '';
            return;
        }

        const filtered = TeaPluckingSelf.allWorkers.filter(w => 
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
                 onclick="TeaPluckingSelf.selectWorker('${w.id}', '${w.full_name}')">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <span class="text-emerald-700 font-bold text-xs">${w.full_name.charAt(0)}</span>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-slate-700">${w.full_name}</p>
                        <p class="text-[10px] text-stone-400">${w.phone || 'No phone'} ${w.id_number ? '• ' + w.id_number : ''}</p>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-stone-300 text-xs"></i>
            </div>
        `).join('');
    }

    static selectWorker(workerId, workerName) {
        document.getElementById('pluckingWorker').value = workerId;
        document.getElementById('workerSearchInput').value = workerName;
        document.getElementById('workerSearchResults').innerHTML = '';
        
        const worker = TeaPluckingSelf.allWorkers.find(w => w.id === workerId);
        const statusDiv = document.getElementById('workerStatus');
        if (worker) {
            statusDiv.innerHTML = `
                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 mt-2">
                    <i class="fas fa-check-circle text-emerald-500"></i>
                    <span class="text-sm text-emerald-700 font-medium">${workerName} selected</span>
                    <span class="text-xs text-emerald-600 ml-auto">${worker.worker_type || 'Permanent'}</span>
                </div>
            `;
        }
        
        TeaPluckingSelf.checkWorkerRecord();
    }

    static async checkWorkerRecord() {
        const workerId = document.getElementById('pluckingWorker')?.value;
        const pluckingDate = document.getElementById('pluckingDate')?.value;
        const statusDiv = document.getElementById('workerStatus');
        const user = auth.getCurrentUser();
        
        if (!workerId || !pluckingDate || user.role === 'tea_worker' || !statusDiv) return;

        const existing = TeaPluckingSelf.allRecords.find(r => 
            r.worker_id === workerId && r.plucking_date === pluckingDate
        );

        if (existing) {
            statusDiv.innerHTML = `
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-exclamation-triangle text-amber-500"></i>
                        <span class="text-sm text-amber-700 font-medium">Already recorded today!</span>
                    </div>
                    <p class="text-xs text-amber-600 mt-1 ml-7">${existing.weight_kg} kg - ${existing.companies?.name || 'N/A'} (${existing.blocks?.name || 'N/A'})</p>
                </div>
            `;
        } else {
            const worker = TeaPluckingSelf.allWorkers.find(w => w.id === workerId);
            if (worker) {
                statusDiv.innerHTML = `
                    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 mt-2">
                        <i class="fas fa-check-circle text-emerald-500"></i>
                        <span class="text-sm text-emerald-700 font-medium">${worker.full_name} selected</span>
                        <span class="text-xs text-emerald-600 ml-auto">No record for this date</span>
                    </div>
                `;
            }
        }
    }

    static async showEditForm(recordId) {
        const record = TeaPluckingSelf.allRecords.find(r => r.id === recordId);
        if (!record) { showToast('Record not found.', 'error'); return; }

        try {
            const [companiesRes, blocksRes] = await Promise.all([
                api.getCompanies(),
                api.getBlocks()
            ]);

            modal.openForm('Edit Self Plucking Record', `
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Worker</label>
                    <input type="text" value="${record.tea_workers?.full_name || ''}" disabled 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-stone-50 text-stone-500">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                    <input type="date" id="editPluckingDate" value="${record.plucking_date}" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Company</label>
                    <select id="editPluckingCompany" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white">
                        ${companiesRes.companies.map(c => `<option value="${c.id}" ${record.company_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Block</label>
                    <select id="editPluckingBlock" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white">
                        ${blocksRes.blocks.map(b => `<option value="${b.id}" ${record.block_id === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Weight (kg)</label>
                    <input type="number" id="editPluckingWeight" value="${record.weight_kg}" step="0.01" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Grade</label>
                    <input type="text" id="editPluckingGrade" value="${record.field_grade || ''}" 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
                    <textarea id="editPluckingNotes" rows="2" 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">${record.notes || ''}</textarea>
                </div>
            `, async () => {
                // For now, we'll use the same endpoint by recording new and noting the edit
                // In production, you'd want a PUT endpoint for self plucking
                showToast('Edit functionality requires backend update. Record a new entry instead.', 'warning');
                modal.close();
            }, { submitText: 'Update', icon: 'fa-edit', size: 'max-w-xl' });
        } catch (error) {
            showToast('Error loading form.', 'error');
        }
    }

    static async deleteRecord(recordId) {
        modal.openConfirm('Delete Record', 'Are you sure you want to delete this plucking record?', async () => {
            try {
                // Note: Backend needs a DELETE endpoint for self plucking
                showToast('Delete functionality requires backend update.', 'warning');
            } catch (error) {
                showToast(error.message, 'error');
            }
        }, { confirmText: 'Delete', type: 'danger' });
    }
}
