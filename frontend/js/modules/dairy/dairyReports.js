// ============================================
// TALAEN FARM - Dairy Reports
// ============================================

class DairyReports {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Dairy Reports</h1>
                <p class="text-gray-500">Summary of milk production, sales, and revenue</p>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 class="font-semibold text-gray-800 mb-4">Select Period</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input type="date" id="reportStartDate" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input type="date" id="reportEndDate" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    </div>
                    <div class="flex items-end">
                        <button onclick="DairyReports.generateReport()" 
                            class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-chart-bar mr-2"></i>Generate Report
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="reportResult">
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-chart-pie text-gray-300 text-5xl mb-4"></i>
                    <p>Select a date range and click Generate Report.</p>
                </div>
            </div>
        `;
    }

    static async generateReport() {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        const resultDiv = document.getElementById('reportResult');
        
        resultDiv.innerHTML = `
            <div class="text-center py-8">
                <div class="spinner mx-auto"></div>
                <p class="text-gray-500 mt-3">Generating report...</p>
            </div>
        `;

        try {
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            
            const response = await api.getDairyReport(params);
            
            if (response.success) {
                const { report } = response;
                
                resultDiv.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div class="stat-card bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-flask text-blue-600 text-xl"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">Total Milk Produced</p>
                                    <p class="text-2xl font-bold text-gray-800">${report.total_milk_produced.toFixed(2)} L</p>
                                </div>
                            </div>
                        </div>

                        <div class="stat-card bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-truck text-green-600 text-xl"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">Total Milk Sold</p>
                                    <p class="text-2xl font-bold text-gray-800">${report.total_milk_sold.toFixed(2)} L</p>
                                </div>
                            </div>
                        </div>

                        <div class="stat-card bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-chart-line text-purple-600 text-xl"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">Total Revenue</p>
                                    <p class="text-2xl font-bold text-green-700">KES ${report.total_revenue.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 class="font-semibold text-gray-800 mb-4">Report Summary</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between py-2 border-b">
                                <span class="text-gray-600">Period</span>
                                <span class="font-medium">${report.period.start} to ${report.period.end}</span>
                            </div>
                            <div class="flex justify-between py-2 border-b">
                                <span class="text-gray-600">Unsold Milk</span>
                                <span class="font-medium">${(report.total_milk_produced - report.total_milk_sold).toFixed(2)} L</span>
                            </div>
                            <div class="flex justify-between py-2 border-b">
                                <span class="text-gray-600">Sales Percentage</span>
                                <span class="font-medium">${report.total_milk_produced > 0 ? ((report.total_milk_sold / report.total_milk_produced) * 100).toFixed(1) : 0}%</span>
                            </div>
                            <div class="flex justify-between py-2">
                                <span class="text-gray-600">Average Price per Litre</span>
                                <span class="font-medium">KES ${report.total_milk_sold > 0 ? (report.total_revenue / report.total_milk_sold).toFixed(2) : '0.00'}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to generate report.</p>
                </div>
            `;
        }
    }
}
