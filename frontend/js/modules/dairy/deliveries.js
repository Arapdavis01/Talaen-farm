// ============================================
// TALAEN FARM - Buyer Deliveries
// ============================================

class DairyDeliveries {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        const user = auth.getCurrentUser();
        const isAdmin = ['farm_owner', 'supervisor'].includes(user.role);
        const isBuyer = user.role === 'milk_buyer';
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Milk Deliveries</h1>
                    <p class="text-gray-500">${isBuyer ? 'View and confirm your deliveries' : 'Manage milk deliveries to buyers'}</p>
                </div>
                ${isAdmin ? `
                    <button onclick="DairyDeliveries.showAddForm()" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                        <i class="fas fa-plus"></i> New Delivery
                    </button>
                ` : ''}
            </div>
            
            <div id="deliveriesTable" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading deliveries...</p>
                </div>
            </div>
        `;

        await DairyDeliveries.loadDeliveries();
    }

    static async loadDeliveries() {
        try {
            const response = await api.getDeliveries();
            
            if (response.success && response.deliveries.length > 0) {
                DairyDeliveries.renderDeliveries(response.deliveries);
            } else {
                document.getElementById('deliveriesTable').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-shipping-fast text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">No deliveries found.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('deliveriesTable').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load deliveries.</p>
                </div>
            `;
        }
    }

    static renderDeliveries(deliveries) {
        const user = auth.getCurrentUser();
        const isBuyer = user.role === 'milk_buyer';

        const rows = deliveries.map(delivery => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4" data-label="Date">
                    ${new Date(delivery.delivery_date).toLocaleDateString()}
                </td>
                <td class="px-6 py-4" data-label="Buyer">
                    <span class="font-medium">${delivery.milk_buyers?.full_name || 'N/A'}</span>
                </td>
                <td class="px-6 py-4" data-label="Assigned">
                    <span class="text-blue-600 font-medium">${parseFloat(delivery.litres_assigned).toFixed(2)} L</span>
                </td>
                <td class="px-6 py-4" data-label="Confirmed">
                    ${delivery.is_confirmed ? 
                        `<span class="text-green-700 font-medium">${parseFloat(delivery.litres_confirmed).toFixed(2)} L</span>` : 
                        '<span class="badge bg-yellow-100 text-yellow-700">Pending</span>'}
                </td>
                <td class="px-6 py-4" data-label="Price/L">
                    ${delivery.price_per_litre ? `KES ${parseFloat(delivery.price_per_litre).toFixed(2)}` : '-'}
                </td>
                <td class="px-6 py-4" data-label="Total">
                    <span class="font-bold text-green-700">KES ${parseFloat(delivery.total_amount).toFixed(2)}</span>
                </td>
                ${isBuyer && !delivery.is_confirmed ? `
                    <td class="px-6 py-4" data-label="Action">
                        <button onclick="DairyDeliveries.showConfirmForm('${delivery.id}', ${delivery.litres_assigned})" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm transition-colors">
                            <i class="fas fa-check mr-1"></i>Confirm
                        </button>
                    </td>
                ` : '<td class="px-6 py-4">-</td>'}
            </tr>
        `).join('');

        document.getElementById('deliveriesTable').innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3">Date</th>
                            <th class="px-6 py-3">Buyer</th>
                            <th class="px-6 py-3">Assigned</th>
                            <th class="px-6 py-3">Confirmed</th>
                            <th class="px-6 py-3">Price/L</th>
                            <th class="px-6 py-3">Total</th>
                            ${isBuyer ? '<th class="px-6 py-3">Action</th>' : ''}
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

            modal.openForm('New Delivery', `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Buyer *</label>
                    <select id="deliveryBuyer" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                        <option value="">Select Buyer</option>
                        ${activeBuyers.map(b => `<option value="${b.id}">${b.full_name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" id="deliveryDate" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Litres Assigned *</label>
                    <input type="number" id="deliveryLitres" step="0.01" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Price per Litre (KES) *</label>
                    <input type="number" id="deliveryPrice" step="0.01" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                    <p class="text-sm text-gray-600">Total Amount: <span id="deliveryTotal" class="font-bold text-green-700">KES 0.00</span></p>
                </div>
            `, async (e) => {
                const deliveryData = {
                    buyer_id: document.getElementById('deliveryBuyer').value,
                    delivery_date: document.getElementById('deliveryDate').value,
                    litres_assigned: parseFloat(document.getElementById('deliveryLitres').value),
                    price_per_litre: parseFloat(document.getElementById('deliveryPrice').value)
                };

                try {
                    const response = await api.createDelivery(deliveryData);
                    if (response.success) {
                        modal.close();
                        showToast('Delivery recorded successfully!', 'success');
                        await DairyDeliveries.loadDeliveries();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            });

            // Live total calculation
            const updateTotal = () => {
                const litres = parseFloat(document.getElementById('deliveryLitres')?.value) || 0;
                const price = parseFloat(document.getElementById('deliveryPrice')?.value) || 0;
                const total = litres * price;
                const totalSpan = document.getElementById('deliveryTotal');
                if (totalSpan) {
                    totalSpan.textContent = `KES ${total.toFixed(2)}`;
                }
            };

            document.getElementById('deliveryLitres')?.addEventListener('input', updateTotal);
            document.getElementById('deliveryPrice')?.addEventListener('input', updateTotal);
        } catch (error) {
            showToast('Error loading form data.', 'error');
        }
    }

    static showConfirmForm(deliveryId, assignedLitres) {
        modal.openForm('Confirm Delivery', `
            <p class="text-gray-600 mb-4">Assigned litres: <strong>${assignedLitres.toFixed(2)} L</strong></p>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Actual Litres Received *</label>
                <input type="number" id="confirmedLitres" step="0.01" value="${assignedLitres}" required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
        `, async (e) => {
            const litresConfirmed = parseFloat(document.getElementById('confirmedLitres').value);

            try {
                const response = await api.confirmDelivery(deliveryId, litresConfirmed);
                if (response.success) {
                    modal.close();
                    showToast('Delivery confirmed successfully!', 'success');
                    await DairyDeliveries.loadDeliveries();
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }, { submitText: 'Confirm Delivery' });
    }
}
