// ============================================
// TALAEN FARM - Pay Dairy Worker
// ============================================

class DairyPayWorker {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Pay Dairy Worker</h1>
                <p class="text-gray-500">Process salary payments for dairy workers</p>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 class="font-semibold text-gray-800 mb-4">Select Worker</h3>
                    <div id="dairyWorkerList" class="space-y-2 max-h-96 overflow-y-auto">
                        <div class="text-center py-4">
                            <div class="spinner mx-auto"></div>
                        </div>
                    </div>
                </div>
                
                <div id="paymentForm" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="text-center py-12 text-gray-500">
                        <i class="fas fa-hand-holding-usd text-gray-300 text-5xl mb-4"></i>
                        <p>Select a worker to process payment.</p>
                    </div>
                </div>
            </div>
            
            <div class="mt-8">
                <h3 class="font-semibold text-gray-800 mb-4">Recent Payments</h3>
                <div id="recentPayments" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="text-center py-8">
                        <div class="spinner mx-auto"></div>
                        <p class="text-gray-500 mt-3">Loading payments...</p>
                    </div>
                </div>
            </div>
        `;

        await Promise.all([
            DairyPayWorker.loadWorkers(),
            DairyPayWorker.loadRecentPayments()
        ]);
    }

    static async loadWorkers() {
        try {
            const response = await api.getDairyWorkers();
            
            if (response.success && response.workers.length > 0) {
                const workersHtml = response.workers
                    .filter(w => w.is_active)
                    .map(worker => `
                        <div class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                             onclick="DairyPayWorker.selectWorker('${worker.id}', '${worker.full_name}', ${worker.monthly_salary})">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-user text-blue-600"></i>
                                </div>
                                <div>
                                    <p class="font-medium text-gray-800">${worker.full_name}</p>
                                    <p class="text-xs text-gray-500">Monthly: KES ${parseFloat(worker.monthly_salary).toFixed(2)}</p>
                                </div>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400"></i>
                        </div>
                    `).join('');

                document.getElementById('dairyWorkerList').innerHTML = workersHtml;
            } else {
                document.getElementById('dairyWorkerList').innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-gray-500">No active workers found.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('dairyWorkerList').innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500">Failed to load workers.</p>
                </div>
            `;
        }
    }

    static selectWorker(workerId, workerName, monthlySalary) {
        document.getElementById('paymentForm').innerHTML = `
            <h3 class="font-semibold text-gray-800 mb-4">Pay ${workerName}</h3>
            <form id="dairyPaymentForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                    <input type="number" id="paymentAmount" step="0.01" value="${monthlySalary}" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    <p class="text-xs text-gray-400 mt-1">Default monthly salary. You can adjust this amount.</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Payment Period</label>
                    <input type="text" id="paymentPeriod" placeholder="e.g., January 2024" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea id="paymentNotes" rows="2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"></textarea>
                </div>
                <button type="submit" 
                    class="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg transition-colors font-medium">
                    <i class="fas fa-check-circle mr-2"></i>Process Payment
                </button>
            </form>
        `;

        document.getElementById('dairyPaymentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const paymentData = {
                worker_id: workerId,
                amount: parseFloat(document.getElementById('paymentAmount').value),
                payment_period: document.getElementById('paymentPeriod').value,
                notes: document.getElementById('paymentNotes').value
            };

            try {
                const response = await api.payDairyWorker(paymentData);
                if (response.success) {
                    showToast(response.message, 'success');
                    document.getElementById('paymentForm').innerHTML = `
                        <div class="text-center py-8">
                            <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
                            <p class="text-green-600 font-medium">Payment processed successfully!</p>
                            <p class="text-gray-500 text-sm mt-1">KES ${paymentData.amount.toFixed(2)} paid to ${workerName}</p>
                        </div>
                    `;
                    await DairyPayWorker.loadRecentPayments();
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    static async loadRecentPayments() {
        try {
            const response = await api.getDairyPayments();
            
            if (response.success && response.payments.length > 0) {
                const rows = response.payments.slice(0, 10).map(payment => `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-6 py-4" data-label="Date">
                            ${new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td class="px-6 py-4" data-label="Worker">
                            ${payment.dairy_workers?.full_name || 'N/A'}
                        </td>
                        <td class="px-6 py-4" data-label="Amount">
                            <span class="font-medium text-green-700">KES ${parseFloat(payment.amount).toFixed(2)}</span>
                        </td>
                        <td class="px-6 py-4" data-label="Period">
                            ${payment.payment_period || '-'}
                        </td>
                    </tr>
                `).join('');

                document.getElementById('recentPayments').innerHTML = `
                    <div class="overflow-x-auto">
                        <table class="responsive-table w-full">
                            <thead>
                                <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    <th class="px-6 py-3">Date</th>
                                    <th class="px-6 py-3">Worker</th>
                                    <th class="px-6 py-3">Amount</th>
                                    <th class="px-6 py-3">Period</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                document.getElementById('recentPayments').innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-receipt text-gray-300 text-4xl mb-3"></i>
                        <p class="text-gray-500">No payments made yet.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('recentPayments').innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500">Failed to load payments.</p>
                </div>
            `;
        }
    }
}
