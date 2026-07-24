// ============================================
// TALAEN FARM - Milk Buyers Management
// ============================================

class DairyBuyers {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Milk Buyers</h1>
                    <p class="text-gray-500">Manage milk buyers and their accounts</p>
                </div>
                <button onclick="DairyBuyers.showAddForm()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                    <i class="fas fa-plus"></i> Add Buyer
                </button>
            </div>
            <div id="buyersTable" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading buyers...</p>
                </div>
            </div>
        `;

        await DairyBuyers.loadBuyers();
    }

    static async loadBuyers() {
        try {
            const response = await api.getMilkBuyers();
            
            if (response.success && response.buyers.length > 0) {
                DairyBuyers.renderBuyersTable(response.buyers);
            } else {
                document.getElementById('buyersTable').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-user-tie text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500 mb-4">No milk buyers added yet.</p>
                        <button onclick="DairyBuyers.showAddForm()" 
                            class="text-green-600 hover:text-green-700 font-medium">
                            <i class="fas fa-plus mr-1"></i> Add your first buyer
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('buyersTable').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load buyers.</p>
                </div>
            `;
        }
    }

    static renderBuyersTable(buyers) {
        const rows = buyers.map(buyer => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4" data-label="Name">
                    <div class="font-medium text-gray-800">${buyer.full_name}</div>
                </td>
                <td class="px-6 py-4" data-label="Phone">
                    <span class="text-gray-600">${buyer.phone || 'N/A'}</span>
                </td>
                <td class="px-6 py-4" data-label="Account">
                    ${buyer.users ? 
                        '<span class="badge bg-green-100 text-green-700"><i class="fas fa-check-circle mr-1"></i>Login Enabled</span>' : 
                        '<span class="badge bg-gray-100 text-gray-600"><i class="fas fa-minus-circle mr-1"></i>No Login</span>'}
                </td>
                <td class="px-6 py-4" data-label="Status">
                    <span class="badge ${buyer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${buyer.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4" data-label="Actions">
                    <button onclick="DairyBuyers.showEditForm('${buyer.id}')" 
                        class="text-blue-600 hover:text-blue-800" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        document.getElementById('buyersTable').innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3">Name</th>
                            <th class="px-6 py-3">Phone</th>
                            <th class="px-6 py-3">Account</th>
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
        modal.openForm('Add Milk Buyer', `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" id="buyerName" required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" id="buyerPhone" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Login Account</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm text-gray-600 mb-1">Username</label>
                        <input type="text" id="buyerUsername" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-600 mb-1">Password</label>
                        <input type="password" id="buyerPassword" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    </div>
                </div>
            </div>
        `, async (e) => {
            const buyerData = {
                full_name: document.getElementById('buyerName').value,
                phone: document.getElementById('buyerPhone').value,
                username: document.getElementById('buyerUsername').value,
                password: document.getElementById('buyerPassword').value
            };

            try {
                const response = await api.createMilkBuyer(buyerData);
                if (response.success) {
                    modal.close();
                    showToast('Buyer added successfully!', 'success');
                    await DairyBuyers.loadBuyers();
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    static async showEditForm(buyerId) {
        try {
            const response = await api.getMilkBuyers();
            const buyer = response.buyers.find(b => b.id === buyerId);
            
            if (!buyer) {
                showToast('Buyer not found.', 'error');
                return;
            }

            modal.openForm('Edit Milk Buyer', `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" id="editBuyerName" value="${buyer.full_name}" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" id="editBuyerPhone" value="${buyer.phone || ''}" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
            `, async (e) => {
                const buyerData = {
                    full_name: document.getElementById('editBuyerName').value,
                    phone: document.getElementById('editBuyerPhone').value
                };

                try {
                    const response = await api.updateMilkBuyer(buyerId, buyerData);
                    if (response.success) {
                        modal.close();
                        showToast('Buyer updated successfully!', 'success');
                        await DairyBuyers.loadBuyers();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }, { submitText: 'Update' });
        } catch (error) {
            showToast('Error loading buyer details.', 'error');
        }
    }
}
