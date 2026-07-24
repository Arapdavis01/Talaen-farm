// ============================================
// TALAEN FARM - Dairy Workers Management
// ============================================

class DairyWorkers {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Dairy Workers</h1>
                    <p class="text-gray-500">Manage dairy farm workers</p>
                </div>
                <button onclick="DairyWorkers.showAddForm()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                    <i class="fas fa-plus"></i> Add Worker
                </button>
            </div>
            <div id="dairyWorkersTable" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading workers...</p>
                </div>
            </div>
        `;

        await DairyWorkers.loadWorkers();
    }

    static async loadWorkers() {
        try {
            const response = await api.getDairyWorkers();
            
            if (response.success && response.workers.length > 0) {
                DairyWorkers.renderWorkersTable(response.workers);
            } else {
                document.getElementById('dairyWorkersTable').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-users text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500 mb-4">No dairy workers added yet.</p>
                        <button onclick="DairyWorkers.showAddForm()" 
                            class="text-green-600 hover:text-green-700 font-medium">
                            <i class="fas fa-plus mr-1"></i> Add your first worker
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('dairyWorkersTable').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load workers.</p>
                </div>
            `;
        }
    }

    static renderWorkersTable(workers) {
        const rows = workers.map(worker => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4" data-label="Name">
                    <div class="font-medium text-gray-800">${worker.full_name}</div>
                </td>
                <td class="px-6 py-4" data-label="Phone">
                    <span class="text-gray-600">${worker.phone || 'N/A'}</span>
                </td>
                <td class="px-6 py-4" data-label="Monthly Salary">
                    <span class="font-medium text-green-700">KES ${parseFloat(worker.monthly_salary).toFixed(2)}</span>
                </td>
                <td class="px-6 py-4" data-label="Status">
                    <span class="badge ${worker.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${worker.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4" data-label="Actions">
                    <button onclick="DairyWorkers.showEditForm('${worker.id}')" 
                        class="text-blue-600 hover:text-blue-800" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        document.getElementById('dairyWorkersTable').innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3">Name</th>
                            <th class="px-6 py-3">Phone</th>
                            <th class="px-6 py-3">Monthly Salary</th>
                            <th class="px-6 py-3">Status</th>
                            <th class="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    static showAddForm() {
        modal.openForm('Add Dairy Worker', `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" id="dairyWorkerName" required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" id="dairyWorkerPhone" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (KES)</label>
                <input type="number" id="dairyWorkerSalary" step="0.01" value="0" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Login Account</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm text-gray-600 mb-1">Username</label>
                        <input type="text" id="dairyWorkerUsername" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-600 mb-1">Password</label>
                        <input type="password" id="dairyWorkerPassword" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    </div>
                </div>
            </div>
        `, async (e) => {
            const workerData = {
                full_name: document.getElementById('dairyWorkerName').value,
                phone: document.getElementById('dairyWorkerPhone').value,
                monthly_salary: parseFloat(document.getElementById('dairyWorkerSalary').value),
                username: document.getElementById('dairyWorkerUsername').value,
                password: document.getElementById('dairyWorkerPassword').value
            };

            try {
                const response = await api.createDairyWorker(workerData);
                if (response.success) {
                    modal.close();
                    showToast('Worker added successfully!', 'success');
                    await DairyWorkers.loadWorkers();
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    static async showEditForm(workerId) {
        try {
            const response = await api.getDairyWorkers();
            const worker = response.workers.find(w => w.id === workerId);
            
            if (!worker) {
                showToast('Worker not found.', 'error');
                return;
            }

            modal.openForm('Edit Dairy Worker', `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" id="editDairyWorkerName" value="${worker.full_name}" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" id="editDairyWorkerPhone" value="${worker.phone || ''}" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (KES)</label>
                    <input type="number" id="editDairyWorkerSalary" value="${worker.monthly_salary}" step="0.01" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
            `, async (e) => {
                const workerData = {
                    full_name: document.getElementById('editDairyWorkerName').value,
                    phone: document.getElementById('editDairyWorkerPhone').value,
                    monthly_salary: parseFloat(document.getElementById('editDairyWorkerSalary').value)
                };

                try {
                    const response = await api.updateDairyWorker(workerId, workerData);
                    if (response.success) {
                        modal.close();
                        showToast('Worker updated successfully!', 'success');
                        await DairyWorkers.loadWorkers();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }, { submitText: 'Update' });
        } catch (error) {
            showToast('Error loading worker details.', 'error');
        }
    }
}
