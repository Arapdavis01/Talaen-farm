// ============================================
// TALAEN FARM - Companies Management (Enhanced)
// ============================================

class TeaCompanies {
    static currentView = 'table';
    static selectedCompanies = new Set();
    static allCompanies = [];

    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Tea Buying Companies</h1>
                    <p class="text-stone-500 text-sm mt-1">Manage companies that buy tea from the farm</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="TeaCompanies.exportCSV()" 
                        class="bg-white border border-stone-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-stone-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button onclick="TeaCompanies.showAddForm()" 
                        class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-600/20">
                        <i class="fas fa-plus"></i> Add Company
                    </button>
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div id="companyStats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"></div>
            
            <!-- Toolbar -->
            <div class="bg-white rounded-2xl border border-stone-200 p-4 mb-4 shadow-sm">
                <div class="flex flex-wrap items-center gap-3">
                    <div class="relative flex-1 min-w-[200px]">
                        <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                        <input type="text" id="companySearch" placeholder="Search by name or registration number..." 
                            class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                            oninput="TeaCompanies.filterCompanies()">
                    </div>
                    <select id="companyStatusFilter" onchange="TeaCompanies.filterCompanies()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select id="companySort" onchange="TeaCompanies.filterCompanies()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none">
                        <option value="name">Name A-Z</option>
                        <option value="rate_high">Rate: High-Low</option>
                        <option value="rate_low">Rate: Low-High</option>
                        <option value="newest">Newest First</option>
                    </select>
                    <div class="flex gap-1 border border-stone-200 rounded-xl overflow-hidden">
                        <button onclick="TeaCompanies.setView('table')" id="compTableViewBtn" 
                            class="px-3 py-2.5 bg-emerald-50 text-emerald-700 text-sm transition-colors">
                            <i class="fas fa-list"></i>
                        </button>
                        <button onclick="TeaCompanies.setView('cards')" id="compCardViewBtn" 
                            class="px-3 py-2.5 bg-white text-stone-500 text-sm transition-colors">
                            <i class="fas fa-grid-2"></i>
                        </button>
                    </div>
                    ${TeaCompanies.selectedCompanies.size > 0 ? `
                        <button onclick="TeaCompanies.bulkToggleStatus()" 
                            class="px-3 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors">
                            Bulk Action (${TeaCompanies.selectedCompanies.size})
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <!-- Companies Container -->
            <div id="companiesContainer">
                <div class="text-center py-12">
                    <div class="spinner mx-auto"></div>
                    <p class="text-stone-500 mt-3">Loading companies...</p>
                </div>
            </div>
        `;

        await TeaCompanies.loadCompanies();
    }

    static async loadCompanies() {
        try {
            const response = await api.getCompanies();
            
            if (response.success) {
                TeaCompanies.allCompanies = response.companies;
                TeaCompanies.renderStats(response.companies);
                TeaCompanies.renderCompanies(response.companies);
            } else {
                document.getElementById('companiesContainer').innerHTML = `
                    <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                        <div class="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-building text-stone-300 text-2xl"></i>
                        </div>
                        <p class="text-stone-500 mb-4">No companies added yet.</p>
                        <button onclick="TeaCompanies.showAddForm()" 
                            class="text-emerald-600 hover:text-emerald-700 font-medium">
                            <i class="fas fa-plus mr-1"></i> Add your first company
                        </button>
                    </div>
                `;
                document.getElementById('companyStats').innerHTML = '';
            }
        } catch (error) {
            document.getElementById('companiesContainer').innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load companies.</p>
                </div>
            `;
        }
    }

    static renderStats(companies) {
        const total = companies.length;
        const active = companies.filter(c => c.is_active).length;
        const inactive = total - active;
        const avgRate = companies.length > 0 
            ? companies.reduce((sum, c) => sum + parseFloat(c.buying_rate), 0) / companies.length 
            : 0;

        document.getElementById('companyStats').innerHTML = `
            <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Companies</p>
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
                <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Avg Buying Rate</p>
                <p class="text-2xl font-bold text-sky-700">KES ${avgRate.toFixed(2)}</p>
            </div>
        `;
    }

    static renderCompanies(companies) {
        if (companies.length === 0) {
            document.getElementById('companiesContainer').innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-search text-stone-300 text-3xl mb-3"></i>
                    <p class="text-stone-500">No companies match your filters.</p>
                </div>
            `;
            return;
        }

        if (TeaCompanies.currentView === 'cards') {
            TeaCompanies.renderCardView(companies);
        } else {
            TeaCompanies.renderTableView(companies);
        }
    }

