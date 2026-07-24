// ============================================
// TALAEN FARM - Tea Dashboard
// ============================================

class TeaDashboard {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Tea Farm Dashboard</h1>
                <p class="text-gray-500">Overview of tea farm operations</p>
            </div>
            <div id="dashboardStats" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading dashboard...</p>
                </div>
            </div>
        `;

        try {
            const response = await api.getTeaDashboard();
            
            if (response.success) {
                const { worker_count, today_kg, total_outstanding_debt } = response.dashboard;
                
                document.getElementById('dashboardStats').innerHTML = `
                    <div class="stat-card bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-users text-green-600 text-xl"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Active Workers</p>
                                <p class="text-2xl font-bold text-gray-800">${worker_count}</p>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-leaf text-blue-600 text-xl"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Today's Plucking</p>
                                <p class="text-2xl font-bold text-gray-800">${today_kg.toFixed(2)} kg</p>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-credit-card text-red-600 text-xl"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Outstanding Debts</p>
                                <p class="text-2xl font-bold text-gray-800">KES ${total_outstanding_debt.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('dashboardStats').innerHTML = `
                <div class="col-span-3 text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load dashboard data.</p>
                </div>
            `;
        }
    }
}
