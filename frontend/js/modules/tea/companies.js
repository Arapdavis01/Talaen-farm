// ============================================
// TALAEN FARM - Tea Buying Companies Management
// ============================================

class TeaCompanies {
    static currentView = 'table';
    static selectedCompanies = new Set();
    static allCompanies = [];
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

        TeaCompanies.selectedCompanies.clear();

        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Tea Buying Companies</h1>
                    <p class="text-stone-500 text-sm mt-1">Manage companies that buy tea from the farm</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="TeaCompanies.exportCSV()"
                        class="bg-white border border-stone-200 text-slate-600 px-4 py-2.5 rounded-xl active:bg-stone-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm min-h-[44px]">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button onclick="TeaCompanies.showAddForm()"
                        class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl active:from-emerald-700 active:to-emerald-800 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-600/20 min-h-[44px]">
                        <i class="fas fa-plus"></i> Add Company
                    </button>
                </div>
            </div>

            <div id="companyStats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"></div>

            <div class="bg-white rounded-2xl border border-stone-200 p-4 mb-4 shadow-sm">
                <div class="flex flex-wrap items-center gap-3">
                    <div class="relative flex-1 min-w-[200px]">
                        <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                        <input type="search" id="companySearch" placeholder="Search by name or registration number..."
                            class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                            autocomplete="off" autocapitalize="none" spellcheck="false"
                            oninput="TeaCompanies._debouncedFilter()">
                    </div>
                    <select id="companyStatusFilter" onchange="TeaCompanies.filterCompanies()"
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[44px]">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select id="companySort" onchange="TeaCompanies.filterCompanies()"
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[44px]">
                        <option value="name">Name A-Z</option>
                        <option value="rate_high">Rate: High-Low</option>
                        <option value="rate_low">Rate: Low-High</option>
                        <option value="newest">Newest First</option>
                    </select>
                    <div class="flex gap-1 border border-stone-200 rounded-xl overflow-hidden">
                        <button onclick="TeaCompanies.setView('table')" id="compTableViewBtn"
                            class="px-3 py-2.5 bg-emerald-50 text-emerald-700 text-sm transition-colors min-h-[44px]" aria-label="Table view">
                            <i class="fas fa-list"></i>
                        </button>
                        <button onclick="TeaCompanies.setView('cards')" id="compCardViewBtn"
                            class="px-3 py-2.5 bg-white text-stone-500 text-sm transition-colors min-h-[44px]" aria-label="Card view">
                            <i class="fas fa-grid-2"></i>
                        </button>
                    </div>
                    ${TeaCompanies.selectedCompanies.size > 0 ? `
                        <button onclick="TeaCompanies.bulkToggleStatus()"
                            class="px-3 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium active:bg-amber-100 transition-colors min-h-[44px]">
                            Bulk Action (${TeaCompanies.selectedCompanies.size})
                        </button>
                    ` : ''}
                </div>
            </div>

