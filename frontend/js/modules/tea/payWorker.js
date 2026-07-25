// ============================================
// TALAEN FARM - Pay Tea Worker (Approval-Aware)
// ============================================

class TeaPayWorker {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Pay Worker</h1>
                <p class="text-stone-500 text-sm mt-1">Calculate and process worker payments (approved records only)</p>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                    <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-users text-emerald-500"></i> Select Worker
                    </h3>
                    <div id="workerList" class="space-y-2 max-h-96 overflow-y-auto">
                        <div class="text-center py-4">
                            <div class="spinner mx-auto"></div>
                            <p class="text-stone-500 mt-2 text-sm">Loading workers...</p>
                        </div>
                    </div>
                </div>
                
                <div id="paymentPreview" class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                    <div class="text-center py-12 text-stone-400">
                        <div class="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-hand-holding-dollar text-stone-300 text-2xl"></i>
                        </div>
                        <p class="font-medium">Select a worker to preview payment.</p>
                        <p class="text-xs mt-1">Only approved records are included in calculations.</p>
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
                        <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-exclamation-triangle text-amber-500"></i>
                        </div>
                        <p class="text-amber-700 font-medium">No wage rate set.</p>
                        <p class="text-stone-400 text-sm mt-1">Please set wage rate first.</p>
                    </div>
                `;
                return;
            }

            if (workersRes.success && workersRes.workers.length > 0) {
                // Get verified plucking to show approval status per worker
                const verifiedRes = await api.getVerifiedPlucking();
                const verifiedRecords = verifiedRes.success ? verifiedRes.records : [];

                const workersHtml = workersRes.workers
                    .filter(w => w.is_active)
                    .map(worker => {
                        const workerRecords = verifiedRecords.filter(r => r.worker_id === worker.id && !r.is_settled);
                        const approvedKg = workerRecords
                            .filter(r => r.is_approved)
                            .reduce((sum, r) => sum + parseFloat(r.approved_kg || r.weight_kg), 0);
                        const disputedCount = workerRecords.filter(r => r.approval_status === 'disputed').length;
                        const pendingCount = workerRecords.filter(r => r.approval_status === 'pending').length;

                        return `
                            <div class="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-all"
                                 onclick="TeaPayWorker.selectWorker('${worker.id}', '${worker.full_name}', ${worker.total_debt || 0})">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <span class="text-emerald-700 font-bold text-sm">${worker.full_name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p class="font-medium text-slate-800 text-sm">${worker.full_name}</p>
                                        <div class="flex items-center gap-2 mt-0.5">
                                            <span class="text-xs text-stone-400">Debt: KES ${parseFloat(worker.total_debt || 0).toFixed(2)}</span>
                                            ${approvedKg > 0 ? `<span class="text-xs text-emerald-600 font-medium">• ${approvedKg.toFixed(1)} kg ready</span>` : ''}
                                            ${disputedCount > 0 ? `<span class="text-xs text-amber-600 font-medium">• ${disputedCount} disputed</span>` : ''}
                                        </div>
                                    </div>
                                </div>
                                <i class="fas fa-chevron-right text-stone-300 text-sm"></i>
                            </div>
                        `;
                    }).join('');

                document.getElementById('workerList').innerHTML = workersHtml;
            } else {
                document.getElementById('workerList').innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-stone-500">No active workers found.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('workerList').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-xl mb-2"></i>
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
                <p class="text-stone-500 mt-3">Calculating payment...</p>
            </div>
        `;

        try {
            // Get verified plucking for this worker
            const pluckingRes = await api.getVerifiedPlucking(workerId);
            const allRecords = pluckingRes.records.filter(r => !r.is_settled);
            
            // Approved records (ready for payment)
            const approvedRecords = allRecords.filter(r => r.is_approved);
            const approvedKg = approvedRecords.reduce((sum, r) => sum + parseFloat(r.approved_kg || r.weight_kg), 0);
            
            // Disputed records (need resolution)
            const disputedRecords = allRecords.filter(r => r.approval_status === 'disputed');
            const disputedKg = disputedRecords.reduce((sum, r) => sum + parseFloat(r.weight_kg), 0);
            
            // Pending records
            const pendingRecords = allRecords.filter(r => r.approval_status === 'pending');

            // Get wage rate
            const wageRes = await api.getWageRate();
            const ratePerKg = parseFloat(wageRes.wage_rate.rate_per_kg);

            // Get unsettled debts
            const debtsRes = await api.getDebts(workerId);
            const totalDebt = debtsRes.debts
                .filter(d => !d.is_settled && !d.is_reversed)
                .reduce((sum, d) => sum + parseFloat(d.amount), 0);

            const grossPay = approvedKg * ratePerKg;
            const netPay = grossPay - totalDebt;

            previewDiv.innerHTML = `
                <h3 class="font-semibold text-slate-800 mb-4">Payment Preview - ${workerName}</h3>
                
                ${disputedRecords.length > 0 ? `
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-exclamation-triangle text-amber-500"></i>
                            <span class="text-sm font-medium text-amber-700">${disputedRecords.length} disputed record(s) need resolution</span>
                        </div>
                        <p class="text-xs text-amber-600">Disputed kg: ${disputedKg.toFixed(2)} kg (not included in payment)</p>
                        <button onclick="router.navigate('tea-comparison')" class="text-xs text-amber-700 underline mt-1 hover:text-amber-800">
                            <i class="fas fa-arrow-right mr-1"></i>Go to Comparison to resolve
                        </button>
                    </div>
                ` : ''}

                ${pendingRecords.length > 0 ? `
                    <div class="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-4">
                        <p class="text-xs text-stone-500">${pendingRecords.length} pending record(s) awaiting approval</p>
                    </div>
                ` : ''}
                
                <div class="space-y-3">
                    <div class="bg-stone-50 rounded-xl p-4">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm text-stone-600">Approved Kg:</span>
                            <span class="font-semibold text-emerald-700">${approvedKg.toFixed(2)} kg</span>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span class="text-sm text-stone-600">Rate per Kg:</span>
                            <span class="font-medium">KES ${ratePerKg.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span class="text-sm text-stone-600">Records:</span>
                            <span class="font-medium">${approvedRecords.length} approved</span>
                        </div>
                        <div class="flex justify-between pt-2 border-t border-stone-200">
                            <span class="font-medium text-slate-800">Gross Pay:</span>
                            <span class="font-bold text-emerald-700">KES ${grossPay.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="bg-red-50 rounded-xl p-4">
                        <div class="flex justify-between">
                            <span class="text-sm text-stone-600">Total Unsettled Debt:</span>
                            <span class="font-bold text-red-600">KES ${totalDebt.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="bg-emerald-50 rounded-xl p-4">
                        <div class="flex justify-between">
                            <span class="font-medium text-slate-800">Net Pay:</span>
                            <span class="text-xl font-bold ${netPay > 0 ? 'text-emerald-700' : 'text-red-600'}">
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
                        class="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                        ${approvedKg === 0 ? 'disabled' : ''}>
                        <i class="fas fa-check-circle"></i>
                        ${approvedKg === 0 ? 'No Approved Records' : netPay > 0 ? `Pay KES ${netPay.toFixed(2)}` : 'Settle (No Cash Payment)'}
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
            'This will settle all approved plucking records. Disputed records will not be affected.',
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
            { 
                confirmText: 'Process Payment', 
                confirmIcon: 'fa-check-circle',
                confirmClass: 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/20',
                type: 'info'
            }
        );
    }
}
