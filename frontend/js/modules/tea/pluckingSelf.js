// ============================================
// TALAEN FARM - Self Plucking Records
// ============================================

class TeaPluckingSelf {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        const user = auth.getCurrentUser();
        const isWorker = user.role === 'tea_worker';
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Self Plucking Records</h1>
                    <p class="text-gray-500">${isWorker ? 'Record your daily plucking' : 'View worker self-reported plucking'}</p>
                </div>
                <button onclick="TeaPluckingSelf.showAddForm()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                    <i class="fas fa-plus"></i> Record Plucking
                </button>
            </div>
            
            ${!isWorker ? `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Worker</label>
                    <select id="workerFilter" class="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" onchange="TeaPluckingSelf.loadRecords()">
                        <option value="">All Workers</option>
                    </select>
                </div>
            ` : ''}
            
            <div id="pluckingRecords" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading records...</p>
                </div>
            </div>
        `;

        if (!isWorker) {
            await TeaPluckingSelf.loadWorkerFilter();
        }
        await TeaPluckingSelf.loadRecords();
    }

    static async loadWorkerFilter() {
        try {
            const response = await api.getTeaWorkers();
            if (response.success) {
                const select = document.getElementById('workerFilter');
                response.workers.forEach(worker => {
                    const option = document.createElement('option');
                    option.value = worker.id;
                    option.textContent = worker.full_name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load workers for filter:', error);
        }
    }

    static async loadRecords() {
        try {
            const user = auth.getCurrentUser();
            let workerId = null;
            
            if (user.role !== 'tea_worker') {
                workerId = document.getElementById('workerFilter')?.value || null;
            }
            
            const response = await api.getSelfPlucking(workerId);
            
            if (response.success && response.records.length > 0) {
                TeaPluckingSelf.renderRecords(response.records);
            } else {
                document.getElementById('pluckingRecords').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-leaf text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">No plucking records found.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('pluckingRecords').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load records.</p>
                </div>
            `;
        }
    }

    static renderRecords(records) {
        const rows = records.map(record => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4" data-label="Date">
                    ${new Date(record.plucking_date).toLocaleDateString()}
                </td>
                <td class="px-6 py-4" data-label="Worker">
                    ${record.tea_workers?.full_name || 'N/A'}
                </td>
                <td class="px-6 py-4" data-label="Company">
                    ${record.companies?.name || 'N/A'}
                </td>
                <td class="px-6 py-4" data-label="Block">
                    ${record.blocks?.name || 'N/A'}
                </td>
                <td class="px-6 py-4" data-label="Weight">
                    <span class="font-medium text-green-700">${parseFloat(record.weight_kg).toFixed(2)} kg</span>
                </td>
                <td class="px-6 py-4" data-label="Grade">
                    ${record.field_grade || '-'}
                </td>
            </tr>
        `).join('');

        document.getElementById('pluckingRecords').innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3">Date</th>
                            <th class="px-6 py-3">Worker</th>
                            <th class="px-6 py-3">Company</th>
                            <th class="px-6 py-3">Block</th>
                            <th class="px-6 py-3">Weight</th>
                            <th class="px-6 py-3">Grade</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    static async showAddForm() {
        try {
            const [workersRes, companiesRes, blocksRes] = await Promise.all([
                api.getTeaWorkers(),
                api.getCompanies(),
                api.getBlocks()
            ]);

            const user = auth.getCurrentUser();
            const isWorker = user.role === 'tea_worker';

            const workerOptions = isWorker 
                ? `<option value="${user.linked_worker_id}" selected>${user.full_name}</option>`
                : workersRes.workers.map(w => `<option value="${w.id}">${w.full_name}</option>`).join('');

            const companyOptions = companiesRes.companies
                .filter(c => c.is_active)
                .map(c => `<option value="${c.id}">${c.name} (KES ${c.buying_rate}/kg)</option>`)
                .join('');

            const blockOptions = blocksRes.blocks
                .filter(b => b.is_active)
                .map(b => `<option value="${b.id}">${b.name}</option>`)
                .join('');

            modal.openForm('Record Plucking', `
                ${!isWorker ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Worker *</label>
                        <select id="pluckingWorker" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                            <option value="">Select Worker</option>
                            ${workerOptions}
                        </select>
                    </div>
                ` : ''}
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" id="pluckingDate" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                    <select id="pluckingCompany" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                        <option value="">Select Company</option>
                        ${companyOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Block *</label>
                    <select id="pluckingBlock" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                        <option value="">Select Block</option>
                        ${blockOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
                    <input type="number" id="pluckingWeight" step="0.01" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        placeholder="Enter weight in kg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Field/Grade</label>
                    <input type="text" id="pluckingGrade" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        placeholder="e.g., Grade A">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea id="pluckingNotes" rows="2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"></textarea>
                </div>
            `, async (e) => {
                const pluckingData = {
                    worker_id: isWorker ? user.linked_worker_id : document.getElementById('pluckingWorker').value,
                    plucking_date: document.getElementById('pluckingDate').value,
                    company_id: document.getElementById('pluckingCompany').value,
                    block_id: document.getElementById('pluckingBlock').value,
                    weight_kg: parseFloat(document.getElementById('pluckingWeight').value),
                    field_grade: document.getElementById('pluckingGrade').value,
                    notes: document.getElementById('pluckingNotes').value
                };

                try {
                    const response = await api.recordSelfPlucking(pluckingData);
                    if (response.success) {
                        modal.close();
                        showToast('Plucking recorded successfully!', 'success');
                        await TeaPluckingSelf.loadRecords();
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
