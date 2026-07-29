// ============================================
// TALAEN FARM - Pay Tea Worker (Debt Rolling)
// Mobile‑Safe + All Fixes
// ============================================

class TeaPayWorker {
    // Initialize to avoid undefined errors when filtering
    static allWorkers = [];

    static async show() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Pay Worker</h1>
                <p class="text-stone-500 text-sm mt-1">Calculate and process worker payments with debt rolling</p>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Worker List -->
                <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold text-slate-800 flex items-center gap-2">
                            <i class="fas fa-users text-emerald-500"></i> Select Worker
                        </h3>
                        <button onclick="TeaPayWorker.loadPaymentHistory()" class="text-xs text-sky-600 hover:text-sky-700 font-medium">
                            <i class="fas fa-history mr-1"></i>History
                        </button>
                    </div>
                    <div class="relative mb-3">
                        <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                        <input type="text" id="payWorkerSearch" placeholder="Search worker..." 
                            class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            oninput="TeaPayWorker.filterWorkers()">
                    </div>
                    <div id="workerList" class="space-y-2 max-h-96 overflow-y-auto">
                        <div class="text-center py-4"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-2 text-sm">Loading workers...</p></div>
                    </div>
                </div>
                
                <!-- Payment Preview -->
                <div id="paymentPreview" class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                    <div class="text-center py-12 text-stone-400">
                        <div class="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-hand-holding-dollar text-stone-300 text-2xl"></i>
                        </div>
                        <p class="font-medium">Select a worker to preview payment.</p>
                        <p class="text-xs mt-1">Only approved records are included.</p>
                    </div>
                </div>
            </div>
        `;

        // Give the DOM a moment to paint on mobile before accessing new elements
        await new Promise(resolve => requestAnimationFrame(resolve));
        await TeaPayWorker.loadWorkers();
    }

    static async loadWorkers() {
        const workerList = document.getElementById('workerList');
        if (!workerList) return;

        try {
            const [workersRes, wageRes] = await Promise.all([api.getTeaWorkers(), api.getWageRate()]);

            if (!wageRes.wage_rate) {
                workerList.innerHTML = `
                    <div class="text-center py-8">
                        <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3"><i class="fas fa-exclamation-triangle text-amber-500"></i></div>
                        <p class="text-amber-700 font-medium">No wage rate set.</p>
                        <p class="text-stone-400 text-sm mt-1">Please set wage rate first.</p>
                    </div>`;
                return;
            }

            if (workersRes.success && workersRes.workers.length > 0) {
                const verifiedRes = await api.getVerifiedPlucking();
                const verifiedRecords = verifiedRes.success ? verifiedRes.records : [];
                TeaPayWorker.allWorkers = workersRes.workers.filter(w => w.is_active);
                TeaPayWorker.renderWorkerList(TeaPayWorker.allWorkers, verifiedRecords);
            } else {
                workerList.innerHTML = '<div class="text-center py-8"><p class="text-stone-500">No active workers found.</p></div>';
            }
        } catch (error) {
            workerList.innerHTML = '<div class="text-center py-8"><i class="fas fa-exclamation-circle text-red-500 text-xl mb-2"></i><p class="text-red-500">Failed to load workers.</p></div>';
        }
    }

    static renderWorkerList(workers, verifiedRecords) {
        const list = document.getElementById('workerList');
        if (!list) return;

        const html = workers.map(worker => {
            const workerRecords = verifiedRecords.filter(r => r.worker_id === worker.id && !r.is_settled);
            const approvedKg = workerRecords.filter(r => r.is_approved).reduce((s, r) => s + parseFloat(r.approved_kg || r.weight_kg), 0);
            const disputedCount = workerRecords.filter(r => r.approval_status === 'disputed').length;
            const rollCount = worker.roll_count || 0;
            const rolledDebt = parseFloat(worker.rolled_debt || 0);

            return `
                <div class="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-all"
                     onclick="TeaPayWorker.selectWorker('${worker.id}', '${worker.full_name}')">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span class="text-emerald-700 font-bold text-sm">${worker.full_name.charAt(0)}</span>
                        </div>
                        <div>
                            <p class="font-medium text-slate-800 text-sm">${worker.full_name}</p>
                            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                                ${approvedKg > 0 ? `<span class="text-xs text-emerald-600 font-medium">${approvedKg.toFixed(1)} kg</span>` : ''}
                                ${rolledDebt > 0 ? `<span class="text-xs text-amber-600 font-medium">Rolled: KES ${rolledDebt.toFixed(0)}</span>` : ''}
                                ${rollCount > 0 ? `<span class="text-xs ${rollCount >= 3 ? 'text-red-600 font-bold' : 'text-amber-600'}">⤵${rollCount}</span>` : ''}
                                ${disputedCount > 0 ? `<span class="text-xs text-amber-600">• ${disputedCount} disputed</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-stone-300 text-sm"></i>
                </div>
            `;
        }).join('');

        list.innerHTML = html || '<div class="text-center py-8"><p class="text-stone-500">No workers match.</p></div>';
    }

    static filterWorkers() {
        // Guard against undefined allWorkers
        if (!Array.isArray(TeaPayWorker.allWorkers)) {
            console.warn('Workers not loaded yet');
            return;
        }
        const search = (document.getElementById('payWorkerSearch')?.value || '').toLowerCase();
        const filtered = TeaPayWorker.allWorkers.filter(w => w.full_name.toLowerCase().includes(search));
        TeaPayWorker.renderWorkerList(filtered, []);
    }

    static async selectWorker(workerId, workerName) {
        const previewDiv = document.getElementById('paymentPreview');
        if (!previewDiv) return;

        previewDiv.innerHTML = `<div class="text-center py-8"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Calculating payment...</p></div>`;

        try {
            const [pluckingRes, wageRes, debtsRes, workerRes] = await Promise.all([
                api.getVerifiedPlucking(workerId),
                api.getWageRate(),
                api.getDebts(workerId),
                api.getTeaWorkers()
            ]);

            const worker = workerRes.workers.find(w => w.id === workerId);
            const allRecords = pluckingRes.records.filter(r => !r.is_settled);
            const approvedRecords = allRecords.filter(r => r.is_approved);
            const approvedKg = approvedRecords.reduce((s, r) => s + parseFloat(r.approved_kg || r.weight_kg), 0);
            const disputedRecords = allRecords.filter(r => r.approval_status === 'disputed');
            const pendingRecords = allRecords.filter(r => r.approval_status === 'pending');
            const ratePerKg = parseFloat(wageRes.wage_rate.rate_per_kg);
            const newStoreDebt = debtsRes.debts.filter(d => !d.is_settled && !d.is_reversed).reduce((s, d) => s + parseFloat(d.amount), 0);
            const rolledDebt = parseFloat(worker?.rolled_debt || 0);
            const rollCount = worker?.roll_count || 0;
            const totalDebt = rolledDebt + newStoreDebt;
            const grossPay = approvedKg * ratePerKg;
            const netPay = grossPay - totalDebt;

            previewDiv.innerHTML = `
                <h3 class="font-semibold text-slate-800 mb-4">Payment Preview - ${workerName}</h3>
                
                ${rollCount > 0 ? `
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-exclamation-triangle text-amber-500"></i>
                            <span class="text-sm font-medium text-amber-700">Roll Count: ${rollCount} ${rollCount >= 3 ? '⚠️ ALERT!' : ''}</span>
                        </div>
                        <p class="text-xs text-amber-600 mt-1">Rolled debt from previous cycle: KES ${rolledDebt.toFixed(2)}</p>
                    </div>
                ` : ''}

                ${rollCount >= 3 ? `
                    <div class="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                        <p class="text-sm text-red-700 font-medium"><i class="fas fa-bell mr-1"></i>Admin intervention required! 3+ consecutive unpaid cycles.</p>
                    </div>
                ` : ''}

                ${disputedRecords.length > 0 ? `
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                        <p class="text-sm text-amber-700">${disputedRecords.length} disputed record(s) need resolution</p>
                        <button onclick="router.navigate('tea-comparison')" class="text-xs text-amber-700 underline mt-1">Go to Comparison</button>
                    </div>
                ` : ''}
                
                <div class="space-y-3">
                    <div class="bg-stone-50 rounded-xl p-4">
                        <div class="flex justify-between mb-2"><span class="text-sm text-stone-600">Approved Kg:</span><span class="font-semibold text-emerald-700">${approvedKg.toFixed(2)} kg</span></div>
                        <div class="flex justify-between mb-2"><span class="text-sm text-stone-600">Rate:</span><span class="font-medium">KES ${ratePerKg.toFixed(2)}/kg</span></div>
                        <div class="flex justify-between mb-2"><span class="text-sm text-stone-600">Records:</span><span class="font-medium">${approvedRecords.length} approved</span></div>
                        <div class="flex justify-between pt-2 border-t border-stone-200"><span class="font-medium text-slate-800">Gross Pay:</span><span class="font-bold text-emerald-700">KES ${grossPay.toFixed(2)}</span></div>
                    </div>
                    
                    <div class="bg-amber-50 rounded-xl p-4">
                        <div class="flex justify-between mb-1"><span class="text-sm text-stone-600">Rolled Debt:</span><span class="font-medium text-amber-700">KES ${rolledDebt.toFixed(2)}</span></div>
                        <div class="flex justify-between mb-1"><span class="text-sm text-stone-600">New Store Debt:</span><span class="font-medium text-amber-700">KES ${newStoreDebt.toFixed(2)}</span></div>
                        <div class="flex justify-between pt-2 border-t border-amber-200"><span class="font-medium text-slate-800">Total Debt:</span><span class="font-bold text-red-600">KES ${totalDebt.toFixed(2)}</span></div>
                    </div>
                    
                    <div class="bg-emerald-50 rounded-xl p-4">
                        <div class="flex justify-between"><span class="font-medium text-slate-800">Net Pay:</span><span class="text-xl font-bold ${netPay > 0 ? 'text-emerald-700' : 'text-red-600'}">KES ${netPay > 0 ? netPay.toFixed(2) : '0.00'}</span></div>
                        ${netPay <= 0 ? `<p class="text-sm text-red-500 mt-2"><i class="fas fa-exclamation-circle mr-1"></i>KES ${totalDebt.toFixed(2)} debt rolls forward (Roll #${rollCount + 1})</p>` : `<p class="text-sm text-emerald-600 mt-2"><i class="fas fa-check-circle mr-1"></i>Store debts remain for later settlement</p>`}
                    </div>
                    
                    <button onclick="TeaPayWorker.processPayment('${workerId}')" 
                        class="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                        ${approvedKg === 0 ? 'disabled' : ''}>
                        <i class="fas ${netPay > 0 ? 'fa-check-circle' : 'fa-arrow-right'}"></i>
                        ${approvedKg === 0 ? 'No Approved Records' : netPay > 0 ? `Pay KES ${netPay.toFixed(2)}` : 'Settle (No Cash Payment)'}
                    </button>
                </div>
            `;
        } catch (error) {
            previewDiv.innerHTML = `<div class="text-center py-8"><i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i><p class="text-red-500">Failed to calculate payment.</p></div>`;
        }
    }

    static async processPayment(workerId) {
        modal.openConfirm('Confirm Payment', 'This will settle all approved plucking records. Store debts remain for later settlement via Pay Store.', async () => {
            try {
                const response = await api.payWorker(workerId);
                if (response.success) {
                    const s = response.settlement;
                    let msg = s.message;
                    if (s.alert) showToast(s.alert, 'warning', 6000);
                    showToast(msg, s.status === 'paid' ? 'success' : 'warning');
                    await TeaPayWorker.show();
                }
            } catch (error) { showToast(error.message, 'error'); }
        }, { confirmText: 'Process Payment', confirmIcon: 'fa-check-circle', confirmClass: 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/20', type: 'info' });
    }

    static async loadPaymentHistory() {
        try {
            const response = await api.get('/tea/pay-worker/history');
            if (response.success && response.payments.length > 0) {
                const recent = response.payments.slice(0, 15);
                modal.open('Payment History', `
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${recent.map(p => `
                            <div class="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                <div>
                                    <p class="text-sm font-medium text-slate-700">${p.tea_workers?.full_name || 'Store'}</p>
                                    <p class="text-xs text-stone-400">${new Date(p.settlement_date).toLocaleDateString('en-GB')}</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold ${p.net_pay > 0 ? 'text-emerald-700' : 'text-red-600'}">KES ${parseFloat(p.net_pay).toFixed(2)}</p>
                                    <p class="text-xs text-stone-400">${p.kg_settled} kg</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `, { size: 'max-w-md', icon: 'fa-history' });
            } else {
                showToast('No payment history found.', 'info');
            }
        } catch (e) { showToast('Failed to load history.', 'error'); }
    }
}
