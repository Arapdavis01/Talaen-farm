// ============================================
// TALAEN FARM - Comparison Panel (Enhanced)
// ============================================

class TeaComparison {
    static allDisputes = [];
    static resolvedDisputes = [];

    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Comparison Panel</h1>
                    <p class="text-stone-500 text-sm mt-1">Review and resolve disputed plucking records</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="TeaComparison.exportCSV()" 
                        class="bg-white border border-stone-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-stone-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button onclick="TeaComparison.loadAllDisputes()" 
                        class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-600/20">
                        <i class="fas fa-refresh"></i> Refresh
                    </button>
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div id="disputeStats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"></div>
            
            <!-- Toolbar -->
            <div class="bg-white rounded-2xl border border-stone-200 p-4 mb-4 shadow-sm">
                <div class="flex flex-wrap items-center gap-3">
                    <div class="relative flex-1 min-w-[200px]">
                        <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                        <input type="text" id="disputeSearch" placeholder="Search worker..." 
                            class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            oninput="TeaComparison.filterDisputes()">
                    </div>
                    <input type="date" id="disputeDateFrom" onchange="TeaComparison.filterDisputes()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                    <span class="text-stone-400 text-sm">to</span>
                    <input type="date" id="disputeDateTo" onchange="TeaComparison.filterDisputes()" 
                        class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                    <button onclick="TeaComparison.clearFilters()" class="px-3 py-2.5 text-stone-500 hover:text-slate-700 text-sm">
                        <i class="fas fa-times mr-1"></i> Clear
                    </button>
                </div>
            </div>
            
            <!-- Disputes Container -->
            <div id="disputesContainer">
                <div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading disputes...</p></div>
            </div>
            
