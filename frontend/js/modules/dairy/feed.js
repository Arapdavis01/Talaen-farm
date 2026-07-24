// ============================================
// TALAEN FARM - Feed Records
// ============================================

class DairyFeed {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        const user = auth.getCurrentUser();
        const isWorker = user.role === 'dairy_worker';
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Feed Records</h1>
                    <p class="text-gray-500">${isWorker ? 'Record feed given to cows' : 'View feed records'}</p>
                </div>
                <button onclick="DairyFeed.showAddForm()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                    <i class="fas fa-plus"></i> Record Feed
                </button>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
                        <input type="date" id="feedDateFilter" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            onchange="DairyFeed.loadRecords()">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Cow</label>
                        <select id="feedCowFilter" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            onchange="DairyFeed.loadRecords()">
                            <option value="">All Cows</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div id="feedRecords" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading records...</p>
                </div>
            </div>
        `;

        await DairyFeed.loadCowFilter();
        await DairyFeed.loadRecords();
    }

    static async loadCowFilter() {
        try {
            const response = await api.getCows();
            if (response.success) {
                const select = document.getElementById('feedCowFilter');
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
            const dateFilter = document.getElementById('feedDateFilter')?.value;
            const cowFilter = document.getElementById('feedCowFilter')?.value;
            
            if (dateFilter) params.date = dateFilter;
            if (cowFilter) params.cow_id = cowFilter;
            
            const response = await api.getFeed(params);
            
            if (response.success && response.records.length > 0) {
                DairyFeed.renderRecords(response.records);
            } else {
                document.getElementById('feedRecords').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-seedling text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">No feed records found.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('feedRecords').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load records.</p>
                </div>
            `;
        }
    }

    static renderRecords(records) {
        const totalFeed = records.reduce((sum, r) => sum + parseFloat(r.quantity_kg), 0);

        const rows = records.map(record => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4" data-label="Date">
                    ${new Date(record.feed_date).toLocaleDateString()}
                </td>
                <td class="px-6 py-4" data-label="Cow">
                    <span class="font-medium">${record.cows?.tag_number || 'N/A'}</span>
                </td>
                <td class="px-6 py-4" data-label="Feed Type">
                    ${record.feed_type}
                </td>
                <td class="px-6 py-4" data-label="Quantity">
                    <span class="font-medium text-green-700">${parseFloat(record.quantity_kg).toFixed(2)} kg</span>
                </td>
                <td class="px-6 py-4" data-label="Worker">
                    ${record.dairy_workers?.full_name || 'N/A'}
                </td>
            </tr>
        `).join('');

        document.getElementById('feedRecords').innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3">Date</th>
                            <th class="px-6 py-3">Cow</th>
                            <th class="px-6 py-3">Feed Type</th>
                            <th class="px-6 py-3">Quantity</th>
                            <th class="px-6 py-3">Worker</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${rows}
                    </tbody>
                    <tfoot class="bg-green-50 font-semibold">
                        <tr>
                            <td class="px-6 py-3" colspan="3">Total Feed</td>
                            <td class="px-6 py-3 text-green-700 text-lg">${totalFeed.toFixed(2)} kg</td>
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

            modal.openForm('Record Feed', `
                ${!isWorker ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Worker *</label>
                        <select id="feedWorker" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                            <option value="">Select Worker</option>
                            ${workersRes.workers.filter(w => w.is_active).map(w => `<option value="${w.id}">${w.full_name}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Cow *</label>
                    <select id="feedCow" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                        <option value="">Select Cow</option>
                        ${cowsRes.cows.filter(c => c.is_active).map(c => `<option value="${c.id}">${c.tag_number}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" id="feedDate" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Feed Type *</label>
                    <select id="feedType" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                        <option value="">Select Type</option>
                        <option value="Hay">Hay</option>
                        <option value="Silage">Silage</option>
                        <option value="Dairy Meal">Dairy Meal</option>
                        <option value="Napier Grass">Napier Grass</option>
                        <option value="Mineral Supplements">Mineral Supplements</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Quantity (kg) *</label>
                    <input type="number" id="feedQuantity" step="0.01" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea id="feedNotes" rows="2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"></textarea>
                </div>
            `, async (e) => {
                const feedData = {
                    worker_id: isWorker ? user.linked_worker_id : document.getElementById('feedWorker').value,
                    cow_id: document.getElementById('feedCow').value,
                    feed_date: document.getElementById('feedDate').value,
                    feed_type: document.getElementById('feedType').value,
                    quantity_kg: parseFloat(document.getElementById('feedQuantity').value),
                    notes: document.getElementById('feedNotes').value
                };

                try {
                    const response = await api.recordFeed(feedData);
                    if (response.success) {
                        modal.close();
                        showToast('Feed recorded successfully!', 'success');
                        await DairyFeed.loadRecords();
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
