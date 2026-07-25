// ============================================
// TALAEN FARM - Comparison Panel (Dispute Resolution)
// ============================================

class TeaComparison {
    static allDisputes = [];

    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Comparison Panel</h1>
                    <p class="text-stone-500 text-sm mt-1">Review and resolve disputed plucking records</p>
                </div>
                <button onclick="TeaComparison.loadAllDisputes()" 
                    class="bg-white border border-stone-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-stone-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm">
                    <i class="fas fa-refresh"></i> Refresh
                </button>
            </div>
            
            <!-- Stats -->
            <div id="disputeStats" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"></div>
            
            <!-- Disputes Container -->
            <div id="disputesContainer">
                <div class="text-center py-12">
                    <div class="spinner mx-auto"></div>
                    <p class="text-stone-500 mt-3">Loading disputes...</p>
                </div>
            </div>
        `;

        await TeaComparison.loadAllDisputes();
    }

    static async loadAllDisputes() {
        const container = document.getElementById('disputesContainer');
        container.innerHTML = `<div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading disputes...</p></div>`;

        try {
            const response = await api.getDisputedRecords();
            
            if (response.success) {
                TeaComparison.allDisputes = response.disputes || [];
                
                // Stats
                document.getElementById('disputeStats').innerHTML = `
                    <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                        <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Disputes</p>
                        <p class="text-2xl font-bold text-slate-800">${TeaComparison.allDisputes.length}</p>
                    </div>
                    <div class="stat-card bg-white rounded-2xl border border-amber-200 p-4 shadow-sm bg-amber-50/30">
                        <p class="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">⚠️ Need Resolution</p>
                        <p class="text-2xl font-bold text-amber-700">${TeaComparison.allDisputes.length}</p>
                    </div>
                    <div class="stat-card bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/30">
                        <p class="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">✅ Auto-Approved</p>
                        <p class="text-2xl font-bold text-emerald-700">—</p>
                    </div>
                `;

                if (TeaComparison.allDisputes.length === 0) {
                    container.innerHTML = `
                        <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                            <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-check-circle text-emerald-500 text-2xl"></i>
                            </div>
                            <h3 class="text-lg font-semibold text-slate-800 mb-2">All Clear!</h3>
                            <p class="text-stone-500">No disputed records found. All records are approved.</p>
                        </div>
                    `;
                } else {
                    TeaComparison.renderDisputes(TeaComparison.allDisputes);
                }
            }
        } catch (error) {
            container.innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load disputes.</p>
                </div>
            `;
        }
    }

    static renderDisputes(disputes) {
        const cards = disputes.map((dispute, index) => {
            const v = dispute.verified;
            const s = dispute.self_reported;
            const discrepancy = s ? parseFloat(v.weight_kg) - parseFloat(s.weight_kg) : parseFloat(v.weight_kg);

            return `
                <div class="bg-white rounded-2xl border ${discrepancy !== 0 ? 'border-amber-200' : 'border-stone-200'} p-6 shadow-sm mb-4 animate-fadeInUp" style="animation-delay: ${index * 0.1}s;">
                    <!-- Worker Info -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <span class="text-amber-700 font-bold">${v.tea_workers?.full_name?.charAt(0) || '?'}</span>
                            </div>
                            <div>
                                <h3 class="font-semibold text-slate-800">${v.tea_workers?.full_name || 'Unknown'}</h3>
                                <p class="text-xs text-stone-400">${new Date(v.plucking_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <span class="badge bg-amber-50 text-amber-700 border border-amber-200">⚠️ Disputed</span>
                    </div>

                    <!-- Comparison -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <!-- Self Reported -->
                        <div class="bg-sky-50 rounded-xl p-4 border border-sky-100">
                            <p class="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-2">
                                <i class="fas fa-user-edit mr-1"></i> Self Reported
                            </p>
                            ${s ? `
                                <p class="text-2xl font-bold text-sky-700">${parseFloat(s.weight_kg).toFixed(2)} <span class="text-sm font-normal text-sky-400">kg</span></p>
                                <p class="text-xs text-sky-500 mt-1">${s.companies?.name || 'N/A'} • ${s.blocks?.name || 'N/A'}</p>
                            ` : `
                                <p class="text-sky-400">No self-reported data</p>
                            `}
                        </div>

                        <!-- Verified -->
                        <div class="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                            <p class="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                                <i class="fas fa-check-double mr-1"></i> Verified
                            </p>
                            <p class="text-2xl font-bold text-emerald-700">${parseFloat(v.weight_kg).toFixed(2)} <span class="text-sm font-normal text-emerald-400">kg</span></p>
                            <p class="text-xs text-emerald-500 mt-1">${v.companies?.name || 'N/A'} • ${v.blocks?.name || 'N/A'}</p>
                        </div>
                    </div>

                    <!-- Discrepancy -->
                    <div class="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-4">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-amber-700">
                                <i class="fas fa-balance-scale mr-1"></i> Discrepancy:
                            </span>
                            <span class="text-lg font-bold ${discrepancy > 0 ? 'text-red-600' : discrepancy < 0 ? 'text-emerald-600' : 'text-stone-500'}">
                                ${discrepancy > 0 ? '+' : ''}${discrepancy.toFixed(2)} kg
                            </span>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3">
                        <input type="number" id="approvedKg_${v.id}" step="0.01" value="${v.weight_kg}" 
                            class="flex-1 px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            placeholder="Enter approved kg">
                        <button onclick="TeaComparison.resolveDispute('${v.id}')" 
                            class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all text-sm font-medium shadow-lg shadow-emerald-600/20 flex items-center gap-2">
                            <i class="fas fa-gavel"></i> Resolve
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('disputesContainer').innerHTML = cards;
    }

    static async resolveDispute(recordId) {
        const approvedKgInput = document.getElementById(`approvedKg_${recordId}`);
        const approvedKg = parseFloat(approvedKgInput?.value);

        if (!approvedKg || approvedKg <= 0) {
            showToast('Please enter a valid approved weight.', 'warning');
            return;
        }

        modal.openConfirm(
            'Resolve Dispute',
            `Approve <strong>${approvedKg.toFixed(2)} kg</strong> as the final figure? This will mark the record as approved and ready for payment.`,
            async () => {
                try {
                    const response = await api.approveVerifiedPlucking(recordId, approvedKg);
                    if (response.success) {
                        showToast('Dispute resolved! Record approved for payment.', 'success');
                        await TeaComparison.loadAllDisputes();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            },
            { confirmText: 'Approve', confirmIcon: 'fa-gavel', confirmClass: 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/20', type: 'info' }
        );
    }

    // Legacy method for backward compatibility
    static async loadWorkerList() {
        // No longer needed - disputes are loaded automatically
    }

    static async loadComparison() {
        // No longer needed - disputes are loaded automatically
        await TeaComparison.loadAllDisputes();
    }
}
