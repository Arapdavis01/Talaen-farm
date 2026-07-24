// ============================================
// TALAEN FARM - Pay Store
// ============================================

class TeaPayStore {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Pay Store</h1>
                <p class="text-gray-500">Settle all outstanding store debts across all workers</p>
            </div>
            
            <div id="storeDebtSummary" class="max-w-2xl mx-auto">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading store debt summary...</p>
                </div>
            </div>
        `;

        await TeaPayStore.loadStoreSummary();
    }

    static async loadStoreSummary() {
        try {
            // Get all debts
            const response = await api.getDebts();
            
            if (response.success) {
                const unsettledDebts = response.debts.filter(d => !d.is_settled && !d.is_reversed);
                const totalStoreDebt = unsettledDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

                // Group by worker
                const workerDebts = {};
                unsettledDebts.forEach(debt => {
                    const workerName = debt.tea_workers?.full_name || 'Unknown';
                    if (!workerDebts[workerName]) {
                        workerDebts[workerName] = 0;
                    }
                    workerDebts[workerName] += parseFloat(debt.amount);
                });

                const workerBreakdown = Object.entries(workerDebts)
                    .map(([name, amount]) => `
                        <div class="flex justify-between py-2 border-b border-gray-100">
                            <span class="text-gray-600">${name}</span>
                            <span class="font-medium text-red-600">KES ${amount.toFixed(2)}</span>
                        </div>
                    `).join('');

                document.getElementById('storeDebtSummary').innerHTML = `
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div class="text-center mb-6">
                            <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-store text-red-600 text-3xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800 mb-1">Total Store Debt</h3>
                            <p class="text-4xl font-bold text-red-600">KES ${totalStoreDebt.toFixed(2)}</p>
                        </div>
                        
                        ${Object.keys(workerDebts).length > 0 ? `
                            <div class="mb-6">
                                <h4 class="font-semibold text-gray-700 mb-3">Breakdown by Worker</h4>
                                ${workerBreakdown}
                            </div>
                        ` : ''}
                        
                        <button onclick="TeaPayStore.processStorePayment()" 
                            class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            ${totalStoreDebt === 0 ? 'disabled' : ''}>
                            <i class="fas fa-check-circle mr-2"></i>
                            ${totalStoreDebt > 0 ? `Pay Store - KES ${totalStoreDebt.toFixed(2)}` : 'No Outstanding Debts'}
                        </button>
                        
                        ${totalStoreDebt === 0 ? `
                            <p class="text-center text-green-600 mt-3 text-sm">
                                <i class="fas fa-check-circle mr-1"></i>All debts are settled!
                            </p>
                        ` : ''}
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('storeDebtSummary').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load store summary.</p>
                </div>
            `;
        }
    }

    static async processStorePayment() {
        modal.openConfirm(
            'Pay Store',
            'This will settle all outstanding debts across all workers. Are you sure?',
            async () => {
                try {
                    const response = await api.payStore();
                    if (response.success) {
                        showToast(response.message, 'success');
                        await TeaPayStore.loadStoreSummary();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            },
            { 
                confirmText: 'Pay Store', 
                confirmClass: 'bg-green-600 hover:bg-green-700' 
            }
        );
    }
}
