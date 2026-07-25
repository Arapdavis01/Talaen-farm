// ============================================
// TALAEN FARM - Wage Rate Management (Enhanced)
// ============================================

class TeaWageRate {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Wage Rate</h1>
                <p class="text-stone-500 text-sm mt-1">Set and manage the wage rate per kilogram for tea plucking</p>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Current Rate & Set New -->
                <div class="space-y-6">
                    <div id="currentRateCard">
                        <div class="text-center py-8">
                            <div class="spinner mx-auto"></div>
                            <p class="text-stone-500 mt-3">Loading...</p>
                        </div>
                    </div>
                    <div id="setRateCard">
                        <!-- Set new rate form -->
                    </div>
                </div>
                
                <!-- Rate History -->
                <div id="rateHistoryCard">
                    <div class="text-center py-8">
                        <div class="spinner mx-auto"></div>
                        <p class="text-stone-500 mt-3">Loading history...</p>
                    </div>
                </div>
            </div>
        `;

        await TeaWageRate.loadAll();
    }

    static async loadAll() {
        await Promise.all([
            TeaWageRate.loadCurrentRate(),
            TeaWageRate.loadRateHistory()
        ]);
    }

    static async loadCurrentRate() {
        try {
            const response = await api.getWageRate();
            const wageRate = response.wage_rate;
            
            document.getElementById('currentRateCard').innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-coins text-emerald-600 text-sm"></i>
                        </div>
                        <h3 class="font-bold text-slate-800">Current Rate</h3>
                    </div>
                    
                    ${wageRate ? `
                        <div class="text-center py-4">
                            <div class="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-100">
                                <span class="text-emerald-700 font-bold text-lg">KES</span>
                            </div>
                            <p class="text-4xl font-extrabold text-slate-800 mb-1">${parseFloat(wageRate.rate_per_kg).toFixed(2)}</p>
                            <p class="text-stone-500 text-sm">per kilogram</p>
                            <div class="flex items-center justify-center gap-4 mt-4 text-xs text-stone-400">
                                <span><i class="fas fa-calendar-check mr-1 text-emerald-500"></i> Effective: ${new Date(wageRate.effective_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <span><i class="fas fa-clock mr-1 text-emerald-500"></i> ${wageRate.days_active} days active</span>
                            </div>
                            ${wageRate.users ? `
                                <p class="text-xs text-stone-400 mt-2">Set by: ${wageRate.users.full_name}</p>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="text-center py-6">
                            <div class="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-exclamation-triangle text-amber-500 text-xl"></i>
                            </div>
                            <p class="text-stone-500">No wage rate has been set yet.</p>
                            <p class="text-stone-400 text-sm mt-1">Set a rate below to get started.</p>
                        </div>
                    `}
                </div>
            `;

            TeaWageRate.renderSetRateForm(wageRate);
        } catch (error) {
            document.getElementById('currentRateCard').innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-6 text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-2xl mb-2"></i>
                    <p class="text-red-500">Failed to load current rate.</p>
                </div>
            `;
        }
    }

