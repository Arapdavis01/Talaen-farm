// ============================================
// TALAEN FARM - Wage Rate Management
// ============================================

class TeaWageRate {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Wage Rate</h1>
                <p class="text-gray-500">Set the wage rate per kilogram for tea plucking</p>
            </div>
            <div id="wageRateContent" class="max-w-2xl">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading wage rate...</p>
                </div>
            </div>
        `;

        await TeaWageRate.loadWageRate();
    }

    static async loadWageRate() {
        try {
            const response = await api.getWageRate();
            
            const wageRate = response.wage_rate;
            
            document.getElementById('wageRateContent').innerHTML = `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    ${wageRate ? `
                        <div class="flex items-center gap-4 mb-6">
                            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-money-bill-wave text-green-600 text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Current Wage Rate</p>
                                <p class="text-3xl font-bold text-gray-800">KES ${parseFloat(wageRate.rate_per_kg).toFixed(2)} <span class="text-lg font-normal text-gray-500">/ kg</span></p>
                                <p class="text-xs text-gray-400 mt-1">Effective from: ${new Date(wageRate.effective_from).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-6 mb-6">
                            <i class="fas fa-exclamation-circle text-yellow-500 text-4xl mb-3"></i>
                            <p class="text-gray-500">No wage rate has been set yet.</p>
                        </div>
                    `}
                    
                    <div class="border-t pt-6">
                        <h3 class="font-semibold text-gray-800 mb-4">Set New Wage Rate</h3>
                        <form id="wageRateForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Rate per Kg (KES) *</label>
                                <input type="number" id="newRate" step="0.01" required 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    placeholder="Enter rate per kg">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Effective From *</label>
                                <input type="date" id="effectiveDate" required 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <button type="submit" 
                                class="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg transition-colors font-medium">
                                <i class="fas fa-save mr-2"></i>Set Wage Rate
                            </button>
                        </form>
                    </div>
                </div>
            `;

            document.getElementById('wageRateForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const wageData = {
                    rate_per_kg: parseFloat(document.getElementById('newRate').value),
                    effective_from: document.getElementById('effectiveDate').value
                };

                try {
                    const response = await api.setWageRate(wageData);
                    if (response.success) {
                        showToast('Wage rate set successfully!', 'success');
                        await TeaWageRate.loadWageRate();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            });
        } catch (error) {
            document.getElementById('wageRateContent').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load wage rate.</p>
                </div>
            `;
        }
    }
}
