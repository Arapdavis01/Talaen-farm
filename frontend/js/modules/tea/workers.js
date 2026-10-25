// ============================================
// TALAEN FARM - Tea Workers Management
// ============================================

class TeaWorkers {
    static currentView = 'table';
    static selectedWorkers = new Set();
    static allWorkers = [];
    static _searchTimer = null;

    // ---------- Helpers ----------
    static _esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Safe string literal for embedding inside an onclick="..." attribute
    static _jsStr(str) {
        return String(str == null ? '' : str)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/</g, '\\x3C');
    }

    static _num(v, fallback = 0) {
        if (v == null || v === '') return fallback;
        const n = Number(v);
        return isNaN(n) ? fallback : n;
    }

    static _fmt(v, decimals = 2) {
        return this._num(v).toFixed(decimals);
    }

    static _fmtDate(v) {
        if (!v) return '—';
        const d = new Date(v);
        if (isNaN(d.getTime())) return '—';
        try { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
        catch (_) { return '—'; }
    }

    static _initials(name) {
        const n = String(name || '').trim();
        return n ? n.charAt(0).toUpperCase() : '?';
    }

    static _validateForm() {
        const form = document.getElementById('modalForm');
        if (form && !form.checkValidity()) {
            form.reportValidity();
            throw new Error('Please fill all required fields');
        }
    }

    static _haptic(ms = 10) {
        if (window.TALAEN && window.TALAEN.isAndroidApp && navigator.vibrate) {
            try { navigator.vibrate(ms); } catch (_) {}
        }
    }

    // ---------- Show ----------
    static async show() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        // Reset cross-navigation stale state
        TeaWorkers.selectedWorkers.clear();

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

            <div id="workerStats" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"></div>

            <div class="bg-white rounded-2xl border border-stone-200 p-4 mb-4 shadow-sm">
                <div class="flex flex-wrap items-center gap-3">
                    <div class="relative flex-1 min-w-[200px]">
                        <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                        <input type="search" id="workerSearch" placeholder="Search by name, phone or ID..."
                            class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                            autocomplete="off" autocapitalize="none" spellcheck="false"
                            oninput="TeaWorkers._debouncedFilter()">
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
                            class="px-3 py-2.5 bg-emerald-50 text-emerald-700 text-sm transition-colors min-h-[44px]" aria-label="Table view">
                            <i class="fas fa-list"></i>
                        </button>
                        <button onclick="TeaWorkers.setView('cards')" id="cardViewBtn"
                            class="px-3 py-2.5 bg-white text-stone-500 text-sm transition-colors min-h-[44px]" aria-label="Card view">
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

            <div id="workersContainer">
                <div class="text-center py-12">
                    <div class="spinner mx-auto"></div>
                    <p class="text-stone-500 mt-3">Loading workers...</p>
                </div>
            </div>
        `;

        await TeaWorkers.loadWorkers();
    }

    static _debouncedFilter() {
        if (TeaWorkers._searchTimer) clearTimeout(TeaWorkers._searchTimer);
        TeaWorkers._searchTimer = setTimeout(() => {
            TeaWorkers._searchTimer = null;
            TeaWorkers.filterWorkers();
        }, 200);
    }

    // ---------- Load ----------
    static async loadWorkers() {
        const container = document.getElementById('workersContainer');
        if (!container) return false;

        try {
            const response = await api.getTeaWorkers();
            if (response && response.success && Array.isArray(response.workers)) {
                TeaWorkers.allWorkers = response.workers;
                TeaWorkers.renderStats(response.workers);
                TeaWorkers.renderWorkers(response.workers);
                return true;
            }

            container.innerHTML = `
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
            const stats = document.getElementById('workerStats');
            if (stats) stats.innerHTML = '';
            return true;
        } catch (error) {
            console.error('[TeaWorkers] Load failed:', error);
            container.innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500 mb-3">Failed to load workers.</p>
                    <button onclick="TeaWorkers.loadWorkers()"
                        class="text-emerald-600 font-medium text-sm min-h-[44px]">
                        <i class="fas fa-rotate-right mr-1"></i> Retry
                    </button>
                </div>
            `;
            return false;
        }
    }

    // ---------- Stats ----------
    static renderStats(workers) {
        const container = document.getElementById('workerStats');
        if (!container) return;

        const list = Array.isArray(workers) ? workers : [];
        const total = list.length;
        const active = list.filter((w) => w.is_active).length;
        const inactive = total - active;
        const withLogin = list.filter((w) => w.users || w.user_id).length;
        const permanent = list.filter((w) => w.worker_type === 'permanent').length;
        const casual = list.filter((w) => w.worker_type === 'casual').length;
        const seasonal = list.filter((w) => w.worker_type === 'seasonal').length;

        container.innerHTML = `
            ${TeaWorkers._statCard('Total', total, 'text-slate-800')}
            ${TeaWorkers._statCard('Active', active, 'text-emerald-700')}
            ${TeaWorkers._statCard('Inactive', inactive, 'text-red-500')}
            ${TeaWorkers._statCard('With Login', withLogin, 'text-sky-700')}
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

    static _statCard(label, value, valueColor) {
        return `
            <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">${label}</p>
                <p class="text-2xl font-bold ${valueColor}">${value}</p>
            </div>
        `;
    }

    // ---------- Render list ----------
    static renderWorkers(workers) {
        const container = document.getElementById('workersContainer');
        if (!container) return;

        const list = Array.isArray(workers) ? workers : [];
        if (list.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-search text-stone-300 text-3xl mb-3"></i>
                    <p class="text-stone-500">No workers match your filters.</p>
                </div>
            `;
            return;
        }

        if (TeaWorkers.currentView === 'cards') TeaWorkers.renderCardView(list);
        else TeaWorkers.renderTableView(list);

        // Restore checkbox state after re-render
        setTimeout(() => {
            document.querySelectorAll('.worker-checkbox').forEach((cb) => {
                cb.checked = TeaWorkers.selectedWorkers.has(cb.value);
            });
        }, 0);
    }

    static renderTableView(workers) {
        const rows = workers.map((w) => TeaWorkers._workerRow(w)).join('');

        const container = document.getElementById('workersContainer');
        if (!container) return;
        container.innerHTML = `
            <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="responsive-table w-full">
                        <thead>
                            <tr class="bg-stone-50/80 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                                <th class="px-4 py-3 w-10"><input type="checkbox" id="selectAll" onchange="TeaWorkers.toggleSelectAll(this.checked)" class="rounded border-stone-300" aria-label="Select all"></th>
                                <th class="px-4 py-3">Name</th>
                                <th class="px-4 py-3">Phone</th>
                                <th class="px-4 py-3">ID No.</th>
                                <th class="px-4 py-3">Login</th>
                                <th class="px-4 py-3">Status</th>
                                <th class="px-4 py-3">Debt</th>
                                <th class="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-stone-100">${rows}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    static _workerRow(worker) {
        const id = TeaWorkers._jsStr(worker.id);
        const name = TeaWorkers._esc(worker.full_name || '—');
        const rawName = TeaWorkers._jsStr(worker.full_name || '');
        const hasLogin = !!(worker.users || worker.user_id);
        const isActive = !!worker.is_active;
        const debt = TeaWorkers._num(worker.current_debt);

        return `
            <tr class="hover:bg-stone-50 transition-colors cursor-pointer" onclick="TeaWorkers.showWorkerDetail('${id}')">
                <td class="px-4 py-3.5" data-label="Select" onclick="event.stopPropagation()">
                    <input type="checkbox" class="worker-checkbox rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                           value="${id}" onchange="TeaWorkers.toggleSelect('${id}', this.checked)">
                </td>
                <td class="px-4 py-3.5" data-label="Name">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span class="text-emerald-700 font-bold text-sm">${TeaWorkers._initials(worker.full_name)}</span>
                        </div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">${name}</p>
                            <p class="text-xs text-stone-400">${TeaWorkers._esc(worker.worker_type || 'N/A')} | ${TeaWorkers._esc(worker.gender || 'N/A')}</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3.5" data-label="Phone">
                    <span class="text-sm text-stone-600">${TeaWorkers._esc(worker.phone || '—')}</span>
                </td>
                <td class="px-4 py-3.5" data-label="ID">
                    <span class="text-xs text-stone-500">${TeaWorkers._esc(worker.id_number || '—')}</span>
                </td>
                <td class="px-4 py-3.5" data-label="Login">
                    ${hasLogin
                        ? '<span class="badge bg-sky-50 text-sky-700 border border-sky-200"><i class="fas fa-key text-[9px] mr-1"></i>Login</span>'
                        : '<span class="badge bg-stone-50 text-stone-500 border border-stone-200">—</span>'}
                </td>
                <td class="px-4 py-3.5" data-label="Status">
                    <span class="badge ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-4 py-3.5" data-label="Debt">
                    ${debt > 0
                        ? `<span class="text-sm font-medium text-red-600">KES ${TeaWorkers._fmt(debt)}</span>`
                        : '<span class="text-sm text-stone-400">KES 0</span>'}
                </td>
                <td class="px-4 py-3.5" data-label="Actions" onclick="event.stopPropagation()">
                    <div class="flex items-center gap-1">
                        <button onclick="TeaWorkers.showEditForm('${id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Edit">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button onclick="TeaWorkers.toggleStatus('${id}', ${isActive}, '${rawName}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="${isActive ? 'Deactivate' : 'Activate'}">
                            <i class="fas ${isActive ? 'fa-ban' : 'fa-check'} text-sm"></i>
                        </button>
                        ${hasLogin ? `
                            <button onclick="TeaWorkers.showResetPasswordForm('${id}', '${rawName}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Reset Password">
                                <i class="fas fa-key text-sm"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    static renderCardView(workers) {
        const container = document.getElementById('workersContainer');
        if (!container) return;
        const cards = workers.map((w) => TeaWorkers._workerCard(w)).join('');
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>
        `;
    }

    static _workerCard(worker) {
        const id = TeaWorkers._jsStr(worker.id);
        const rawName = TeaWorkers._jsStr(worker.full_name || '');
        const name = TeaWorkers._esc(worker.full_name || '—');
        const phone = TeaWorkers._esc(worker.phone || 'No phone');
        const idNumber = TeaWorkers._esc(worker.id_number || 'N/A');
        const gender = TeaWorkers._esc(worker.gender || 'N/A');
        const type = TeaWorkers._esc(worker.worker_type || 'N/A');
        const hasLogin = !!(worker.users || worker.user_id);
        const isActive = !!worker.is_active;
        const debt = TeaWorkers._num(worker.current_debt);

        return `
            <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 transition-all cursor-pointer"
                 onclick="TeaWorkers.showWorkerDetail('${id}')">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" class="worker-checkbox rounded border-stone-300" value="${id}"
                               onchange="TeaWorkers.toggleSelect('${id}', this.checked)" onclick="event.stopPropagation()">
                        <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <span class="text-emerald-700 font-bold">${TeaWorkers._initials(worker.full_name)}</span>
                        </div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">${name}</p>
                            <p class="text-xs text-stone-400">${phone}</p>
                        </div>
                    </div>
                    <span class="badge ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">${isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div class="flex flex-wrap gap-2 text-xs text-stone-500 mb-3">
                    <span>🆔 ${idNumber}</span>
                    <span>👤 ${gender}</span>
                    <span>📋 ${type}</span>
                    ${hasLogin ? '<span>🔑 Login</span>' : ''}
                </div>
                <div class="flex justify-between items-center pt-3 border-t border-stone-100">
                    <span class="text-xs text-stone-500">Debt: <span class="${debt > 0 ? 'text-red-600 font-semibold' : 'text-stone-400'}">KES ${TeaWorkers._fmt(debt)}</span></span>
                    <div class="flex gap-1" onclick="event.stopPropagation()">
                        <button onclick="TeaWorkers.showEditForm('${id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50" aria-label="Edit"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="TeaWorkers.toggleStatus('${id}', ${isActive}, '${rawName}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50" aria-label="${isActive ? 'Deactivate' : 'Activate'}"><i class="fas ${isActive ? 'fa-ban' : 'fa-check'} text-xs"></i></button>
                    </div>
                </div>
            </div>
        `;
    }

    // ---------- Worker detail ----------
    static async showWorkerDetail(workerId) {
        try {
            const response = await api.getTeaWorkerStats(workerId);
            if (!response || !response.success || !response.stats) return;

            const stats = response.stats;
            const worker = TeaWorkers.allWorkers.find((w) => w.id === workerId);
            if (!worker) return;

            const recent = Array.isArray(stats.recent_plucking) ? stats.recent_plucking : [];

            modal.open(`Worker Details: ${TeaWorkers._esc(worker.full_name || '')}`, `
                <div class="space-y-5">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div class="bg-emerald-50 rounded-xl p-3 text-center">
                            <p class="text-xs text-emerald-600 font-medium">Total Kg</p>
                            <p class="text-xl font-bold text-emerald-800">${TeaWorkers._fmt(stats.total_kg, 1)}</p>
                        </div>
                        <div class="bg-sky-50 rounded-xl p-3 text-center">
                            <p class="text-xs text-sky-600 font-medium">This Month</p>
                            <p class="text-xl font-bold text-sky-800">${TeaWorkers._fmt(stats.monthly_kg, 1)}</p>
                        </div>
                        <div class="bg-amber-50 rounded-xl p-3 text-center">
                            <p class="text-xs text-amber-600 font-medium">Debt</p>
                            <p class="text-xl font-bold text-amber-800">KES ${TeaWorkers._fmt(stats.current_debt)}</p>
                        </div>
                        <div class="bg-purple-50 rounded-xl p-3 text-center">
                            <p class="text-xs text-purple-600 font-medium">Last Payment</p>
                            <p class="text-lg font-bold text-purple-800">${stats.last_payment ? 'KES ' + TeaWorkers._fmt(stats.last_payment.net_pay) : 'N/A'}</p>
                        </div>
                    </div>

                    ${recent.length > 0 ? `
                        <div>
                            <h4 class="font-semibold text-slate-800 mb-2 text-sm">Recent Plucking</h4>
                            <div class="space-y-1 max-h-40 overflow-y-auto">
                                ${recent.map((p) => `
                                    <div class="flex justify-between text-xs py-1.5 px-3 bg-stone-50 rounded-lg">
                                        <span>${TeaWorkers._fmtDate(p.plucking_date)}</span>
                                        <span class="font-medium">${TeaWorkers._fmt(p.weight_kg)} kg</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `, { size: 'max-w-xl', icon: 'fa-user' });
        } catch (error) {
            console.error('[TeaWorkers] Detail load failed:', error);
            if (typeof showToast === 'function') showToast('Error loading worker details', 'error');
        }
    }

    // ---------- Filters ----------
    static filterWorkers() {
        const search = (document.getElementById('workerSearch')?.value || '').trim().toLowerCase();
        const status = document.getElementById('statusFilter')?.value || '';
        const type = document.getElementById('typeFilter')?.value || '';
        const sort = document.getElementById('sortBy')?.value || 'name';

        let filtered = [...TeaWorkers.allWorkers];

        if (search) {
            filtered = filtered.filter((w) => {
                const name = String(w.full_name || '').toLowerCase();
                const phone = String(w.phone || '');
                const idn = String(w.id_number || '');
                return name.includes(search) || phone.includes(search) || idn.includes(search);
            });
        }
        if (status === 'active') filtered = filtered.filter((w) => w.is_active);
        if (status === 'inactive') filtered = filtered.filter((w) => !w.is_active);
        if (type) filtered = filtered.filter((w) => w.worker_type === type);

        if (sort === 'name') filtered.sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || '')));
        if (sort === 'date_joined') filtered.sort((a, b) => new Date(b.date_joined || 0) - new Date(a.date_joined || 0));
        if (sort === 'newest') filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        TeaWorkers.renderWorkers(filtered);
    }

    static setView(view) {
        TeaWorkers.currentView = view;
        const tableBtn = document.getElementById('tableViewBtn');
        const cardBtn = document.getElementById('cardViewBtn');
        if (tableBtn) tableBtn.className = view === 'table' ? 'px-3 py-2.5 bg-emerald-50 text-emerald-700 text-sm min-h-[44px]' : 'px-3 py-2.5 bg-white text-stone-500 text-sm min-h-[44px]';
        if (cardBtn) cardBtn.className = view === 'cards' ? 'px-3 py-2.5 bg-emerald-50 text-emerald-700 text-sm min-h-[44px]' : 'px-3 py-2.5 bg-white text-stone-500 text-sm min-h-[44px]';
        TeaWorkers.filterWorkers();
    }

    // ---------- Selection ----------
    static toggleSelect(workerId, checked) {
        if (checked) TeaWorkers.selectedWorkers.add(workerId);
        else TeaWorkers.selectedWorkers.delete(workerId);
    }

    static toggleSelectAll(checked) {
        document.querySelectorAll('.worker-checkbox').forEach((cb) => {
            cb.checked = checked;
            if (checked) TeaWorkers.selectedWorkers.add(cb.value);
            else TeaWorkers.selectedWorkers.delete(cb.value);
        });
    }

    // ---------- Bulk ----------
    static async bulkToggleStatus() {
        const ids = Array.from(TeaWorkers.selectedWorkers);
        if (ids.length === 0) return;

        modal.openConfirm(
            'Deactivate Workers',
            `Deactivate <strong>${ids.length}</strong> selected worker${ids.length > 1 ? 's' : ''}? They will not be able to log in.`,
            async () => {
                let success = 0, failed = 0;
                for (const id of ids) {
                    try {
                        await api.updateTeaWorker(id, { is_active: false });
                        success++;
                    } catch (_) { failed++; }
                }
                TeaWorkers.selectedWorkers.clear();
                TeaWorkers._haptic(failed === 0 ? 10 : [10, 40, 10]);
                if (typeof showToast === 'function') {
                    showToast(
                        failed === 0
                            ? `${success} worker${success > 1 ? 's' : ''} deactivated`
                            : `${success} succeeded, ${failed} failed`,
                        failed === 0 ? 'success' : 'warning'
                    );
                }
                await TeaWorkers.loadWorkers();
            },
            { confirmText: 'Deactivate', type: 'warning' }
        );
    }

    // ---------- Export ----------
    static exportCSV() {
        const url = `${CONFIG.API_URL}/tea/workers/export/csv`;
        if (window.TALAEN && window.TALAEN.isAndroidApp) {
            // WebView download handler intercepts navigation
            window.location.href = url;
        } else {
            window.open(url, '_blank');
        }
    }

    // ---------- Add ----------
    static showAddForm() {
        const formFields = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                    <input type="text" id="workerName" required autocomplete="name" enterkeyhint="next"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]"
                        placeholder="Enter full name">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <input type="tel" id="workerPhone" inputmode="tel" autocomplete="tel" enterkeyhint="next"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]"
                        placeholder="0712345678">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">ID Number</label>
                    <input type="text" id="workerIdNumber" inputmode="numeric" enterkeyhint="next"
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
                        <input type="text" id="workerUsername" autocomplete="off" autocapitalize="none" spellcheck="false"
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

        modal.openForm('Add New Worker', formFields, async () => {
            TeaWorkers._validateForm();

            const workerData = {
                full_name: document.getElementById('workerName').value.trim(),
                phone: document.getElementById('workerPhone').value.trim(),
                id_number: document.getElementById('workerIdNumber').value.trim(),
                gender: document.getElementById('workerGender').value,
                date_of_birth: document.getElementById('workerDob').value,
                worker_type: document.getElementById('workerType').value,
                date_joined: document.getElementById('workerDateJoined').value,
                username: document.getElementById('workerUsername').value.trim() || undefined,
                password: document.getElementById('workerPassword').value || undefined
            };

            if (!workerData.full_name) throw new Error('Full name is required');

            const response = await api.createTeaWorker(workerData);
            if (response && response.success !== false) {
                modal.close();
                TeaWorkers._haptic(10);
                if (typeof showToast === 'function') showToast('Worker added successfully!', 'success');
                await TeaWorkers.loadWorkers();
            } else {
                throw new Error((response && response.message) || 'Failed to add worker');
            }
        }, {
            submitText: 'Add Worker',
            submitIcon: 'fa-user-plus',
            icon: 'fa-user-plus',
            size: 'max-w-2xl',
            autoClose: false
        });
    }

    // ---------- Edit ----------
    static async showEditForm(workerId) {
        const worker = TeaWorkers.allWorkers.find((w) => w.id === workerId);
        if (!worker) {
            if (typeof showToast === 'function') showToast('Worker not found.', 'error');
            return;
        }

        const esc = (v) => TeaWorkers._esc(v);
        const isSel = (v, expected) => (v === expected ? 'selected' : '');

        const formFields = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                    <input type="text" id="editWorkerName" value="${esc(worker.full_name || '')}" required autocomplete="name"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[48px]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <input type="tel" id="editWorkerPhone" value="${esc(worker.phone || '')}" inputmode="tel" autocomplete="tel"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[48px]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">ID Number</label>
                    <input type="text" id="editWorkerIdNumber" value="${esc(worker.id_number || '')}" inputmode="numeric"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[48px]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Gender</label>
                    <select id="editWorkerGender"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white min-h-[48px]">
                        <option value="">Select</option>
                        <option value="male" ${isSel(worker.gender, 'male')}>Male</option>
                        <option value="female" ${isSel(worker.gender, 'female')}>Female</option>
                        <option value="other" ${isSel(worker.gender, 'other')}>Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth</label>
                    <input type="date" id="editWorkerDob" value="${esc(worker.date_of_birth || '')}"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[48px]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Worker Type</label>
                    <select id="editWorkerType"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white min-h-[48px]">
                        <option value="permanent" ${isSel(worker.worker_type, 'permanent')}>Permanent</option>
                        <option value="casual" ${isSel(worker.worker_type, 'casual')}>Casual</option>
                        <option value="seasonal" ${isSel(worker.worker_type, 'seasonal')}>Seasonal</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Date Joined</label>
                    <input type="date" id="editWorkerDateJoined" value="${esc(worker.date_joined || '')}"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[48px]">
                </div>
            </div>
        `;

        modal.openForm('Edit Worker', formFields, async () => {
            TeaWorkers._validateForm();

            const workerData = {
                full_name: document.getElementById('editWorkerName').value.trim(),
                phone: document.getElementById('editWorkerPhone').value.trim(),
                id_number: document.getElementById('editWorkerIdNumber').value.trim(),
                gender: document.getElementById('editWorkerGender').value,
                date_of_birth: document.getElementById('editWorkerDob').value,
                worker_type: document.getElementById('editWorkerType').value,
                date_joined: document.getElementById('editWorkerDateJoined').value
            };

            if (!workerData.full_name) throw new Error('Full name is required');

            const response = await api.updateTeaWorker(workerId, workerData);
            if (response && response.success !== false) {
                modal.close();
                TeaWorkers._haptic(10);
                if (typeof showToast === 'function') showToast('Worker updated successfully!', 'success');
                await TeaWorkers.loadWorkers();
            } else {
                throw new Error((response && response.message) || 'Failed to update worker');
            }
        }, {
            submitText: 'Update Worker',
            icon: 'fa-user-pen',
            size: 'max-w-2xl',
            autoClose: false
        });
    }

    // ---------- Toggle status ----------
    static async toggleStatus(workerId, currentStatus, workerName) {
        const action = currentStatus ? 'Deactivate' : 'Activate';
        modal.openConfirm(
            `${action} Worker`,
            `Are you sure you want to ${action.toLowerCase()} <strong>${TeaWorkers._esc(workerName || '')}</strong>?`,
            async () => {
                const response = await api.updateTeaWorker(workerId, { is_active: !currentStatus });
                if (response && response.success !== false) {
                    TeaWorkers._haptic(10);
                    if (typeof showToast === 'function') showToast(`Worker ${action.toLowerCase()}d successfully!`, 'success');
                    await TeaWorkers.loadWorkers();
                } else {
                    throw new Error((response && response.message) || 'Failed to update worker');
                }
            },
            {
                confirmText: action,
                confirmClass: currentStatus
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg shadow-amber-600/20'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/20',
                type: currentStatus ? 'warning' : 'info'
            }
        );
    }

    // ---------- Reset password ----------
    static showResetPasswordForm(workerId, workerName) {
        modal.openForm(`Reset Password: ${TeaWorkers._esc(workerName || '')}`, `
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">New Password *</label>
                <input type="password" id="resetPassword" required autocomplete="new-password" enterkeyhint="done"
                    class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[48px]"
                    placeholder="Min. 6 characters">
            </div>
        `, async () => {
            TeaWorkers._validateForm();
            const newPassword = document.getElementById('resetPassword').value;
            if (!newPassword || newPassword.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            const worker = TeaWorkers.allWorkers.find((w) => w.id === workerId);
            const userId = worker && (worker.user_id || (worker.users && worker.users.id));
            if (!userId) throw new Error('This worker has no login account');

            const response = await api.resetUserPassword(userId, newPassword);
            if (response && response.success !== false) {
                modal.close();
                TeaWorkers._haptic(10);
                if (typeof showToast === 'function') showToast(`Password reset for ${workerName || 'worker'}!`, 'success');
            } else {
                throw new Error((response && response.message) || 'Failed to reset password');
            }
        }, {
            submitText: 'Reset Password',
            submitIcon: 'fa-key',
            icon: 'fa-key',
            submitClass: 'bg-gradient-to-r from-sky-600 to-sky-700 shadow-lg shadow-sky-600/20',
            autoClose: false
        });
    }
}
