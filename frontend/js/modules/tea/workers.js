// ============================================
// TALAEN FARM - Tea Workers Management (Phone‑Optimized)
// ============================================

class TeaWorkers {
    static currentView = 'table';
    static selectedWorkers = new Set();
    static allWorkers = [];

    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Tea Workers</h1>
                    <p class="text-stone-500 text-sm mt-1">Manage tea pluckers and their accounts</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="TeaWorkers.exportCSV()" 
                        class="bg-white border border-stone-200 text-slate-600 px-4 py-2.5 rounded-xl active:bg-stone-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm min-h-[44px]">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button onclick="TeaWorkers.showAddForm()" 
                        class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl active:from-emerald-700 active:to-emerald-800 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-600/20 min-h-[44px]">
                        <i class="fas fa-plus"></i> Add Worker
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div id="workerStats" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"></div>

            <!-- Toolbar -->
            <div class="bg-white rounded-2xl border border-stone-200 p-4 mb-4 shadow-sm">
                <div class="flex flex-wrap items-center gap-3">
                    <div class="relative flex-1 min-w-[200px]">
                        <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                        <input type="search" id="workerSearch" placeholder="Search by name, phone or ID..." 
                            class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                            oninput="TeaWorkers.filterWorkers()">
                    </div>
                    <select id="statusFilter" onchange="TeaWorkers.filterWorkers()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[44px]">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select id="typeFilter" onchange="TeaWorkers.filterWorkers()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[44px]">
                        <option value="">All Types</option>
                        <option value="permanent">Permanent</option>
                        <option value="casual">Casual</option>
                        <option value="seasonal">Seasonal</option>
                    </select>
                    <select id="sortBy" onchange="TeaWorkers.filterWorkers()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[44px]">
                        <option value="name">Name A-Z</option>
                        <option value="date_joined">Date Joined</option>
                        <option value="newest">Newest First</option>
                    </select>
                    <div class="flex gap-1 border border-stone-200 rounded-xl overflow-hidden">
                        <button onclick="TeaWorkers.setView('table')" id="tableViewBtn" 
                            class="px-3 py-2.5 bg-emerald-50 text-emerald-700 text-sm transition-colors min-h-[44px]">
                            <i class="fas fa-list"></i>
                        </button>
                        <button onclick="TeaWorkers.setView('cards')" id="cardViewBtn" 
                            class="px-3 py-2.5 bg-white text-stone-500 text-sm transition-colors min-h-[44px]">
                            <i class="fas fa-grid-2"></i>
                        </button>
                    </div>
                    ${TeaWorkers.selectedWorkers.size > 0 ? `
                        <button onclick="TeaWorkers.bulkToggleStatus()" 
                            class="px-3 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium active:bg-amber-100 transition-colors min-h-[44px]">
                            Bulk Action (${TeaWorkers.selectedWorkers.size})
                        </button>
                    ` : ''}
                </div>
            </div>

