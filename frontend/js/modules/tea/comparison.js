// ============================================
// TALAEN FARM - Plucking Comparison Panel
// ============================================

class TeaComparison {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Comparison Panel</h1>
                <p class="text-gray-500">Compare self-reported vs verified plucking</p>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Select Worker *</label>
                        <select id="compWorker" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                            <option value="">Select Worker</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Date (Optional)</label>
                        <input type="date" id="compDate" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    </div>
                    <div class="flex items-end">
                        <button onclick="TeaComparison.loadComparison()" 
                            class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-search mr-2"></i>Compare
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="comparisonResult">
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-balance-scale text-gray-300 text-5xl mb-4"></i>
                    <p>Select a worker and click Compare to view results.</p>
                </div>
            </div>
        `;

        await TeaComparison.loadWorkerList();
    }

    static async loadWorkerList() {
        try {
            const response = await api.getTeaWorkers();
            if (response.success) {
                const select = document.getElementById('compWorker');
                response.workers.forEach(worker => {
                    const option = document.createElement('option');
                    option.value = worker.id;
                    option.textContent = worker.full_name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load workers:', error);
        }
    }

    static async loadComparison() {
        const workerId = document.getElementById('compWorker').value;
        const date = document.getElementById('compDate').value;

        if (!workerId) {
            showToast('Please select a worker.', 'warning');
            return;
        }

        const resultDiv = document.getElementById('comparisonResult');
        resultDiv.innerHTML = `
            <div class="text-center py-8">
                <div class="spinner mx-auto"></div>
                <p class="text-gray-500 mt-3">Loading comparison...</p>
            </div>
        `;

        try {
            const response = await api.getComparison(workerId, date || null);
            
            if (response.success) {
                const { comparison } = response;
                
                const discrepancy = comparison.discrepancy;
                const discrepancyColor = discrepancy === 0 ? 'text-gray-600' : discrepancy > 0 ? 'text-green-600' : 'text-red-600';
                const discrepancyIcon = discrepancy === 0 ? 'fa-equals' : discrepancy > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                
                resultDiv.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <!-- Self Reported -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <i class="fas fa-user-edit text-blue-600"></i>
                                Self Reported
                            </h3>
                            <div class="text-3xl font-bold text-blue-600 mb-4">
                                ${comparison.self_reported.total_kg.toFixed(2)} kg
                            </div>
                            ${comparison.self_reported.records.length > 0 ? `
                                <div class="space-y-2">
                                    ${comparison.self_reported.records.map(r => `
                                        <div class="flex justify-between text-sm bg-blue-50 p-2 rounded">
                                            <span>${new Date(r.plucking_date).toLocaleDateString()} - ${r.companies?.name}</span>
                                            <span class="font-medium">${r.weight_kg} kg</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p class="text-gray-400 text-sm">No records</p>'}
                        </div>
                        
                        <!-- Verified -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <i class="fas fa-check-double text-green-600"></i>
                                Verified
                            </h3>
                            <div class="text-3xl font-bold text-green-600 mb-4">
                                ${comparison.verified.total_kg.toFixed(2)} kg
                            </div>
                            ${comparison.verified.records.length > 0 ? `
                                <div class="space-y-2">
                                    ${comparison.verified.records.map(r => `
                                        <div class="flex justify-between text-sm bg-green-50 p-2 rounded">
                                            <span>${new Date(r.plucking_date).toLocaleDateString()} - ${r.companies?.name}</span>
                                            <span class="font-medium">${r.weight_kg} kg</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p class="text-gray-400 text-sm">No records</p>'}
                        </div>
                    </div>
                    
                    <!-- Discrepancy -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">Discrepancy</h3>
                        <div class="text-4xl font-bold ${discrepancyColor} flex items-center justify-center gap-3">
                            <i class="fas ${discrepancyIcon}"></i>
                            ${Math.abs(discrepancy).toFixed(2)} kg
                        </div>
                        <p class="text-sm text-gray-500 mt-2">
                            ${discrepancy === 0 ? 'Perfect match!' : 
                              discrepancy > 0 ? 'Owner recorded more than worker' : 
                              'Worker recorded more than owner'}
                        </p>
                    </div>
                `;
            }
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load comparison.</p>
                </div>
            `;
        }
    }
}