    static renderSetRateForm(currentRate) {
        document.getElementById('setRateCard').innerHTML = `
            <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <div class="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-pen text-sky-600 text-sm"></i>
                    </div>
                    <h3 class="font-bold text-slate-800">Set New Wage Rate</h3>
                </div>
                
                <form id="wageRateForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1.5">Rate per Kg (KES) *</label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-stone-400 font-medium">KES</span>
                            <input type="number" id="newRate" step="0.01" required 
                                class="w-full pl-14 pr-4 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                                placeholder="0.00"
                                value="${currentRate ? parseFloat(currentRate.rate_per_kg).toFixed(2) : ''}"
                                oninput="TeaWageRate.calculateImpact()">
                        </div>
                        ${currentRate ? `
                            <p class="text-xs text-stone-400 mt-1">Current rate: KES ${parseFloat(currentRate.rate_per_kg).toFixed(2)}/kg</p>
                        ` : ''}
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1.5">Effective From *</label>
                        <input type="date" id="effectiveDate" required 
                            class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <!-- Impact Preview -->
                    <div id="impactPreview" class="bg-stone-50 rounded-xl p-4 border border-stone-200 ${currentRate ? '' : 'hidden'}">
                        <p class="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                            <i class="fas fa-calculator mr-1 text-emerald-500"></i> Impact Preview
                        </p>
                        <div id="impactContent" class="text-xs text-stone-500">
                            Enter a new rate to see the impact.
                        </div>
                    </div>
                    
                    <button type="submit" 
                        class="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2.5 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                        <i class="fas fa-save"></i> Set Wage Rate
                    </button>
                </form>
            </div>
        `;

        document.getElementById('wageRateForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newRate = parseFloat(document.getElementById('newRate').value);
            const effectiveDate = document.getElementById('effectiveDate').value;

            if (!newRate || newRate <= 0) {
                showToast('Please enter a valid rate.', 'warning');
                return;
            }

            // Confirmation if big change
            if (currentRate) {
                const currentRateVal = parseFloat(currentRate.rate_per_kg);
                const percentChange = ((newRate - currentRateVal) / currentRateVal) * 100;
                
                if (Math.abs(percentChange) > 20) {
                    const confirmed = confirm(`The new rate is ${Math.abs(percentChange).toFixed(0)}% ${percentChange > 0 ? 'higher' : 'lower'} than the current rate. Are you sure?`);
                    if (!confirmed) return;
                }
            }

            try {
                const response = await api.setWageRate({
                    rate_per_kg: newRate,
                    effective_from: effectiveDate
                });
                if (response.success) {
                    showToast('Wage rate set successfully!', 'success');
                    await TeaWageRate.loadAll();
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    static async calculateImpact() {
        const newRate = parseFloat(document.getElementById('newRate')?.value);
        const impactPreview = document.getElementById('impactPreview');
        const impactContent = document.getElementById('impactContent');
        
        if (!newRate || newRate <= 0 || !impactContent) return;
        
        impactPreview.classList.remove('hidden');
        impactContent.innerHTML = '<span class="text-stone-400">Calculating...</span>';

        try {
            const response = await api.getWageRateImpact(newRate);
            if (response.success) {
                const { impact } = response;
                const diffColor = impact.difference > 0 ? 'text-red-600' : impact.difference < 0 ? 'text-emerald-600' : 'text-stone-500';
                const diffSign = impact.difference > 0 ? '+' : '';
                
                impactContent.innerHTML = `
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>Yesterday's plucking (${impact.yesterday_kg.toFixed(2)} kg):</span>
                            <span class="font-medium ${diffColor}">${diffSign}KES ${Math.abs(impact.difference).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>This month's plucking (${impact.monthly_kg.toFixed(2)} kg):</span>
                            <span class="font-medium ${diffColor}">${diffSign}KES ${Math.abs(impact.monthly_impact).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between pt-2 border-t border-stone-200">
                            <span>Percent change:</span>
                            <span class="font-semibold ${impact.percent_change > 0 ? 'text-red-600' : impact.percent_change < 0 ? 'text-emerald-600' : 'text-stone-500'}">
                                ${impact.percent_change > 0 ? '+' : ''}${impact.percent_change.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            impactContent.innerHTML = '<span class="text-stone-400">Could not calculate impact.</span>';
        }
    }

    static async loadRateHistory() {
        try {
            const response = await api.getWageRateHistory();
            
            if (response.success && response.history.length > 0) {
                TeaWageRate.renderHistory(response.history);
            } else {
                document.getElementById('rateHistoryCard').innerHTML = `
                    <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                        <div class="flex items-center gap-2 mb-4">
                            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-clock-rotate-left text-purple-600 text-sm"></i>
                            </div>
                            <h3 class="font-bold text-slate-800">Rate History</h3>
                        </div>
                        <div class="text-center py-8 text-stone-400">
                            <i class="fas fa-history text-3xl mb-2"></i>
                            <p>No rate history available.</p>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('rateHistoryCard').innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-6 text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-2xl mb-2"></i>
                    <p class="text-red-500">Failed to load history.</p>
                </div>
            `;
        }
    }

    static renderHistory(history) {
        const rows = history.map((rate, index) => `
            <div class="flex items-center gap-4 p-4 ${rate.is_active ? 'bg-emerald-50/50 border border-emerald-200' : 'bg-stone-50 border border-stone-100'} rounded-xl ${index > 0 ? 'mt-2' : ''}">
                <div class="w-10 h-10 ${rate.is_active ? 'bg-emerald-100' : 'bg-stone-200'} rounded-xl flex items-center justify-center flex-shrink-0">
                    <i class="fas ${rate.is_active ? 'fa-check-circle text-emerald-600' : 'fa-circle text-stone-400'}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-800">KES ${parseFloat(rate.rate_per_kg).toFixed(2)}/kg</span>
                        ${rate.is_active ? '<span class="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">Active</span>' : ''}
                    </div>
                    <p class="text-xs text-stone-400 mt-0.5">
                        Effective: ${new Date(rate.effective_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        ${rate.users ? ` • Set by: ${rate.users.full_name}` : ''}
                    </p>
                </div>
                ${rate.change !== null ? `
                    <div class="text-right flex-shrink-0">
                        <span class="text-sm font-semibold ${rate.change > 0 ? 'text-red-600' : rate.change < 0 ? 'text-emerald-600' : 'text-stone-400'}">
                            ${rate.change > 0 ? '+' : ''}${rate.change.toFixed(2)}
                        </span>
                        <p class="text-[10px] text-stone-400">change</p>
                    </div>
                ` : '<span class="text-xs text-stone-400">—</span>'}
            </div>
        `).join('');

        document.getElementById('rateHistoryCard').innerHTML = `
            <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-clock-rotate-left text-purple-600 text-sm"></i>
                    </div>
                    <h3 class="font-bold text-slate-800">Rate History</h3>
                    <span class="text-xs text-stone-400 ml-auto">${history.length} rates</span>
                </div>
                <div class="max-h-96 overflow-y-auto">
                    ${rows}
                </div>
            </div>
        `;
    }
}
