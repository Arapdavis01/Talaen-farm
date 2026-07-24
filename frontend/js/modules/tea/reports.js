// ============================================
// TALAEN FARM - Tea Reports
// ============================================

class TeaReports {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Tea Reports</h1>
                <p class="text-gray-500">Profit analysis per company</p>
            </div>
            
            <div id="profitReport" class="space-y-6">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Generating profit report...</p>
                </div>
            </div>
        `;

        await TeaReports.loadProfitReport();
    }

    static async loadProfitReport() {
        try {
            const response = await api.getProfitReport();
            
            if (response.success) {
                const { report, total_profit, wage_rate_used } = response;
                
                if (report.length === 0) {
                    document.getElementById('profitReport').innerHTML = `
                        <div class="text-center py-12">
                            <i class="fas fa-chart-bar text-gray-300 text-5xl mb-4"></i>
                            <p class="text-gray-500">No settled plucking data available for reports.</p>
                        </div>
                    `;
                    return;
                }

                const companyCards = report.map(company => `
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">${company.company}</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="bg-blue-50 rounded-lg p-3">
                                <p class="text-xs text-blue-600 mb-1">Total Kg Sold</p>
                                <p class="text-lg font-bold text-blue-700">${company.total_kg.toFixed(2)} kg</p>
                            </div>
                            <div class="bg-green-50 rounded-lg p-3">
                                <p class="text-xs text-green-600 mb-1">Revenue</p>
                                <p class="text-lg font-bold text-green-700">KES ${company.revenue.toFixed(2)}</p>
                            </div>
                            <div class="bg-orange-50 rounded-lg p-3">
                                <p class="text-xs text-orange-600 mb-1">Labor Cost</p>
                                <p class="text-lg font-bold text-orange-700">KES ${company.labor_cost.toFixed(2)}</p>
                            </div>
                            <div class="${company.profit >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-3">
                                <p class="text-xs ${company.profit >= 0 ? 'text-green-600' : 'text-red-600'} mb-1">Profit</p>
                                <p class="text-lg font-bold ${company.profit >= 0 ? 'text-green-700' : 'text-red-700'}">
                                    KES ${company.profit.toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <div class="mt-4 bg-gray-50 rounded-lg p-3">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Buying Rate:</span>
                                <span class="font-medium">KES ${parseFloat(company.buying_rate).toFixed(2)} / kg</span>
                            </div>
                        </div>
                    </div>
                `).join('');

                document.getElementById('profitReport').innerHTML = `
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-semibold text-gray-800">Total Profit (All Companies)</h3>
                                <p class="text-sm text-gray-500">Wage rate: KES ${wage_rate_used.toFixed(2)} / kg</p>
                            </div>
                            <div class="text-3xl font-bold ${total_profit >= 0 ? 'text-green-600' : 'text-red-600'}">
                                KES ${total_profit.toFixed(2)}
                            </div>
                        </div>
                    </div>
                    
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">Per Company Breakdown</h2>
                    ${companyCards}
                `;
            }
        } catch (error) {
            document.getElementById('profitReport').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to generate report.</p>
                </div>
            `;
        }
    }
}
