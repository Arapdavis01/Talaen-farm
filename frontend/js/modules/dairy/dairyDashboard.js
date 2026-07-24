// ============================================
// TALAEN FARM - Dairy Dashboard
// ============================================

class DairyDashboard {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Dairy Farm Dashboard</h1>
                <p class="text-gray-500">Overview of dairy farm operations</p>
            </div>
            <div id="dairyStats" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="text-center py-8 col-span-3">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading dashboard...</p>
                </div>
            </div>
        `;

        try {
            const response = await api.getDairyDashboard();
            
            if (response.success) {
                const { cow_count, today_milk_litres, monthly_revenue } = response.dashboard;
                
                document.getElementById('dairyStats').innerHTML = `
                    <div class="stat-card bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-cow text-blue-600 text-xl"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Total Cows</p>
                                <p class="text-2xl font-bold text-gray-800">${cow_count}</p>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-flask text-green-600 text-xl"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Today's Milk</p>
                                <p class="text-2xl font-bold text-gray-800">${today_milk_litres.toFixed(2)} L</p>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-chart-line text-purple-600 text-xl"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Monthly Revenue</p>
                                <p class="text-2xl font-bold text-gray-800">KES ${monthly_revenue.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('dairyStats').innerHTML = `
                <div class="col-span-3 text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load dashboard data.</p>
                </div>
            `;
        }
    }
}