            <!-- Workers Container -->
            <div id="workersContainer">
                <div class="text-center py-12">
                    <div class="spinner mx-auto"></div>
                    <p class="text-stone-500 mt-3">Loading workers...</p>
                </div>
            </div>
        `;

        await TeaWorkers.loadWorkers();
    }

    static async loadWorkers() {
        try {
            const response = await api.getTeaWorkers();
            if (response.success) {
                TeaWorkers.allWorkers = response.workers;
                TeaWorkers.renderStats(response.workers);
                TeaWorkers.renderWorkers(response.workers);
            } else {
                document.getElementById('workersContainer').innerHTML = `
                    <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                        <div class="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-users text-stone-300 text-2xl"></i>
                        </div>
                        <p class="text-stone-500 mb-4">No workers added yet.</p>
                        <button onclick="TeaWorkers.showAddForm()" 
                            class="text-emerald-600 active:text-emerald-700 font-medium min-h-[44px]">
                            <i class="fas fa-plus mr-1"></i> Add your first worker
                        </button>
                    </div>
                `;
                document.getElementById('workerStats').innerHTML = '';
            }
        } catch (error) {
            document.getElementById('workersContainer').innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load workers.</p>
                </div>
            `;
        }
    }

    static renderStats(workers) {
        const total = workers.length;
        const active = workers.filter(w => w.is_active).length;
        const inactive = total - active;
        const withLogin = workers.filter(w => w.users).length;
        const permanent = workers.filter(w => w.worker_type === 'permanent').length;
        const casual = workers.filter(w => w.worker_type === 'casual').length;
        const seasonal = workers.filter(w => w.worker_type === 'seasonal').length;

        document.getElementById('workerStats').innerHTML = `
            <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total</p>
                <p class="text-2xl font-bold text-slate-800">${total}</p>
            </div>
            <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Active</p>
                <p class="text-2xl font-bold text-emerald-700">${active}</p>
            </div>
            <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Inactive</p>
                <p class="text-2xl font-bold text-red-500">${inactive}</p>
            </div>
            <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">With Login</p>
                <p class="text-2xl font-bold text-sky-700">${withLogin}</p>
            </div>
            <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Types</p>
                <p class="text-lg font-bold text-slate-800">
                    <span class="text-emerald-600">P:${permanent}</span> 
                    <span class="text-sky-600">C:${casual}</span> 
                    <span class="text-amber-600">S:${seasonal}</span>
                </p>
            </div>
        `;
    }

    static renderWorkers(workers) {
        if (workers.length === 0) {
            document.getElementById('workersContainer').innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-search text-stone-300 text-3xl mb-3"></i>
                    <p class="text-stone-500">No workers match your filters.</p>
                </div>
            `;
            return;
        }

        if (TeaWorkers.currentView === 'cards') {
            TeaWorkers.renderCardView(workers);
        } else {
            TeaWorkers.renderTableView(workers);
        }
    }

    static renderTableView(workers) {
        const rows = workers.map(worker => `
            <tr class="hover:bg-stone-50 transition-colors cursor-pointer" onclick="TeaWorkers.showWorkerDetail('${worker.id}')">
                <td class="px-4 py-3.5" data-label="Select" onclick="event.stopPropagation()">
                    <input type="checkbox" class="worker-checkbox rounded border-stone-300 text-emerald-600 focus:ring-emerald-500" 
                           value="${worker.id}" onchange="TeaWorkers.toggleSelect('${worker.id}', this.checked)">
                </td>
                <td class="px-4 py-3.5" data-label="Name">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span class="text-emerald-700 font-bold text-sm">${worker.full_name.charAt(0)}</span>
                        </div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">${worker.full_name}</p>
                            <p class="text-xs text-stone-400">${worker.worker_type || 'N/A'} | ${worker.gender || 'N/A'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3.5" data-label="Phone">
                    <span class="text-sm text-stone-600">${worker.phone || '—'}</span>
                </td>
                <td class="px-4 py-3.5" data-label="ID">
                    <span class="text-xs text-stone-500">${worker.id_number || '—'}</span>
                </td>
                <td class="px-4 py-3.5" data-label="Login">
                    ${worker.users ? 
                        '<span class="badge bg-sky-50 text-sky-700 border border-sky-200"><i class="fas fa-key text-[9px] mr-1"></i>Login</span>' : 
                        '<span class="badge bg-stone-50 text-stone-500 border border-stone-200">—</span>'}
                </td>
                <td class="px-4 py-3.5" data-label="Status">
                    <span class="badge ${worker.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">
                        ${worker.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-4 py-3.5" data-label="Debt">
                    ${worker.current_debt > 0 ? 
                        `<span class="text-sm font-medium text-red-600">KES ${worker.current_debt.toFixed(2)}</span>` : 
                        '<span class="text-sm text-stone-400">KES 0</span>'}
                </td>
                <td class="px-4 py-3.5" data-label="Actions" onclick="event.stopPropagation()">
                    <div class="flex items-center gap-1">
                        <button onclick="TeaWorkers.showEditForm('${worker.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Edit">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button onclick="TeaWorkers.toggleStatus('${worker.id}', ${worker.is_active}, '${worker.full_name}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="${worker.is_active ? 'Deactivate' : 'Activate'}">
                            <i class="fas ${worker.is_active ? 'fa-ban' : 'fa-check'} text-sm"></i>
                        </button>
                        ${worker.users ? `
                            <button onclick="TeaWorkers.showResetPasswordForm('${worker.id}', '${worker.full_name}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Reset Password">
                                <i class="fas fa-key text-sm"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        document.getElementById('workersContainer').innerHTML = `
            <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="responsive-table w-full">
                        <thead>
                            <tr class="bg-stone-50/80 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                                <th class="px-4 py-3 w-10"><input type="checkbox" id="selectAll" onchange="TeaWorkers.toggleSelectAll(this.checked)" class="rounded border-stone-300"></th>
                                <th class="px-4 py-3">Name</th>
                                <th class="px-4 py-3">Phone</th>
                                <th class="px-4 py-3">ID No.</th>
                                <th class="px-4 py-3">Login</th>
                                <th class="px-4 py-3">Status</th>
                                <th class="px-4 py-3">Debt</th>
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

    static renderCardView(workers) {
        const cards = workers.map(worker => `
            <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 transition-all cursor-pointer" 
                 onclick="TeaWorkers.showWorkerDetail('${worker.id}')">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" class="worker-checkbox rounded border-stone-300" value="${worker.id}" 
                               onchange="TeaWorkers.toggleSelect('${worker.id}', this.checked)" onclick="event.stopPropagation()">
                        <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <span class="text-emerald-700 font-bold">${worker.full_name.charAt(0)}</span>
                        </div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">${worker.full_name}</p>
                            <p class="text-xs text-stone-400">${worker.phone || 'No phone'}</p>
                        </div>
                    </div>
                    <span class="badge ${worker.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">${worker.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div class="flex flex-wrap gap-2 text-xs text-stone-500 mb-3">
                    <span>🆔 ${worker.id_number || 'N/A'}</span>
                    <span>👤 ${worker.gender || 'N/A'}</span>
                    <span>📋 ${worker.worker_type || 'N/A'}</span>
                    ${worker.users ? '<span>🔑 Login</span>' : ''}
                </div>
                <div class="flex justify-between items-center pt-3 border-t border-stone-100">
                    <span class="text-xs text-stone-500">Debt: <span class="${worker.current_debt > 0 ? 'text-red-600 font-semibold' : 'text-stone-400'}">KES ${worker.current_debt.toFixed(2)}</span></span>
                    <div class="flex gap-1" onclick="event.stopPropagation()">
                        <button onclick="TeaWorkers.showEditForm('${worker.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="TeaWorkers.toggleStatus('${worker.id}', ${worker.is_active}, '${worker.full_name}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50"><i class="fas ${worker.is_active ? 'fa-ban' : 'fa-check'} text-xs"></i></button>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('workersContainer').innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${cards}
            </div>
        `;
    }

    static async showWorkerDetail(workerId) {
        try {
            const response = await api.get(`/tea/workers/${workerId}/stats`);
            if (!response.success) return;

            const { stats } = response;
            const worker = TeaWorkers.allWorkers.find(w => w.id === workerId);
            if (!worker) return;

            modal.open(`Worker Details: ${worker.full_name}`, `
                <div class="space-y-5">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div class="bg-emerald-50 rounded-xl p-3 text-center">
                            <p class="text-xs text-emerald-600 font-medium">Total Kg</p>
                            <p class="text-xl font-bold text-emerald-800">${stats.total_kg.toFixed(1)}</p>
                        </div>
                        <div class="bg-sky-50 rounded-xl p-3 text-center">
                            <p class="text-xs text-sky-600 font-medium">This Month</p>
                            <p class="text-xl font-bold text-sky-800">${stats.monthly_kg.toFixed(1)}</p>
                        </div>
                        <div class="bg-amber-50 rounded-xl p-3 text-center">
                            <p class="text-xs text-amber-600 font-medium">Debt</p>
                            <p class="text-xl font-bold text-amber-800">KES ${stats.current_debt.toFixed(2)}</p>
                        </div>
                        <div class="bg-purple-50 rounded-xl p-3 text-center">
                            <p class="text-xs text-purple-600 font-medium">Last Payment</p>
                            <p class="text-lg font-bold text-purple-800">${stats.last_payment ? 'KES ' + stats.last_payment.net_pay.toFixed(2) : 'N/A'}</p>
                        </div>
                    </div>
                    
                    ${stats.recent_plucking.length > 0 ? `
                        <div>
                            <h4 class="font-semibold text-slate-800 mb-2 text-sm">Recent Plucking</h4>
                            <div class="space-y-1 max-h-40 overflow-y-auto">
                                ${stats.recent_plucking.map(p => `
                                    <div class="flex justify-between text-xs py-1.5 px-3 bg-stone-50 rounded-lg">
                                        <span>${new Date(p.plucking_date).toLocaleDateString()}</span>
                                        <span class="font-medium">${p.weight_kg} kg</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `, { size: 'max-w-xl', icon: 'fa-user' });
        } catch (error) {
            showToast('Error loading worker details', 'error');
        }
    }

    static async filterWorkers() {
        const search = document.getElementById('workerSearch')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        const type = document.getElementById('typeFilter')?.value || '';
        const sort = document.getElementById('sortBy')?.value || 'name';

        let filtered = [...TeaWorkers.allWorkers];

        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter(w => 
                w.full_name.toLowerCase().includes(s) ||
                (w.phone && w.phone.includes(s)) ||
                (w.id_number && w.id_number.includes(s))
            );
        }

        if (status === 'active') filtered = filtered.filter(w => w.is_active);
        if (status === 'inactive') filtered = filtered.filter(w => !w.is_active);
        if (type) filtered = filtered.filter(w => w.worker_type === type);

        if (sort === 'name') filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));
        if (sort === 'date_joined') filtered.sort((a, b) => new Date(b.date_joined || 0) - new Date(a.date_joined || 0));
        if (sort === 'newest') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        TeaWorkers.renderWorkers(filtered);
    }

    static setView(view) {
        TeaWorkers.currentView = view;
        document.getElementById('tableViewBtn').className = view === 'table' ? 'px-3 py-2.5 bg-emerald-50 text-emerald-700 text-sm' : 'px-3 py-2.5 bg-white text-stone-500 text-sm';
        document.getElementById('cardViewBtn').className = view === 'cards' ? 'px-3 py-2.5 bg-emerald-50 text-emerald-700 text-sm' : 'px-3 py-2.5 bg-white text-stone-500 text-sm';
        TeaWorkers.filterWorkers();
    }

    static toggleSelect(workerId, checked) {
        if (checked) TeaWorkers.selectedWorkers.add(workerId);
        else TeaWorkers.selectedWorkers.delete(workerId);
    }

    static toggleSelectAll(checked) {
        document.querySelectorAll('.worker-checkbox').forEach(cb => {
            cb.checked = checked;
            if (checked) TeaWorkers.selectedWorkers.add(cb.value);
            else TeaWorkers.selectedWorkers.delete(cb.value);
        });
    }

    static async bulkToggleStatus() {
        const action = confirm('Deactivate all selected workers?');
        if (!action) return;
        for (const id of TeaWorkers.selectedWorkers) {
            await api.updateTeaWorker(id, { is_active: false });
        }
        TeaWorkers.selectedWorkers.clear();
        showToast('Workers updated', 'success');
        await TeaWorkers.loadWorkers();
    }

    static exportCSV() {
        window.open(`${CONFIG.API_URL}/tea/workers/export/csv`, '_blank');
    }

    // ---------- ADD WORKER FORM (phone‑optimized, no autofocus) ----------
    static showAddForm() {
        const formFields = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                    <input type="text" id="workerName" required inputmode="text"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]"
                        placeholder="Enter full name">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <input type="tel" id="workerPhone" inputmode="tel"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]"
                        placeholder="0712345678">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">ID Number</label>
                    <input type="text" id="workerIdNumber" inputmode="numeric"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]"
                        placeholder="National ID">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Gender</label>
                    <select id="workerGender" 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-white min-h-[48px]">
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth</label>
                    <input type="date" id="workerDob"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Worker Type</label>
                    <select id="workerType" 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-white min-h-[48px]">
                        <option value="permanent">Permanent</option>
                        <option value="casual">Casual</option>
                        <option value="seasonal">Seasonal</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Date Joined</label>
                    <input type="date" id="workerDateJoined" value="${new Date().toISOString().split('T')[0]}"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]">
                </div>
            </div>
            <div class="bg-stone-50 rounded-xl p-4 mt-2 border border-stone-200">
                <h4 class="text-sm font-semibold text-slate-700 mb-3"><i class="fas fa-key mr-1.5 text-emerald-500"></i>Login Account (Optional)</h4>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-stone-500 mb-1">Username</label>
                        <input type="text" id="workerUsername" autocomplete="off"
                            class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm min-h-[44px]"
                            placeholder="username">
                    </div>
                    <div>
                        <label class="block text-xs text-stone-500 mb-1">Password</label>
                        <input type="password" id="workerPassword" autocomplete="new-password"
                            class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm min-h-[44px]"
                            placeholder="Min. 6 characters">
                    </div>
                </div>
            </div>
        `;

        modal.openForm('Add New Worker', formFields, async (e) => {
            const workerData = {
                full_name: document.getElementById('workerName').value,
                phone: document.getElementById('workerPhone').value,
                id_number: document.getElementById('workerIdNumber').value,
                gender: document.getElementById('workerGender').value,
                date_of_birth: document.getElementById('workerDob').value,
                worker_type: document.getElementById('workerType').value,
                date_joined: document.getElementById('workerDateJoined').value,
                username: document.getElementById('workerUsername').value || undefined,
                password: document.getElementById('workerPassword').value || undefined
            };

            const response = await api.createTeaWorker(workerData);
            if (response.success) {
                modal.close();
                showToast('Worker added successfully!', 'success');
                await TeaWorkers.loadWorkers();
            }
        }, {
            submitText: 'Add Worker',
            submitIcon: 'fa-user-plus',
            icon: 'fa-user-plus',
            size: 'max-w-2xl'
        });
    }

    // ---------- EDIT WORKER FORM (phone‑optimized, no autofocus) ----------
    static async showEditForm(workerId) {
        const worker = TeaWorkers.allWorkers.find(w => w.id === workerId);
        if (!worker) { showToast('Worker not found.', 'error'); return; }

        const formFields = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                    <input type="text" id="editWorkerName" value="${worker.full_name}" required inputmode="text"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[48px]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <input type="tel" id="editWorkerPhone" value="${worker.phone || ''}" inputmode="tel"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[48px]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">ID Number</label>
                    <input type="text" id="editWorkerIdNumber" value="${worker.id_number || ''}" inputmode="numeric"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[48px]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Gender</label>
                    <select id="editWorkerGender" 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white min-h-[48px]">
                        <option value="">Select</option>
                        <option value="male" ${worker.gender === 'male' ? 'selected' : ''}>Male</option>
                        <option value="female" ${worker.gender === 'female' ? 'selected' : ''}>Female</option>
                        <option value="other" ${worker.gender === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth</label>
                    <input type="date" id="editWorkerDob" value="${worker.date_of_birth || ''}"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[48px]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Worker Type</label>
                    <select id="editWorkerType" 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white min-h-[48px]">
                        <option value="permanent" ${worker.worker_type === 'permanent' ? 'selected' : ''}>Permanent</option>
                        <option value="casual" ${worker.worker_type === 'casual' ? 'selected' : ''}>Casual</option>
                        <option value="seasonal" ${worker.worker_type === 'seasonal' ? 'selected' : ''}>Seasonal</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Date Joined</label>
                    <input type="date" id="editWorkerDateJoined" value="${worker.date_joined || ''}"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[48px]">
                </div>
            </div>
        `;

        modal.openForm('Edit Worker', formFields, async (e) => {
            const workerData = {
                full_name: document.getElementById('editWorkerName').value,
                phone: document.getElementById('editWorkerPhone').value,
                id_number: document.getElementById('editWorkerIdNumber').value,
                gender: document.getElementById('editWorkerGender').value,
                date_of_birth: document.getElementById('editWorkerDob').value,
                worker_type: document.getElementById('editWorkerType').value,
                date_joined: document.getElementById('editWorkerDateJoined').value
            };

            const response = await api.updateTeaWorker(workerId, workerData);
            if (response.success) {
                modal.close();
                showToast('Worker updated successfully!', 'success');
                await TeaWorkers.loadWorkers();
            }
        }, {
            submitText: 'Update Worker',
            icon: 'fa-user-pen',
            size: 'max-w-2xl'
        });
    }

    // ---------- STATUS TOGGLE ----------
    static async toggleStatus(workerId, currentStatus, workerName) {
        const action = currentStatus ? 'Deactivate' : 'Activate';
        modal.openConfirm(
            `${action} Worker`,
            `Are you sure you want to ${action.toLowerCase()} <strong>${workerName}</strong>?`,
            async () => {
                await api.updateTeaWorker(workerId, { is_active: !currentStatus });
                showToast(`Worker ${action}d successfully!`, 'success');
                await TeaWorkers.loadWorkers();
            },
            { 
                confirmText: action,
                confirmIcon: currentStatus ? 'fa-ban' : 'fa-check',
                confirmClass: currentStatus ? 'bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg shadow-amber-600/20' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/20',
                type: currentStatus ? 'warning' : 'info'
            }
        );
    }

    // ---------- RESET PASSWORD (no autofocus) ----------
    static showResetPasswordForm(workerId, workerName) {
        modal.openForm(`Reset Password: ${workerName}`, `
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">New Password *</label>
                <input type="password" id="resetPassword" required
                    class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[48px]"
                    placeholder="Min. 6 characters">
            </div>
        `, async () => {
            const newPassword = document.getElementById('resetPassword').value;
            if (newPassword.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }

            const worker = TeaWorkers.allWorkers.find(w => w.id === workerId);
            if (worker && worker.user_id) {
                await api.resetUserPassword(worker.user_id, newPassword);
                modal.close();
                showToast(`Password reset for ${workerName}!`, 'success');
            }
        }, { submitText: 'Reset Password', submitIcon: 'fa-key', icon: 'fa-key', submitClass: 'bg-gradient-to-r from-sky-600 to-sky-700 shadow-lg shadow-sky-600/20' });
    }
}