    static renderTableView(companies) {
        const rows = companies.map(company => `
            <tr class="hover:bg-stone-50 transition-colors cursor-pointer" onclick="TeaCompanies.showCompanyDetail('${company.id}')">
                <td class="px-4 py-3.5" data-label="Select" onclick="event.stopPropagation()">
                    <input type="checkbox" class="company-checkbox rounded border-stone-300 text-emerald-600 focus:ring-emerald-500" 
                           value="${company.id}" onchange="TeaCompanies.toggleSelect('${company.id}', this.checked)">
                </td>
                <td class="px-4 py-3.5" data-label="Name">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span class="text-indigo-700 font-bold text-sm">${company.name.charAt(0)}</span>
                        </div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">${company.name}</p>
                            <p class="text-xs text-stone-400">Reg: ${company.registration_number || 'N/A'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3.5" data-label="Reg Number">
                    <span class="text-sm text-stone-600">${company.registration_number || '—'}</span>
                </td>
                <td class="px-4 py-3.5" data-label="Buying Rate">
                    <span class="text-sm font-semibold text-emerald-700">KES ${parseFloat(company.buying_rate).toFixed(2)} <span class="text-xs font-normal text-stone-400">/kg</span></span>
                </td>
                <td class="px-4 py-3.5" data-label="Status">
                    <span class="badge ${company.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">
                        ${company.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-4 py-3.5" data-label="Actions" onclick="event.stopPropagation()">
                    <div class="flex items-center gap-1">
                        <button onclick="TeaCompanies.showEditForm('${company.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Edit">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button onclick="TeaCompanies.toggleStatus('${company.id}', ${company.is_active}, '${company.name}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="${company.is_active ? 'Deactivate' : 'Activate'}">
                            <i class="fas ${company.is_active ? 'fa-ban' : 'fa-check'} text-sm"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        document.getElementById('companiesContainer').innerHTML = `
            <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="responsive-table w-full">
                        <thead>
                            <tr class="bg-stone-50/80 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                                <th class="px-4 py-3 w-10"><input type="checkbox" id="selectAllCompanies" onchange="TeaCompanies.toggleSelectAll(this.checked)" class="rounded border-stone-300"></th>
                                <th class="px-4 py-3">Company</th>
                                <th class="px-4 py-3">Reg Number</th>
                                <th class="px-4 py-3">Buying Rate</th>
                                <th class="px-4 py-3">Status</th>
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

    static renderCardView(companies) {
        const cards = companies.map(company => `
            <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 transition-all cursor-pointer" 
                 onclick="TeaCompanies.showCompanyDetail('${company.id}')">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" class="company-checkbox rounded border-stone-300" value="${company.id}" 
                               onchange="TeaCompanies.toggleSelect('${company.id}', this.checked)" onclick="event.stopPropagation()">
                        <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <span class="text-indigo-700 font-bold">${company.name.charAt(0)}</span>
                        </div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">${company.name}</p>
                            <p class="text-xs text-stone-400">Reg: ${company.registration_number || 'N/A'}</p>
                        </div>
                    </div>
                    <span class="badge ${company.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">${company.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div class="flex justify-between items-center pt-3 border-t border-stone-100">
                    <span class="text-lg font-bold text-emerald-700">KES ${parseFloat(company.buying_rate).toFixed(2)}<span class="text-xs font-normal text-stone-400">/kg</span></span>
                    <div class="flex gap-1" onclick="event.stopPropagation()">
                        <button onclick="TeaCompanies.showEditForm('${company.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="TeaCompanies.toggleStatus('${company.id}', ${company.is_active}, '${company.name}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50"><i class="fas ${company.is_active ? 'fa-ban' : 'fa-check'} text-xs"></i></button>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('companiesContainer').innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${cards}
            </div>
        `;
    }

    static async showCompanyDetail(companyId) {
        const company = TeaCompanies.allCompanies.find(c => c.id === companyId);
        if (!company) return;

        // Get company stats from backend (or calculate from local data)
        try {
            const response = await api.get(`/tea/companies/${companyId}/stats`);
            const stats = response.success ? response.stats : { total_kg: 0, revenue: 0 };

            modal.open(`${company.name}`, `
                <div class="space-y-5">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-slate-50 rounded-xl p-4">
                            <p class="text-xs text-stone-500 mb-1">Registration Number</p>
                            <p class="font-semibold text-slate-800">${company.registration_number || 'N/A'}</p>
                        </div>
                        <div class="bg-slate-50 rounded-xl p-4">
                            <p class="text-xs text-stone-500 mb-1">Buying Rate</p>
                            <p class="font-semibold text-emerald-700">KES ${parseFloat(company.buying_rate).toFixed(2)} /kg</p>
                        </div>
                        <div class="bg-slate-50 rounded-xl p-4">
                            <p class="text-xs text-stone-500 mb-1">Total Kg Bought</p>
                            <p class="font-semibold text-slate-800">${(stats.total_kg || 0).toFixed(2)} kg</p>
                        </div>
                        <div class="bg-slate-50 rounded-xl p-4">
                            <p class="text-xs text-stone-500 mb-1">Total Revenue</p>
                            <p class="font-semibold text-emerald-700">KES ${(stats.revenue || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-4">
                        <p class="text-xs text-stone-500 mb-1">Status</p>
                        <span class="badge ${company.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">${company.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
            `, { size: 'max-w-lg', icon: 'fa-building' });
        } catch (error) {
            showToast('Error loading company details', 'error');
        }
    }

    static filterCompanies() {
        const search = document.getElementById('companySearch')?.value || '';
        const status = document.getElementById('companyStatusFilter')?.value || '';
        const sort = document.getElementById('companySort')?.value || 'name';

        let filtered = [...TeaCompanies.allCompanies];

        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter(c => 
                c.name.toLowerCase().includes(s) ||
                (c.registration_number && c.registration_number.toLowerCase().includes(s))
            );
        }

        if (status === 'active') filtered = filtered.filter(c => c.is_active);
        if (status === 'inactive') filtered = filtered.filter(c => !c.is_active);

        if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
        if (sort === 'rate_high') filtered.sort((a, b) => parseFloat(b.buying_rate) - parseFloat(a.buying_rate));
        if (sort === 'rate_low') filtered.sort((a, b) => parseFloat(a.buying_rate) - parseFloat(b.buying_rate));
        if (sort === 'newest') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        TeaCompanies.renderCompanies(filtered);
    }

    static setView(view) {
        TeaCompanies.currentView = view;
        document.getElementById('compTableViewBtn').className = view === 'table' ? 'px-3 py-2.5 bg-emerald-50 text-emerald-700 text-sm' : 'px-3 py-2.5 bg-white text-stone-500 text-sm';
        document.getElementById('compCardViewBtn').className = view === 'cards' ? 'px-3 py-2.5 bg-emerald-50 text-emerald-700 text-sm' : 'px-3 py-2.5 bg-white text-stone-500 text-sm';
        TeaCompanies.filterCompanies();
    }

    static toggleSelect(companyId, checked) {
        if (checked) TeaCompanies.selectedCompanies.add(companyId);
        else TeaCompanies.selectedCompanies.delete(companyId);
    }

    static toggleSelectAll(checked) {
        document.querySelectorAll('.company-checkbox').forEach(cb => {
            cb.checked = checked;
            if (checked) TeaCompanies.selectedCompanies.add(cb.value);
            else TeaCompanies.selectedCompanies.delete(cb.value);
        });
    }

    static async bulkToggleStatus() {
        const action = confirm('Deactivate all selected companies?');
        if (!action) return;
        
        for (const id of TeaCompanies.selectedCompanies) {
            await api.updateCompany(id, { is_active: false });
        }
        TeaCompanies.selectedCompanies.clear();
        showToast('Companies updated', 'success');
        await TeaCompanies.loadCompanies();
    }

    static exportCSV() {
        const headers = ['Name', 'Registration Number', 'Buying Rate (KES/kg)', 'Status'];
        const rows = TeaCompanies.allCompanies.map(c => [
            c.name,
            c.registration_number || '',
            c.buying_rate,
            c.is_active ? 'Active' : 'Inactive'
        ]);
        let csv = headers.join(',') + '\n';
        rows.forEach(row => { csv += row.map(v => `"${v}"`).join(',') + '\n'; });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tea_companies.csv';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Companies exported!', 'success');
    }

    static showAddForm() {
        modal.openForm('Add New Company', `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Company Name *</label>
                    <input type="text" id="companyName" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="e.g., KTDA, Lipton">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Registration Number</label>
                    <input type="text" id="companyRegNumber" 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="Company registration number">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Buying Rate (KES/kg) *</label>
                    <input type="number" id="buyingRate" step="0.01" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="e.g., 45.00">
                </div>
            </div>
        `, async () => {
            const companyData = {
                name: document.getElementById('companyName').value.trim(),
                registration_number: document.getElementById('companyRegNumber').value.trim(),
                buying_rate: parseFloat(document.getElementById('buyingRate').value)
            };

            try {
                const response = await api.createCompany(companyData);
                if (response.success) {
                    modal.close();
                    showToast('Company added successfully!', 'success');
                    await TeaCompanies.loadCompanies();
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }, { submitText: 'Add Company', submitIcon: 'fa-building', icon: 'fa-building' });
    }

    static async showEditForm(companyId) {
        const company = TeaCompanies.allCompanies.find(c => c.id === companyId);
        if (!company) { showToast('Company not found.', 'error'); return; }

        modal.openForm('Edit Company', `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Company Name *</label>
                    <input type="text" id="editCompanyName" value="${company.name}" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Registration Number</label>
                    <input type="text" id="editCompanyRegNumber" value="${company.registration_number || ''}" 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Buying Rate (KES/kg) *</label>
                    <input type="number" id="editBuyingRate" value="${company.buying_rate}" step="0.01" required 
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all">
                </div>
            </div>
        `, async () => {
            const companyData = {
                name: document.getElementById('editCompanyName').value.trim(),
                registration_number: document.getElementById('editCompanyRegNumber').value.trim(),
                buying_rate: parseFloat(document.getElementById('editBuyingRate').value)
            };

            try {
                const response = await api.updateCompany(companyId, companyData);
                if (response.success) {
                    modal.close();
                    showToast('Company updated successfully!', 'success');
                    await TeaCompanies.loadCompanies();
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }, { submitText: 'Update Company', icon: 'fa-building' });
    }

    static async toggleStatus(companyId, currentStatus, companyName) {
        const action = currentStatus ? 'Deactivate' : 'Activate';
        modal.openConfirm(
            `${action} Company`,
            `Are you sure you want to ${action.toLowerCase()} <strong>${companyName}</strong>?`,
            async () => {
                try {
                    const response = await api.updateCompany(companyId, { is_active: !currentStatus });
                    if (response.success) {
                        showToast(`Company ${action}d successfully!`, 'success');
                        await TeaCompanies.loadCompanies();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            },
            { 
                confirmText: action,
                confirmIcon: currentStatus ? 'fa-ban' : 'fa-check',
                confirmClass: currentStatus ? 'bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg shadow-amber-600/20' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/20',
                type: currentStatus ? 'warning' : 'info'
            }
        );
    }
}