            <!-- Resolved History -->
            <div id="resolvedHistory" class="mt-8"></div>
        `;

        await TeaComparison.loadAllDisputes();
    }

    static async loadAllDisputes() {
        const container = document.getElementById('disputesContainer');
        container.innerHTML = `<div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading disputes...</p></div>`;

        try {
            const [disputesRes, resolvedRes] = await Promise.all([
                api.getDisputedRecords(),
                api.get('/tea/comparison/resolved')
            ]);

            if (disputesRes.success) {
                TeaComparison.allDisputes = disputesRes.disputes || [];
                TeaComparison.resolvedDisputes = resolvedRes.success ? (resolvedRes.records || []) : [];
                
                TeaComparison.renderStats();
                TeaComparison.renderDisputes(TeaComparison.allDisputes);
                TeaComparison.renderResolvedHistory();
            }
        } catch (error) {
            container.innerHTML = `<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i><p class="text-red-500">Failed to load disputes.</p></div>`;
        }
    }

    static renderStats() {
        const total = TeaComparison.allDisputes.length;
        const resolved = TeaComparison.resolvedDisputes.length;
        const pending = total;
        const today = new Date().toISOString().split('T')[0];
        const resolvedToday = TeaComparison.resolvedDisputes.filter(r => r.plucking_date === today).length;

        document.getElementById('disputeStats').innerHTML = `
            <div class="stat-card bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                <p class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Total Disputes</p>
                <p class="text-2xl font-bold text-slate-800">${total}</p>
            </div>
            <div class="stat-card bg-white rounded-2xl border border-amber-200 p-4 shadow-sm bg-amber-50/30">
                <p class="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">⚠️ Pending</p>
                <p class="text-2xl font-bold text-amber-700">${pending}</p>
            </div>
            <div class="stat-card bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/30">
                <p class="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">✅ Resolved All Time</p>
                <p class="text-2xl font-bold text-emerald-700">${resolved}</p>
            </div>
            <div class="stat-card bg-white rounded-2xl border border-sky-200 p-4 shadow-sm bg-sky-50/30">
                <p class="text-xs font-medium text-sky-600 uppercase tracking-wider mb-2">Resolved Today</p>
                <p class="text-2xl font-bold text-sky-700">${resolvedToday}</p>
            </div>
        `;
    }

    static renderDisputes(disputes) {
        const container = document.getElementById('disputesContainer');
        
        if (disputes.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check-circle text-emerald-500 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-slate-800 mb-2">All Clear!</h3>
                    <p class="text-stone-500">No disputed records found. All records are approved.</p>
                </div>
            `;
            return;
        }

        const cards = disputes.map((dispute, i) => {
            const v = dispute.verified;
            const s = dispute.self_reported;
            const discrepancy = s ? parseFloat(v.weight_kg) - parseFloat(s.weight_kg) : parseFloat(v.weight_kg);

            return `
                <div class="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm mb-4 animate-fadeInUp" style="animation-delay:${i*0.05}s">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <span class="text-amber-700 font-bold">${v.tea_workers?.full_name?.charAt(0)||'?'}</span>
                            </div>
                            <div>
                                <h3 class="font-semibold text-slate-800">${v.tea_workers?.full_name||'Unknown'}</h3>
                                <p class="text-xs text-stone-400">${new Date(v.plucking_date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short',year:'numeric'})}</p>
                            </div>
                        </div>
                        <span class="badge bg-amber-50 text-amber-700 border border-amber-200">⚠️ Disputed</span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="bg-sky-50 rounded-xl p-4 border border-sky-100">
                            <p class="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-2"><i class="fas fa-user-edit mr-1"></i> Self Reported</p>
                            ${s ? `<p class="text-2xl font-bold text-sky-700">${parseFloat(s.weight_kg).toFixed(2)} <span class="text-sm font-normal text-sky-400">kg</span></p><p class="text-xs text-sky-500 mt-1">${s.companies?.name||'N/A'} • ${s.blocks?.name||'N/A'}</p>` : '<p class="text-sky-400">No self-reported data</p>'}
                        </div>
                        <div class="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                            <p class="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2"><i class="fas fa-check-double mr-1"></i> Verified</p>
                            <p class="text-2xl font-bold text-emerald-700">${parseFloat(v.weight_kg).toFixed(2)} <span class="text-sm font-normal text-emerald-400">kg</span></p>
                            <p class="text-xs text-emerald-500 mt-1">${v.companies?.name||'N/A'} • ${v.blocks?.name||'N/A'}</p>
                        </div>
                    </div>

                    <div class="bg-amber-50 rounded-xl p-3 border border-amber-100 mb-4">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-amber-700"><i class="fas fa-balance-scale mr-1"></i>Discrepancy:</span>
                            <span class="text-lg font-bold ${discrepancy>0?'text-red-600':discrepancy<0?'text-emerald-600':'text-stone-500'}">${discrepancy>0?'+':''}${discrepancy.toFixed(2)} kg</span>
                        </div>
                    </div>

                    <!-- Quick Select Buttons -->
                    <div class="flex gap-2 mb-4">
                        ${s ? `<button onclick="TeaComparison.quickSelect('${v.id}', ${s.weight_kg})" class="flex-1 bg-sky-100 hover:bg-sky-200 text-sky-700 py-2 rounded-lg text-xs font-medium transition-colors"><i class="fas fa-user-edit mr-1"></i>Use Self (${parseFloat(s.weight_kg).toFixed(1)} kg)</button>` : ''}
                        <button onclick="TeaComparison.quickSelect('${v.id}', ${v.weight_kg})" class="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-2 rounded-lg text-xs font-medium transition-colors"><i class="fas fa-check-double mr-1"></i>Use Verified (${parseFloat(v.weight_kg).toFixed(1)} kg)</button>
                    </div>

                    <!-- Resolve Form -->
                    <div class="flex gap-3">
                        <input type="number" id="approvedKg_${v.id}" step="0.01" value="${v.weight_kg}" 
                            class="flex-1 px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            placeholder="Final kg">
                        <button onclick="TeaComparison.resolveDispute('${v.id}')" 
                            class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all text-sm font-medium shadow-lg shadow-emerald-600/20 flex items-center gap-2">
                            <i class="fas fa-gavel"></i> Resolve
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = cards;
    }

    static renderResolvedHistory() {
        const container = document.getElementById('resolvedHistory');
        if (!TeaComparison.resolvedDisputes || TeaComparison.resolvedDisputes.length === 0) return;

        const recent = TeaComparison.resolvedDisputes.slice(0, 10);
        container.innerHTML = `
            <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <i class="fas fa-clock-rotate-left text-emerald-600"></i>
                    </div>
                    <h3 class="font-bold text-slate-800">Recently Resolved</h3>
                </div>
                <div class="space-y-2">
                    ${recent.map(r => `
                        <div class="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <span class="text-emerald-700 font-bold text-xs">${r.tea_workers?.full_name?.charAt(0)||'?'}</span>
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-slate-700">${r.tea_workers?.full_name||'Unknown'}</p>
                                    <p class="text-xs text-stone-400">${new Date(r.plucking_date).toLocaleDateString('en-GB')} • ${r.approved_kg||r.weight_kg} kg approved</p>
                                </div>
                            </div>
                            <span class="badge bg-emerald-50 text-emerald-700 border border-emerald-200">✅ Resolved</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    static quickSelect(recordId, kg) {
        const input = document.getElementById(`approvedKg_${recordId}`);
        if (input) {
            input.value = kg;
            input.focus();
            input.classList.add('ring-2', 'ring-emerald-500/20', 'border-emerald-500');
            setTimeout(() => input.classList.remove('ring-2', 'ring-emerald-500/20', 'border-emerald-500'), 1000);
        }
    }

    static async resolveDispute(recordId) {
        const input = document.getElementById(`approvedKg_${recordId}`);
        const approvedKg = parseFloat(input?.value);

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

    static filterDisputes() {
        const search = (document.getElementById('disputeSearch')?.value || '').toLowerCase();
        const dateFrom = document.getElementById('disputeDateFrom')?.value || '';
        const dateTo = document.getElementById('disputeDateTo')?.value || '';

        let filtered = [...TeaComparison.allDisputes];
        if (search) filtered = filtered.filter(d => d.verified?.tea_workers?.full_name?.toLowerCase().includes(search));
        if (dateFrom) filtered = filtered.filter(d => d.verified?.plucking_date >= dateFrom);
        if (dateTo) filtered = filtered.filter(d => d.verified?.plucking_date <= dateTo);

        TeaComparison.renderDisputes(filtered);
    }

    static clearFilters() {
        ['disputeSearch', 'disputeDateFrom', 'disputeDateTo'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        TeaComparison.renderDisputes(TeaComparison.allDisputes);
    }

    static exportCSV() {
        const h = ['Date','Worker','Self Kg','Verified Kg','Discrepancy','Status'];
        const rows = TeaComparison.allDisputes.map(d => {
            const v = d.verified; const s = d.self_reported;
            return [v.plucking_date, v.tea_workers?.full_name||'', s?parseFloat(s.weight_kg).toFixed(2):'N/A', parseFloat(v.weight_kg).toFixed(2), d.discrepancy?.toFixed(2)||'0', 'Disputed'];
        });
        let csv = h.join(',')+'\n'; rows.forEach(r => { csv += r.map(v => `"${v}"`).join(',')+'\n'; });
        const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`disputes_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
        showToast(`${TeaComparison.allDisputes.length} disputes exported!`,'success');
    }
}
