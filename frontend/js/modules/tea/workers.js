// ============================================
// TALAEN FARM - Tea Workers Management
// ============================================

class TeaWorkers {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Tea Workers</h1>
                    <p class="text-gray-500">Manage tea pluckers and their accounts</p>
                </div>
                <button onclick="TeaWorkers.showAddForm()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                    <i class="fas fa-plus"></i> Add Worker
                </button>
            </div>
            <div id="workersTableContainer" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading workers...</p>
                </div>
            </div>
        `;

        await TeaWorkers.loadWorkers();
    }

    static async loadWorkers() {
        try {
            const response = await api.getTeaWorkers();
            
            if (response.success && response.workers.length > 0) {
                TeaWorkers.renderWorkersTable(response.workers);
            } else {
                document.getElementById('workersTableContainer').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-users text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500 mb-4">No workers added yet.</p>
                        <button onclick="TeaWorkers.showAddForm()" 
                            class="text-green-600 hover:text-green-700 font-medium">
                            <i class="fas fa-plus mr-1"></i> Add your first worker
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('workersTableContainer').innerHTML = `
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
                <td class="px-6 py-4" data-label="Account">
                    ${worker.users ? 
                        '<span class="badge bg-green-100 text-green-700"><i class="fas fa-check-circle mr-1"></i>Login Enabled</span>' : 
                        '<span class="badge bg-gray-100 text-gray-600"><i class="fas fa-minus-circle mr-1"></i>No Login</span>'}
                </td>
                <td class="px-6 py-4" data-label="Status">
                    <span class="badge ${worker.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${worker.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4" data-label="Actions">
                    <div class="flex gap-2">
                        <button onclick="TeaWorkers.showEditForm('${worker.id}')" 
                            class="text-blue-600 hover:text-blue-800" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="TeaWorkers.toggleStatus('${worker.id}', ${worker.is_active})" 
                            class="text-yellow-600 hover:text-yellow-800" title="${worker.is_active ? 'Deactivate' : 'Activate'}">
                            <i class="fas ${worker.is_active ? 'fa-ban' : 'fa-check'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        document.getElementById('workersTableContainer').innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3">Name</th>
                            <th class="px-6 py-3">Phone</th>
                            <th class="px-6 py-3">Account</th>
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
        modal.openForm('Add New Worker', `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" id="workerName" required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" id="workerPhone" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Login Account (Optional)</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm text-gray-600 mb-1">Username</label>
                        <input type="text" id="workerUsername" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-600 mb-1">Password</label>
                        <input type="password" id="workerPassword" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    </div>
                </div>
            </div>
        `, async (e) => {
            const workerData = {
                full_name: document.getElementById('workerName').value,
                phone: document.getElementById('workerPhone').value,
                username: document.getElementById('workerUsername').value,
                password: document.getElementById('workerPassword').value
            };

            try {
                const response = await api.createTeaWorker(workerData);
                if (response.success) {
                    modal.close();
                    showToast('Worker added successfully!', 'success');
                    await TeaWorkers.loadWorkers();
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    static async showEditForm(workerId) {
        try {
            const response = await api.getTeaWorkers();
            const worker = response.workers.find(w => w.id === workerId);
            
            if (!worker) {
                showToast('Worker not found.', 'error');
                return;
            }

            modal.openForm('Edit Worker', `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" id="editWorkerName" value="${worker.full_name}" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" id="editWorkerPhone" value="${worker.phone || ''}" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
            `, async (e) => {
                const workerData = {
                    full_name: document.getElementById('editWorkerName').value,
                    phone: document.getElementById('editWorkerPhone').value
                };

                try {
                    const response = await api.updateTeaWorker(workerId, workerData);
                    if (response.success) {
                        modal.close();
                        showToast('Worker updated successfully!', 'success');
                        await TeaWorkers.loadWorkers();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }, { submitText: 'Update' });
        } catch (error) {
            showToast('Error loading worker details.', 'error');
        }
    }

    static async toggleStatus(workerId, currentStatus) {
        const action = currentStatus ? 'deactivate' : 'activate';
        
        modal.openConfirm(
            `${currentStatus ? 'Deactivate' : 'Activate'} Worker`,
            `Are you sure you want to ${action} this worker?`,
            async () => {
                try {
                    const response = await api.updateTeaWorker(workerId, { is_active: !currentStatus });
                    if (response.success) {
                        showToast(`Worker ${action}d successfully!`, 'success');
                        await TeaWorkers.loadWorkers();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            },
            { 
                confirmText: currentStatus ? 'Deactivate' : 'Activate',
                confirmClass: currentStatus ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
            }
        );
    }
}
