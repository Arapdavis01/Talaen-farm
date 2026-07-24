// ============================================
// TALAEN FARM - Verified Plucking Records
// ============================================

class TeaPluckingVerified {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Verified Plucking</h1>
                    <p class="text-gray-500">Owner verified plucking records</p>
                </div>
                <button onclick="TeaPluckingVerified.showAddForm()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                    <i class="fas fa-plus"></i> Record Verified Plucking
                </button>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Worker</label>
                <select id="verifiedWorkerFilter" class="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" onchange="TeaPluckingVerified.loadRecords()">
                    <option value="">All Workers</option>
                </select>
            </div>
            
            <div id="verifiedRecords" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading records...</p>
                </div>
            </div>
        `;

        await TeaPluckingVerified.loadWorkerFilter();
        await TeaPluckingVerified.loadRecords();
    }

    static async loadWorkerFilter() {
        try {
            const response = await api.getTeaWorkers();
            if (response.success) {
                const select = document.getElementById('verifiedWorkerFilter');
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

    static async loadRecords() {
        try {
            const workerId = document.getElementById('verifiedWorkerFilter')?.value || null;
            const response = await api.getVerifiedPlucking(workerId);
            
            if (response.success && response.records.length > 0) {
                TeaPluckingVerified.renderRecords(response.records);
            } else {
                document.getElementById('verifiedRecords').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-check-double text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">No verified plucking records found.</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('verifiedRecords').innerHTML = `
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
                <td class="px-6 py-4" data-label="Status">
                    <span class="badge ${record.is_settled ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}">
                        ${record.is_settled ? 'Settled' : 'Unsettled'}
                    </span>
                </td>
            </tr>
        `).join('');

        document.getElementById('verifiedRecords').innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3">Date</th>
                            <th class="px-6 py-3">Worker</th>
                            <th class="px-6 py-3">Company</th>
                            <th class="px-6 py-3">Block</th>
                            <th class="px-6 py-3">Weight</th>
                            <th class="px-6 py-3">Status</th>
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

            modal.openForm('Record Verified Plucking', `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Worker *</label>
                    <select id="vWorker" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                        <option value="">Select Worker</option>
                        ${workersRes.workers.map(w => `<option value="${w.id}">${w.full_name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" id="vDate" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                    <select id="vCompany" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                        <option value="">Select Company</option>
                        ${companiesRes.companies.filter(c => c.is_active).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Block *</label>
                    <select id="vBlock" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                        <option value="">Select Block</option>
                        ${blocksRes.blocks.filter(b => b.is_active).map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
                    <input type="number" id="vWeight" step="0.01" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Field/Grade</label>
                    <input type="text" id="vGrade" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea id="vNotes" rows="2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"></textarea>
                </div>
            `, async (e) => {
                const data = {
                    worker_id: document.getElementById('vWorker').value,
                    plucking_date: document.getElementById('vDate').value,
                    company_id: document.getElementById('vCompany').value,
                    block_id: document.getElementById('vBlock').value,
                    weight_kg: parseFloat(document.getElementById('vWeight').value),
                    field_grade: document.getElementById('vGrade').value,
                    notes: document.getElementById('vNotes').value
                };

                try {
                    const response = await api.recordVerifiedPlucking(data);
                    if (response.success) {
                        modal.close();
                        showToast('Verified plucking recorded!', 'success');
                        await TeaPluckingVerified.loadRecords();
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
