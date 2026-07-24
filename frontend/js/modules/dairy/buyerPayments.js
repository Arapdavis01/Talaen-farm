// ============================================
// TALAEN FARM - Buyer Payments
// ============================================

class DairyBuyerPayments {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        const user = auth.getCurrentUser();
        const isBuyer = user.role === 'milk_buyer';
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Buyer Payments</h1>
                    <p class="text-gray-500">${isBuyer ? 'Record your payments to the farm' : 'View buyer payment records'}</p>
                </div>
                <button onclick="DairyBuyerPayments.showAddForm()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                    <i class="fas fa-plus"></i> Record Payment
                </button>
            </div>
            
            <div id="buyerPaymentsTable" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading payments...</p>
                </div>
            </div>
        `;

        await DairyBuyerPayments.loadPayments();
    }

    static async loadPayments() {
        try {
            const response = await api.getBuyerPayments();
            
            if (response.success && response.payments.length > 0) {
                DairyBuyerPayments.renderPayments(response.payments);
            } else {
                document.getElementById('buyerPaymentsTable').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-receipt text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">No payment records found.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('buyerPaymentsTable').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load payments.</p>
                </div>
            `;
        }
    }

    static renderPayments(payments) {
        const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

        const rows = payments.map(payment => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4" data-label="Date">
                    ${new Date(payment.payment_date).toLocaleDateString()}
                </td>
                <td class="px-6 py-4" data-label="Buyer">
                    <span class="font-medium">${payment.milk_buyers?.full_name || 'N/A'}</span>
                </td>
                <td class="px-6 py-4" data-label="Amount">
                    <span class="font-bold text-green-700">KES ${parseFloat(payment.amount).toFixed(2)}</span>
                </td>
                <td class="px-6 py-4" data-label="Period">
                    ${payment.period_covered || '-'}
                </td>
                <td class="px-6 py-4" data-label="Notes">
                    ${payment.notes || '-'}
                </td>
            </tr>
        `).join('');

        document.getElementById('buyerPaymentsTable').innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3">Date</th>
                            <th class="px-6 py-3">Buyer</th>
                            <th class="px-6 py-3">Amount</th>
                            <th class="px-6 py-3">Period</th>
                            <th class="px-6 py-3">Notes</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${rows}
                    </tbody>
                    <tfoot class="bg-green-50 font-semibold">
                        <tr>
                            <td class="px-6 py-3" colspan="2">Total Received</td>
                            <td class="px-6 py-3 text-green-700 text-lg">KES ${totalPaid.toFixed(2)}</td>
                            <td class="px-6 py-3" colspan="2"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    static async showAddForm() {
        try {
            const user = auth.getCurrentUser();
            const isBuyer = user.role === 'milk_buyer';
            
            let buyersRes = null;
            if (!isBuyer) {
                buyersRes = await api.getMilkBuyers();
            }

            modal.openForm('Record Buyer Payment', `
                ${!isBuyer ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Buyer *</label>
                        <select id="paymentBuyer" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                            <option value="">Select Buyer</option>
                            ${buyersRes.buyers.filter(b => b.is_active).map(b => `<option value="${b.id}">${b.full_name}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                    <input type="number" id="paymentAmount" step="0.01" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Period Covered</label>
                    <input type="text" id="paymentPeriod" placeholder="e.g., January 1-15, 2024" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea id="paymentNotes" rows="2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"></textarea>
                </div>
            `, async (e) => {
                const paymentData = {
                    amount: parseFloat(document.getElementById('paymentAmount').value),
                    period_covered: document.getElementById('paymentPeriod').value,
                    notes: document.getElementById('paymentNotes').value
                };

                if (!isBuyer) {
                    paymentData.buyer_id = document.getElementById('paymentBuyer').value;
                }

                try {
                    const response = await api.recordBuyerPayment(paymentData);
                    if (response.success) {
                        modal.close();
                        showToast(response.message, 'success');
                        await DairyBuyerPayments.loadPayments();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            });
        } catch (error) {
            showToast('Error loading form data.', 'error');
        }
    }
}
