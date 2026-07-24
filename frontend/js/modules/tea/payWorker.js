// ============================================
// TALAEN FARM - Pay Tea Worker
// ============================================

class TeaPayWorker {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Pay Worker</h1>
                <p class="text-gray-500">Calculate and process worker payments</p>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 class="font-semibold text-gray-800 mb-4">Select Worker</h3>
                    <div id="workerList" class="space-y-2 max-h-96 overflow-y-auto">
                        <div class="text-center py-4">
                            <div class="spinner mx-auto"></div>
                        </div>
                    </div>
                </div>
                
                <div id="paymentPreview" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="text-center py-12 text-gray-500">
                        <i class="fas fa-hand-holding-usd text-gray-300 text-5xl mb-4"></i>
                        <p>Select a worker to preview payment.</p>
                    </div>
                </div>
            </div>
        `;

        await TeaPayWorker.loadWorkers();
    }

    static async loadWorkers() {
        try {
            const [workersRes, wageRes] = await Promise.all([
                api.getTeaWorkers(),
                api.getWageRate()
            ]);

            if (!wageRes.wage_rate) {
                document.getElementById('workerList').innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-exclamation-triangle text-yellow-500 text-3xl mb-3"></i>
                        <p class="text-red-500">No wage rate set. Please set wage rate first.</p>
                    </div>
                `;
                return;
            }

            if (workersRes.success && workersRes.workers.length > 0) {
                const workersHtml = workersRes.workers
                    .filter(w => w.is_active)
                    .map(worker => `
                        <div class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                             onclick="TeaPayWorker.selectWorker('${worker.id}', '${worker.full_name}', ${worker.total_debt || 0})">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-user text-green-600"></i>
                                </div>
                                <div>
                                    <p class="font-medium text-gray-800">${worker.full_name}</p>
                                    <p class="text-xs text-gray-500">Debt: KES ${parseFloat(worker.total_debt || 0).toFixed(2)}</p>
                                </div>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400"></i>
                        </div>
                    `).join('');

                document.getElementById('workerList').innerHTML = workersHtml;
            } else {
                document.getElementById('workerList').innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-gray-500">No active workers found.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('workerList').innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500">Failed to load workers.</p>
                </div>
            `;
        }
    }

    static async selectWorker(workerId, workerName, currentDebt) {
        const previewDiv = document.getElementById('paymentPreview');
        
        previewDiv.innerHTML = `
            <div class="text-center py-8">
                <div class="spinner mx-auto"></div>
                <p class="text-gray-500 mt-3">Calculating payment...</p>
            </div>
        `;

        try {
            // Get unsettled verified plucking
            const pluckingRes = await api.getVerifiedPlucking(workerId);
            const unsettledKg = pluckingRes.records
                .filter(r => !r.is_settled)
                .reduce((sum, r) => sum + parseFloat(r.weight_kg), 0);

            // Get wage rate
            const wageRes = await api.getWageRate();
            const ratePerKg = parseFloat(wageRes.wage_rate.rate_per_kg);

            // Get unsettled debts
            const debtsRes = await api.getDebts(workerId);
            const totalDebt = debtsRes.debts
                .filter(d => !d.is_settled && !d.is_reversed)
                .reduce((sum, d) => sum + parseFloat(d.amount), 0);

            const grossPay = unsettledKg * ratePerKg;
            const netPay = grossPay - totalDebt;

            previewDiv.innerHTML = `
                <h3 class="font-semibold text-gray-800 mb-4">Payment Preview - ${workerName}</h3>
                
                <div class="space-y-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex justify-between mb-2">
                            <span class="text-gray-600">Unsettled Kg:</span>
                            <span class="font-medium">${unsettledKg.toFixed(2)} kg</span>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span class="text-gray-600">Rate per Kg:</span>
                            <span class="font-medium">KES ${ratePerKg.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between pt-2 border-t">
                            <span class="text-gray-800 font-medium">Gross Pay:</span>
                            <span class="font-bold text-green-600">KES ${grossPay.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="bg-red-50 rounded-lg p-4">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Total Unsettled Debt:</span>
                            <span class="font-bold text-red-600">KES ${totalDebt.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 rounded-lg p-4">
                        <div class="flex justify-between">
                            <span class="text-gray-800 font-medium">Net Pay:</span>
                            <span class="text-xl font-bold ${netPay > 0 ? 'text-green-600' : 'text-red-600'}">
                                KES ${netPay > 0 ? netPay.toFixed(2) : '0.00'}
                            </span>
                        </div>
                        ${netPay <= 0 ? `
                            <p class="text-sm text-red-500 mt-2">
                                <i class="fas fa-exclamation-circle mr-1"></i>
                                Gross pay fully offset by debts. Remaining debt carries forward.
                            </p>
                        ` : ''}
                    </div>
                    
                    <button onclick="TeaPayWorker.processPayment('${workerId}')" 
                        class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors font-medium">
                        <i class="fas fa-check-circle mr-2"></i>
                        ${netPay > 0 ? `Pay KES ${netPay.toFixed(2)}` : 'Settle (No Cash Payment)'}
                    </button>
                </div>
            `;
        } catch (error) {
            previewDiv.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to calculate payment.</p>
                </div>
            `;
        }
    }

    static async processPayment(workerId) {
        modal.openConfirm(
            'Confirm Payment',
            'Are you sure you want to process this payment? This will settle all verified plucking records.',
            async () => {
                try {
                    const response = await api.payWorker(workerId);
                    if (response.success) {
                        showToast(response.settlement.message, 'success');
                        await TeaPayWorker.show();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            },
            { confirmText: 'Process Payment', confirmClass: 'bg-green-600 hover:bg-green-700' }
        );
    }
}