            <div id="companiesContainer">
                <div class="text-center py-12">
                    <div class="spinner mx-auto"></div>
                    <p class="text-stone-500 mt-3">Loading companies...</p>
                </div>
            </div>
        `;

        await TeaCompanies.loadCompanies();
    }

    static _debouncedFilter() {
        if (TeaCompanies._searchTimer) clearTimeout(TeaCompanies._searchTimer);
        TeaCompanies._searchTimer = setTimeout(() => {
            TeaCompanies._searchTimer = null;
            TeaCompanies.filterCompanies();
        }, 200);
    }

    // ---------- Load ----------
    static async loadCompanies() {
        const container = document.getElementById('companiesContainer');
        if (!container) return false;

        try {
            const response = await api.getCompanies();
            if (response && response.success && Array.isArray(response.companies)) {
                TeaCompanies.allCompanies = response.companies;
                TeaCompanies.renderStats(response.companies);
                TeaCompanies.renderCompanies(response.companies);
                return true;
            }

            container.innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <div class="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-building text-stone-300 text-2xl"></i>
                    </div>
                    <p class="text-stone-500 mb-4">No companies added yet.</p>
                    <button onclick="TeaCompanies.showAddForm()"
                        class="text-emerald-600 active:text-emerald-700 font-medium min-h-[44px]">
                        <i class="fas fa-plus mr-1"></i> Add your first company
                    </button>
                </div>
            `;
            const stats = document.getElementById('companyStats');
            if (stats) stats.innerHTML = '';
            return true;
        } catch (error) {
            console.error('[TeaCompanies] Load failed:', error);
            container.innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500 mb-3">Failed to load companies.</p>
                    <button onclick="TeaCompanies.loadCompanies()"
                        class="text-emerald-600 font-medium text-sm min-h-[44px]">
                        <i class="fas fa-rotate-right mr-1"></i> Retry
                    </button>
                </div>
            `;
            return false;
        }
    }

    // ---------- Stats ----------
    static renderStats(companies) {
        const container = document.getElementById('companyStats');
        if (!container) return;

        const list = Array.isArray(companies) ? companies : [];
        const total = list.length;
        const active = list.filter((c) => c.is_active).length;
        const inactive = total - active;
        const avgRate = total > 0
            ? list.reduce((sum, c) => sum + TeaCompanies._num(c.buying_rate), 0) / total
            : 0;

        container.innerHTML = `
            ${TeaCompanies._statCard('Total Companies', total, 'text-slate-800')}
            ${TeaCompanies._statCard('Active', active, 'text-emerald-700')}
            ${TeaCompanies._statCard('Inactive', inactive, 'text-red-500')}
            ${TeaCompanies._statCard('Avg Buying Rate', `KES ${TeaCompanies._fmt(avgRate)}`, 'text-sky-700')}
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
    static renderCompanies(companies) {
        const container = document.getElementById('companiesContainer');
        if (!container) return;

        const list = Array.isArray(companies) ? companies : [];
        if (list.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-search text-stone-300 text-3xl mb-3"></i>
                    <p class="text-stone-500">No companies match your filters.</p>
                </div>
            `;
            return;
        }

        if (TeaCompanies.currentView === 'cards') TeaCompanies.renderCardView(list);
        else TeaCompanies.renderTableView(list);

        setTimeout(() => {
            document.querySelectorAll('.company-checkbox').forEach((cb) => {
                cb.checked = TeaCompanies.selectedCompanies.has(cb.value);
            });
        }, 0);
    }

    static renderTableView(companies) {
        const container = document.getElementById('companiesContainer');
        if (!container) return;
        const rows = companies.map((c) => TeaCompanies._companyRow(c)).join('');

        container.innerHTML = `
            <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="responsive-table w-full">
                        <thead>
                            <tr class="bg-stone-50/80 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                                <th class="px-4 py-3 w-10"><input type="checkbox" id="selectAllCompanies" onchange="TeaCompanies.toggleSelectAll(this.checked)" class="rounded border-stone-300" aria-label="Select all"></th>
                                <th class="px-4 py-3">Company</th>
                                <th class="px-4 py-3">Reg Number</th>
                                <th class="px-4 py-3">Buying Rate</th>
                                <th class="px-4 py-3">Status</th>
                                <th class="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-stone-100">${rows}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    static _companyRow(company) {
        const id = TeaCompanies._jsStr(company.id);
        const name = TeaCompanies._esc(company.name || '—');
        const rawName = TeaCompanies._jsStr(company.name || '');
        const reg = TeaCompanies._esc(company.registration_number || 'N/A');
        const isActive = !!company.is_active;
        const rate = TeaCompanies._fmt(company.buying_rate);

        return `
            <tr class="hover:bg-stone-50 transition-colors cursor-pointer" onclick="TeaCompanies.showCompanyDetail('${id}')">
                <td class="px-4 py-3.5" data-label="Select" onclick="event.stopPropagation()">
                    <input type="checkbox" class="company-checkbox rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                           value="${id}" onchange="TeaCompanies.toggleSelect('${id}', this.checked)">
                </td>
                <td class="px-4 py-3.5" data-label="Name">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span class="text-indigo-700 font-bold text-sm">${TeaCompanies._initials(company.name)}</span>
                        </div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">${name}</p>
                            <p class="text-xs text-stone-400">Reg: ${reg}</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3.5" data-label="Reg Number">
                    <span class="text-sm text-stone-600">${reg || '—'}</span>
                </td>
                <td class="px-4 py-3.5" data-label="Buying Rate">
                    <span class="text-sm font-semibold text-emerald-700">KES ${rate} <span class="text-xs font-normal text-stone-400">/kg</span></span>
                </td>
                <td class="px-4 py-3.5" data-label="Status">
                    <span class="badge ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-4 py-3.5" data-label="Actions" onclick="event.stopPropagation()">
                    <div class="flex items-center gap-1">
                        <button onclick="TeaCompanies.showEditForm('${id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Edit">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button onclick="TeaCompanies.toggleStatus('${id}', ${isActive}, '${rawName}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="${isActive ? 'Deactivate' : 'Activate'}">
                            <i class="fas ${isActive ? 'fa-ban' : 'fa-check'} text-sm"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    static renderCardView(companies) {
        const container = document.getElementById('companiesContainer');
        if (!container) return;
        const cards = companies.map((c) => TeaCompanies._companyCard(c)).join('');
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>
        `;
    }

    static _companyCard(company) {
        const id = TeaCompanies._jsStr(company.id);
        const name = TeaCompanies._esc(company.name || '—');
        const rawName = TeaCompanies._jsStr(company.name || '');
        const reg = TeaCompanies._esc(company.registration_number || 'N/A');
        const isActive = !!company.is_active;
        const rate = TeaCompanies._fmt(company.buying_rate);

        return `
            <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 transition-all cursor-pointer"
                 onclick="TeaCompanies.showCompanyDetail('${id}')">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" class="company-checkbox rounded border-stone-300" value="${id}"
                               onchange="TeaCompanies.toggleSelect('${id}', this.checked)" onclick="event.stopPropagation()">
                        <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <span class="text-indigo-700 font-bold">${TeaCompanies._initials(company.name)}</span>
                        </div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">${name}</p>
                            <p class="text-xs text-stone-400">Reg: ${reg}</p>
                        </div>
                    </div>
                    <span class="badge ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">${isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div class="flex justify-between items-center pt-3 border-t border-stone-100">
                    <span class="text-lg font-bold text-emerald-700">KES ${rate}<span class="text-xs font-normal text-stone-400">/kg</span></span>
                    <div class="flex gap-1" onclick="event.stopPropagation()">
                        <button onclick="TeaCompanies.showEditForm('${id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50" aria-label="Edit"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="TeaCompanies.toggleStatus('${id}', ${isActive}, '${rawName}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50" aria-label="${isActive ? 'Deactivate' : 'Activate'}"><i class="fas ${isActive ? 'fa-ban' : 'fa-check'} text-xs"></i></button>
                    </div>
                </div>
            </div>
        `;
    }

    // ---------- Detail ----------
    static async showCompanyDetail(companyId) {
        const company = TeaCompanies.allCompanies.find((c) => c.id === companyId);
        if (!company) return;

        try {
            const response = await api.getCompanyStats(companyId);
            const stats = (response && response.success && response.stats) ? response.stats : { total_kg: 0, revenue: 0 };

            modal.open(`${TeaCompanies._esc(company.name || 'Company')}`, `
                <div class="space-y-5">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-slate-50 rounded-xl p-4">
                            <p class="text-xs text-stone-500 mb-1">Registration Number</p>
                            <p class="font-semibold text-slate-800">${TeaCompanies._esc(company.registration_number || 'N/A')}</p>
                        </div>
                        <div class="bg-slate-50 rounded-xl p-4">
                            <p class="text-xs text-stone-500 mb-1">Buying Rate</p>
                            <p class="font-semibold text-emerald-700">KES ${TeaCompanies._fmt(company.buying_rate)} /kg</p>
                        </div>
                        <div class="bg-slate-50 rounded-xl p-4">
                            <p class="text-xs text-stone-500 mb-1">Total Kg Bought</p>
                            <p class="font-semibold text-slate-800">${TeaCompanies._fmt(stats.total_kg)} kg</p>
                        </div>
                        <div class="bg-slate-50 rounded-xl p-4">
                            <p class="text-xs text-stone-500 mb-1">Total Revenue</p>
                            <p class="font-semibold text-emerald-700">KES ${TeaCompanies._num(stats.revenue).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-4">
                        <p class="text-xs text-stone-500 mb-1">Status</p>
                        <span class="badge ${company.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">${company.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
            `, { size: 'max-w-lg', icon: 'fa-building' });
        } catch (error) {
            console.error('[TeaCompanies] Detail load failed:', error);
            if (typeof showToast === 'function') showToast('Error loading company details', 'error');
        }
    }

    // ---------- Filters ----------
    static filterCompanies() {
        const search = (document.getElementById('companySearch')?.value || '').trim().toLowerCase();
        const status = document.getElementById('companyStatusFilter')?.value || '';
        const sort = document.getElementById('companySort')?.value || 'name';

        let filtered = [...TeaCompanies.allCompanies];

        if (search) {
            filtered = filtered.filter((c) => {
                const name = String(c.name || '').toLowerCase();
                const reg = String(c.registration_number || '').toLowerCase();
                return name.includes(search) || reg.includes(search);
            });
        }
        if (status === 'active') filtered = filtered.filter((c) => c.is_active);
        if (status === 'inactive') filtered = filtered.filter((c) => !c.is_active);

        if (sort === 'name') filtered.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        if (sort === 'rate_high') filtered.sort((a, b) => TeaCompanies._num(b.buying_rate) - TeaCompanies._num(a.buying_rate));
        if (sort === 'rate_low') filtered.sort((a, b) => TeaCompanies._num(a.buying_rate) - TeaCompanies._num(b.buying_rate));
        if (sort === 'newest') filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        TeaCompanies.renderCompanies(filtered);
    }

    static setView(view) {
        TeaCompanies.currentView = view;
        const tableBtn = document.getElementById('compTableViewBtn');
        const cardBtn = document.getElementById('compCardViewBtn');
        if (tableBtn) tableBtn.className = view === 'table' ? 'px-3 py-2.5 bg-emerald-50 text-emerald-700 text-sm min-h-[44px]' : 'px-3 py-2.5 bg-white text-stone-500 text-sm min-h-[44px]';
        if (cardBtn) cardBtn.className = view === 'cards' ? 'px-3 py-2.5 bg-emerald-50 text-emerald-700 text-sm min-h-[44px]' : 'px-3 py-2.5 bg-white text-stone-500 text-sm min-h-[44px]';
        TeaCompanies.filterCompanies();
    }

    // ---------- Selection ----------
    static toggleSelect(companyId, checked) {
        if (checked) TeaCompanies.selectedCompanies.add(companyId);
        else TeaCompanies.selectedCompanies.delete(companyId);
    }

    static toggleSelectAll(checked) {
        document.querySelectorAll('.company-checkbox').forEach((cb) => {
            cb.checked = checked;
            if (checked) TeaCompanies.selectedCompanies.add(cb.value);
            else TeaCompanies.selectedCompanies.delete(cb.value);
        });
    }

    // ---------- Bulk ----------
    static async bulkToggleStatus() {
        const ids = Array.from(TeaCompanies.selectedCompanies);
        if (ids.length === 0) return;

        modal.openConfirm(
            'Deactivate Companies',
            `Deactivate <strong>${ids.length}</strong> selected compan${ids.length > 1 ? 'ies' : 'y'}? They will no longer be selectable for new deliveries.`,
            async () => {
                let success = 0, failed = 0;
                for (const id of ids) {
                    try {
                        await api.updateCompany(id, { is_active: false });
                        success++;
                    } catch (_) { failed++; }
                }
                TeaCompanies.selectedCompanies.clear();
                TeaCompanies._haptic(failed === 0 ? 10 : [10, 40, 10]);
                if (typeof showToast === 'function') {
                    showToast(
                        failed === 0
                            ? `${success} compan${success > 1 ? 'ies' : 'y'} deactivated`
                            : `${success} succeeded, ${failed} failed`,
                        failed === 0 ? 'success' : 'warning'
                    );
                }
                await TeaCompanies.loadCompanies();
            },
            { confirmText: 'Deactivate', type: 'warning' }
        );
    }

    // ---------- Export CSV ----------
    static exportCSV() {
        const list = Array.isArray(TeaCompanies.allCompanies) ? TeaCompanies.allCompanies : [];
        if (list.length === 0) {
            if (typeof showToast === 'function') showToast('No companies to export', 'warning');
            return;
        }

        const escapeCSV = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
        const headers = ['Name', 'Registration Number', 'Buying Rate (KES/kg)', 'Status'];
        const rows = list.map((c) => [
            c.name || '',
            c.registration_number || '',
            TeaCompanies._fmt(c.buying_rate),
            c.is_active ? 'Active' : 'Inactive'
        ]);

        let csv = headers.map(escapeCSV).join(',') + '\n';
        rows.forEach((row) => { csv += row.map(escapeCSV).join(',') + '\n'; });

        try {
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tea_companies_${new Date().toISOString().split('T')[0]}.csv`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            // Defer cleanup so the browser/WebView has time to start the download
            setTimeout(() => {
                try { URL.revokeObjectURL(url); } catch (_) {}
                if (a.parentElement) a.parentElement.removeChild(a);
            }, 500);
            TeaCompanies._haptic(10);
            if (typeof showToast === 'function') showToast('Companies exported!', 'success');
        } catch (error) {
            console.error('[TeaCompanies] CSV export failed:', error);
            if (typeof showToast === 'function') showToast('Failed to export CSV', 'error');
        }
    }

    // ---------- Add ----------
    static showAddForm() {
        modal.openForm('Add New Company', `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Company Name *</label>
                    <input type="text" id="companyName" required autocomplete="organization" enterkeyhint="next"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]"
                        placeholder="e.g., KTDA, Lipton">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Registration Number</label>
                    <input type="text" id="companyRegNumber" enterkeyhint="next"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]"
                        placeholder="Company registration number">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Buying Rate (KES/kg) *</label>
                    <input type="number" id="buyingRate" step="0.01" min="0" inputmode="decimal" required enterkeyhint="done"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]"
                        placeholder="e.g., 45.00">
                </div>
            </div>
        `, async () => {
            TeaCompanies._validateForm();

            const rate = parseFloat(document.getElementById('buyingRate').value);
            if (isNaN(rate) || rate < 0) throw new Error('Buying rate must be a non-negative number');

            const companyData = {
                name: document.getElementById('companyName').value.trim(),
                registration_number: document.getElementById('companyRegNumber').value.trim(),
                buying_rate: rate
            };
            if (!companyData.name) throw new Error('Company name is required');

            const response = await api.createCompany(companyData);
            if (response && response.success !== false) {
                modal.close();
                TeaCompanies._haptic(10);
                if (typeof showToast === 'function') showToast('Company added successfully!', 'success');
                await TeaCompanies.loadCompanies();
            } else {
                throw new Error((response && response.message) || 'Failed to add company');
            }
        }, {
            submitText: 'Add Company',
            submitIcon: 'fa-building',
            icon: 'fa-building',
            autoClose: false
        });
    }

    // ---------- Edit ----------
    static async showEditForm(companyId) {
        const company = TeaCompanies.allCompanies.find((c) => c.id === companyId);
        if (!company) {
            if (typeof showToast === 'function') showToast('Company not found.', 'error');
            return;
        }

        modal.openForm('Edit Company', `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Company Name *</label>
                    <input type="text" id="editCompanyName" value="${TeaCompanies._esc(company.name || '')}" required autocomplete="organization"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Registration Number</label>
                    <input type="text" id="editCompanyRegNumber" value="${TeaCompanies._esc(company.registration_number || '')}"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Buying Rate (KES/kg) *</label>
                    <input type="number" id="editBuyingRate" value="${TeaCompanies._num(company.buying_rate)}" step="0.01" min="0" inputmode="decimal" required enterkeyhint="done"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]">
                </div>
            </div>
        `, async () => {
            TeaCompanies._validateForm();

            const rate = parseFloat(document.getElementById('editBuyingRate').value);
            if (isNaN(rate) || rate < 0) throw new Error('Buying rate must be a non-negative number');

            const companyData = {
                name: document.getElementById('editCompanyName').value.trim(),
                registration_number: document.getElementById('editCompanyRegNumber').value.trim(),
                buying_rate: rate
            };
            if (!companyData.name) throw new Error('Company name is required');

            const response = await api.updateCompany(companyId, companyData);
            if (response && response.success !== false) {
                modal.close();
                TeaCompanies._haptic(10);
                if (typeof showToast === 'function') showToast('Company updated successfully!', 'success');
                await TeaCompanies.loadCompanies();
            } else {
                throw new Error((response && response.message) || 'Failed to update company');
            }
        }, {
            submitText: 'Update Company',
            icon: 'fa-building',
            autoClose: false
        });
    }

    // ---------- Toggle status ----------
    static async toggleStatus(companyId, currentStatus, companyName) {
        const action = currentStatus ? 'Deactivate' : 'Activate';
        modal.openConfirm(
            `${action} Company`,
            `Are you sure you want to ${action.toLowerCase()} <strong>${TeaCompanies._esc(companyName || '')}</strong>?`,
            async () => {
                const response = await api.updateCompany(companyId, { is_active: !currentStatus });
                if (response && response.success !== false) {
                    TeaCompanies._haptic(10);
                    if (typeof showToast === 'function') showToast(`Company ${action.toLowerCase()}d successfully!`, 'success');
                    await TeaCompanies.loadCompanies();
                } else {
                    throw new Error((response && response.message) || 'Failed to update company');
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
}
