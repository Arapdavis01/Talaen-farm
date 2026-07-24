// ============================================
// TALAEN FARM - Companies Management
// ============================================

class TeaCompanies {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Tea Buying Companies</h1>
                    <p class="text-gray-500">Manage companies that buy tea from the farm</p>
                </div>
                <button onclick="TeaCompanies.showAddForm()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                    <i class="fas fa-plus"></i> Add Company
                </button>
            </div>
            <div id="companiesTableContainer" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading companies...</p>
                </div>
            </div>
        `;

        await TeaCompanies.loadCompanies();
    }

    static async loadCompanies() {
        try {
            const response = await api.getCompanies();
            
            if (response.success && response.companies.length > 0) {
                TeaCompanies.renderCompaniesTable(response.companies);
            } else {
                document.getElementById('companiesTableContainer').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-building text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500 mb-4">No companies added yet.</p>
                        <button onclick="TeaCompanies.showAddForm()" 
                            class="text-green-600 hover:text-green-700 font-medium">
                            <i class="fas fa-plus mr-1"></i> Add your first company
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('companiesTableContainer').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load companies.</p>
                </div>
            `;
        }
    }

    static renderCompaniesTable(companies) {
        const rows = companies.map(company => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4" data-label="Name">
                    <div class="font-medium text-gray-800">${company.name}</div>
                </td>
                <td class="px-6 py-4" data-label="Buying Rate">
                    <span class="text-green-700 font-medium">KES ${parseFloat(company.buying_rate).toFixed(2)} / kg</span>
                </td>
                <td class="px-6 py-4" data-label="Phone">
                    <span class="text-gray-600">${company.phone || 'N/A'}</span>
                </td>
                <td class="px-6 py-4" data-label="Status">
                    <span class="badge ${company.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${company.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4" data-label="Actions">
                    <button onclick="TeaCompanies.showEditForm('${company.id}')" 
                        class="text-blue-600 hover:text-blue-800" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        document.getElementById('companiesTableContainer').innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3">Name</th>
                            <th class="px-6 py-3">Buying Rate</th>
                            <th class="px-6 py-3">Phone</th>
                            <th class="px-6 py-3">Status</th>
                            <th class="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    static showAddForm() {
        modal.openForm('Add New Company', `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input type="text" id="companyName" required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Buying Rate (KES/kg) *</label>
                <input type="number" id="buyingRate" step="0.01" required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" id="companyPhone" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
        `, async (e) => {
            const companyData = {
                name: document.getElementById('companyName').value,
                buying_rate: parseFloat(document.getElementById('buyingRate').value),
                phone: document.getElementById('companyPhone').value
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
        });
    }

    static async showEditForm(companyId) {
        try {
            const response = await api.getCompanies();
            const company = response.companies.find(c => c.id === companyId);
            
            if (!company) {
                showToast('Company not found.', 'error');
                return;
            }

            modal.openForm('Edit Company', `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input type="text" id="editCompanyName" value="${company.name}" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Buying Rate (KES/kg) *</label>
                    <input type="number" id="editBuyingRate" value="${company.buying_rate}" step="0.01" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" id="editCompanyPhone" value="${company.phone || ''}" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
            `, async (e) => {
                const companyData = {
                    name: document.getElementById('editCompanyName').value,
                    buying_rate: parseFloat(document.getElementById('editBuyingRate').value),
                    phone: document.getElementById('editCompanyPhone').value
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
            }, { submitText: 'Update' });
        } catch (error) {
            showToast('Error loading company details.', 'error');
        }
    }
}
