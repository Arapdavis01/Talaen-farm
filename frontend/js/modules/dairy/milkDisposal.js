// ============================================
// TALAEN FARM - Milk Disposal Records
// ============================================

class DairyMilkDisposal {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Milk Disposal</h1>
                    <p class="text-gray-500">Record how milk is used (sales, home use, etc.)</p>
                </div>
                <button onclick="DairyMilkDisposal.showAddForm()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                    <i class="fas fa-plus"></i> Record Disposal
                </button>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
                        <input type="date" id="disposalDateFilter" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            onchange="DairyMilkDisposal.loadRecords()">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
                        <select id="disposalTypeFilter" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            onchange="DairyMilkDisposal.loadRecords()">
                            <option value="">All Types</option>
                            <option value="sale">Sale</option>
                            <option value="home_use">Home Use</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div id="disposalRecords" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading records...</p>
                </div>
            </div>
        `;

        await DairyMilkDisposal.loadRecords();
    }

    static async loadRecords() {
        try {
            const params = {};
            const dateFilter = document.getElementById('disposalDateFilter')?.value;
            const typeFilter = document.getElementById('disposalTypeFilter')?.value;
            
            if (dateFilter) params.date = dateFilter;
            if (typeFilter) params.type = typeFilter;
            
            const response = await api.getMilkDisposal(params);
            
            if (response.success && response.records.length > 0) {
                DairyMilkDisposal.renderRecords(response.records);
            } else {
                document.getElementById('disposalRecords').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-truck text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">No disposal records found.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('disposalRecords').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load records.</p>
                </div>
            `;
        }
    }

    static renderRecords(records) {
        const getTypeBadge = (type) => {
            const types = {
                'sale': 'bg-blue-100 text-blue-700',
                'home_use': 'bg-green-100 text-green-700',
                'other': 'bg-gray-100 text-gray-700'
            };
            const labels = {
                'sale': 'Sale',
                'home_use': 'Home Use',
                'other': 'Other'
            };
            return `<span class="badge ${types[type]}">${labels[type]}</span>`;
        };

        const rows = records.map(record => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4" data-label="Date">
                    ${new Date(record.disposal_date).toLocaleDateString()}
                </td>
                <td class="px-6 py-4" data-label="Type">
                    ${getTypeBadge(record.disposal_type)}
                </td>
                <td class="px-6 py-4" data-label="Litres">
                    <span class="font-medium">${parseFloat(record.litres).toFixed(2)} L</span>
                </td>
                <td class="px-6 py-4" data-label="Buyer">
                    ${record.milk_buyers?.full_name || '-'}
                </td>
                <td class="px-6 py-4" data-label="Price/L">
                    ${record.price_per_litre ? `KES ${parseFloat(record.price_per_litre).toFixed(2)}` : '-'}
                </td>
                <td class="px-6 py-4" data-label="Total">
                    ${record.total_amount ? `<span class="font-bold text-green-700">KES ${parseFloat(record.total_amount).toFixed(2)}</span>` : '-'}
                </td>
            </tr>
        `).join('');

        document.getElementById('disposalRecords').innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3">Date</th>
                            <th class="px-6 py-3">Type</th>
                            <th class="px-6 py-3">Litres</th>
                            <th class="px-6 py-3">Buyer</th>
                            <th class="px-6 py-3">Price/L</th>
                            <th class="px-6 py-3">Total</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    static async showAddForm() {
        try {
            const buyersRes = await api.getMilkBuyers();
            const activeBuyers = buyersRes.buyers.filter(b => b.is_active);

            modal.openForm('Record Milk Disposal', `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" id="disposalDate" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Disposal Type *</label>
                    <select id="disposalType" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        onchange="DairyMilkDisposal.toggleBuyerField()">
                        <option value="">Select Type</option>
                        <option value="sale">Sale</option>
                        <option value="home_use">Home Use</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div id="buyerField" class="hidden">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Buyer *</label>
                    <select id="disposalBuyer" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                        <option value="">Select Buyer</option>
                        ${activeBuyers.map(b => `<option value="${b.id}">${b.full_name}</option>`).join('')}
                    </select>
                </div>
                <div id="priceField" class="hidden">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Price per Litre (KES)</label>
                    <input type="number" id="pricePerLitre" step="0.01" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Litres *</label>
                    <input type="number" id="disposalLitres" step="0.01" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea id="disposalNotes" rows="2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"></textarea>
                </div>
            `, async (e) => {
                const disposalType = document.getElementById('disposalType').value;
                const disposalData = {
                    disposal_date: document.getElementById('disposalDate').value,
                    disposal_type: disposalType,
                    litres: parseFloat(document.getElementById('disposalLitres').value),
                    notes: document.getElementById('disposalNotes').value
                };

                if (disposalType === 'sale') {
                    disposalData.buyer_id = document.getElementById('disposalBuyer').value;
                    disposalData.price_per_litre = parseFloat(document.getElementById('pricePerLitre').value) || 0;
                }

                try {
                    const response = await api.recordMilkDisposal(disposalData);
                    if (response.success) {
                        modal.close();
                        showToast('Disposal recorded successfully!', 'success');
                        await DairyMilkDisposal.loadRecords();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            });

            // Add change handler for disposal type
            document.getElementById('disposalType').addEventListener('change', DairyMilkDisposal.toggleBuyerField);
        } catch (error) {
            showToast('Error loading form data.', 'error');
        }
    }

    static toggleBuyerField() {
        const type = document.getElementById('disposalType')?.value;
        const buyerField = document.getElementById('buyerField');
        const priceField = document.getElementById('priceField');
        
        if (type === 'sale') {
            buyerField?.classList.remove('hidden');
            priceField?.classList.remove('hidden');
        } else {
            buyerField?.classList.add('hidden');
            priceField?.classList.add('hidden');
        }
    }
}
