// ============================================
// TALAEN FARM - Milk Production Records
// ============================================

class DairyMilkProduction {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        const user = auth.getCurrentUser();
        const isWorker = user.role === 'dairy_worker';
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Milk Production</h1>
                    <p class="text-gray-500">${isWorker ? 'Record daily milk production' : 'View milk production records'}</p>
                </div>
                <button onclick="DairyMilkProduction.showAddForm()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                    <i class="fas fa-plus"></i> Record Production
                </button>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
                        <input type="date" id="prodDateFilter" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            onchange="DairyMilkProduction.loadRecords()">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Cow</label>
                        <select id="prodCowFilter" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            onchange="DairyMilkProduction.loadRecords()">
                            <option value="">All Cows</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button onclick="DairyMilkProduction.loadRecords()" 
                            class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-filter mr-2"></i>Apply Filters
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="productionRecords" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading records...</p>
                </div>
            </div>
        `;

        await DairyMilkProduction.loadCowFilter();
        await DairyMilkProduction.loadRecords();
    }

    static async loadCowFilter() {
        try {
            const response = await api.getCows();
            if (response.success) {
                const select = document.getElementById('prodCowFilter');
                response.cows.forEach(cow => {
                    const option = document.createElement('option');
                    option.value = cow.id;
                    option.textContent = cow.tag_number;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load cows:', error);
        }
    }

    static async loadRecords() {
        try {
            const params = {};
            const dateFilter = document.getElementById('prodDateFilter')?.value;
            const cowFilter = document.getElementById('prodCowFilter')?.value;
            
            if (dateFilter) params.date = dateFilter;
            if (cowFilter) params.cow_id = cowFilter;
            
            const response = await api.getMilkProduction(params);
            
            if (response.success && response.records.length > 0) {
                DairyMilkProduction.renderRecords(response.records);
            } else {
                document.getElementById('productionRecords').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-flask text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">No production records found.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('productionRecords').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load records.</p>
                </div>
            `;
        }
    }

    static renderRecords(records) {
        // Calculate totals
        const totalMorning = records.reduce((sum, r) => sum + parseFloat(r.morning_litres), 0);
        const totalEvening = records.reduce((sum, r) => sum + parseFloat(r.evening_litres), 0);
        const totalDaily = totalMorning + totalEvening;

        const rows = records.map(record => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4" data-label="Date">
                    ${new Date(record.production_date).toLocaleDateString()}
                </td>
                <td class="px-6 py-4" data-label="Cow">
                    <span class="font-medium">${record.cows?.tag_number || 'N/A'}</span>
                </td>
                <td class="px-6 py-4" data-label="Morning">
                    <span class="text-blue-600 font-medium">${parseFloat(record.morning_litres).toFixed(2)} L</span>
                </td>
                <td class="px-6 py-4" data-label="Evening">
                    <span class="text-purple-600 font-medium">${parseFloat(record.evening_litres).toFixed(2)} L</span>
                </td>
                <td class="px-6 py-4" data-label="Total">
                    <span class="font-bold text-green-700">${(parseFloat(record.morning_litres) + parseFloat(record.evening_litres)).toFixed(2)} L</span>
                </td>
                <td class="px-6 py-4" data-label="Worker">
                    ${record.dairy_workers?.full_name || 'N/A'}
                </td>
            </tr>
        `).join('');

        document.getElementById('productionRecords').innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3">Date</th>
                            <th class="px-6 py-3">Cow</th>
                            <th class="px-6 py-3">Morning</th>
                            <th class="px-6 py-3">Evening</th>
                            <th class="px-6 py-3">Total</th>
                            <th class="px-6 py-3">Worker</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${rows}
                    </tbody>
                    <tfoot class="bg-green-50 font-semibold">
                        <tr>
                            <td class="px-6 py-3" colspan="2">Totals</td>
                            <td class="px-6 py-3 text-blue-600">${totalMorning.toFixed(2)} L</td>
                            <td class="px-6 py-3 text-purple-600">${totalEvening.toFixed(2)} L</td>
                            <td class="px-6 py-3 text-green-700 text-lg">${totalDaily.toFixed(2)} L</td>
                            <td class="px-6 py-3"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    static async showAddForm() {
        try {
            const [cowsRes, workersRes] = await Promise.all([
                api.getCows(),
                api.getDairyWorkers()
            ]);

            const user = auth.getCurrentUser();
            const isWorker = user.role === 'dairy_worker';

            const cowOptions = cowsRes.cows
                .filter(c => c.is_active)
                .map(c => `<option value="${c.id}">${c.tag_number}${c.breed ? ' - ' + c.breed : ''}</option>`)
                .join('');

            modal.openForm('Record Milk Production', `
                ${!isWorker ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Worker *</label>
                        <select id="prodWorker" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                            <option value="">Select Worker</option>
                            ${workersRes.workers.filter(w => w.is_active).map(w => `<option value="${w.id}">${w.full_name}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Cow *</label>
                    <select id="prodCow" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                        <option value="">Select Cow</option>
                        ${cowOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" id="prodDate" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Morning (Litres)</label>
                        <input type="number" id="morningLitres" step="0.01" value="0" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Evening (Litres)</label>
                        <input type="number" id="eveningLitres" step="0.01" value="0" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea id="prodNotes" rows="2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"></textarea>
                </div>
            `, async (e) => {
                const productionData = {
                    worker_id: isWorker ? user.linked_worker_id : document.getElementById('prodWorker').value,
                    cow_id: document.getElementById('prodCow').value,
                    production_date: document.getElementById('prodDate').value,
                    morning_litres: parseFloat(document.getElementById('morningLitres').value) || 0,
                    evening_litres: parseFloat(document.getElementById('eveningLitres').value) || 0,
                    notes: document.getElementById('prodNotes').value
                };

                try {
                    const response = await api.recordMilkProduction(productionData);
                    if (response.success) {
                        modal.close();
                        showToast('Production recorded successfully!', 'success');
                        await DairyMilkProduction.loadRecords();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            });
        } catch (error) {
            showToast('Error loading form data.', 'error');
        }
    }
}
