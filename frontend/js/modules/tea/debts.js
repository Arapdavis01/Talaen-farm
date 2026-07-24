// ============================================
// TALAEN FARM - Store Debts Management
// ============================================

class TeaDebts {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        const user = auth.getCurrentUser();
        const canAddDebt = ['farm_owner', 'supervisor', 'store_manager'].includes(user.role);
        const isWorker = user.role === 'tea_worker';
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Store Debts</h1>
                    <p class="text-gray-500">${isWorker ? 'Your store debt history' : 'Manage worker store debts'}</p>
                </div>
                ${canAddDebt ? `
                    <button onclick="TeaDebts.showAddForm()" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                        <i class="fas fa-plus"></i> Add Debt Entry
                    </button>
                ` : ''}
            </div>
            
            ${canAddDebt ? `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Worker</label>
                    <select id="debtWorkerFilter" class="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" onchange="TeaDebts.loadDebts()">
                        <option value="">All Workers</option>
                    </select>
                </div>
            ` : ''}
            
            ${isWorker ? '<div id="workerDebtSummary" class="mb-6"></div>' : ''}
            
            <div id="debtsTable" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading debts...</p>
                </div>
            </div>
        `;

        if (canAddDebt) {
            await TeaDebts.loadWorkerFilter();
        }
        await TeaDebts.loadDebts();
    }

    static async loadWorkerFilter() {
        try {
            const response = await api.getTeaWorkers();
            if (response.success) {
                const select = document.getElementById('debtWorkerFilter');
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

    static async loadDebts() {
        try {
            const user = auth.getCurrentUser();
            let workerId = null;
            
            if (['farm_owner', 'supervisor', 'store_manager'].includes(user.role)) {
                workerId = document.getElementById('debtWorkerFilter')?.value || null;
            }
            
            const response = await api.getDebts(workerId);
            
            if (response.success) {
                if (user.role === 'tea_worker') {
                    TeaDebts.renderWorkerDebtSummary(response.debts);
                }
                
                if (response.debts.length > 0) {
                    TeaDebts.renderDebtsTable(response.debts, user.role);
                } else {
                    document.getElementById('debtsTable').innerHTML = `
                        <div class="text-center py-12">
                            <i class="fas fa-credit-card text-gray-300 text-5xl mb-4"></i>
                            <p class="text-gray-500">No debt records found.</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            document.getElementById('debtsTable').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load debts.</p>
                </div>
            `;
        }
    }

    static renderWorkerDebtSummary(debts) {
        const totalUnsettled = debts
            .filter(d => !d.is_settled && !d.is_reversed)
            .reduce((sum, d) => sum + parseFloat(d.amount), 0);

        document.getElementById('workerDebtSummary').innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 ${totalUnsettled > 0 ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center">
                        <i class="fas fa-credit-card ${totalUnsettled > 0 ? 'text-red-600' : 'text-green-600'} text-xl"></i>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Current Debt Balance</p>
                        <p class="text-2xl font-bold ${totalUnsettled > 0 ? 'text-red-600' : 'text-green-600'}">
                            KES ${totalUnsettled.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    static renderDebtsTable(debts, role) {
        const canReverse = ['farm_owner', 'supervisor', 'store_manager'].includes(role);

        const rows = debts.map(debt => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4" data-label="Date">
                    ${new Date(debt.debt_date).toLocaleDateString()}
                </td>
                <td class="px-6 py-4" data-label="Worker">
                    ${debt.tea_workers?.full_name || 'N/A'}
                </td>
                <td class="px-6 py-4" data-label="Amount">
                    <span class="font-medium text-red-600">KES ${parseFloat(debt.amount).toFixed(2)}</span>
                </td>
                <td class="px-6 py-4" data-label="Description">
                    ${debt.description || '-'}
                </td>
                <td class="px-6 py-4" data-label="Status">
                    ${debt.is_reversed ? 
                        '<span class="badge bg-gray-100 text-gray-700">Reversed</span>' :
                        debt.is_settled ? 
                        '<span class="badge bg-green-100 text-green-700">Settled</span>' :
                        '<span class="badge bg-yellow-100 text-yellow-700">Unsettled</span>'}
                </td>
                ${canReverse ? `
                    <td class="px-6 py-4" data-label="Actions">
                        ${!debt.is_reversed && !debt.is_settled ? `
                            <button onclick="TeaDebts.reverseDebt('${debt.id}')" 
                                class="text-red-600 hover:text-red-800 text-sm">
                                <i class="fas fa-undo mr-1"></i>Reverse
                            </button>
                        ` : '-'}
                    </td>
                ` : ''}
            </tr>
        `).join('');

        document.getElementById('debtsTable').innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3">Date</th>
                            <th class="px-6 py-3">Worker</th>
                            <th class="px-6 py-3">Amount</th>
                            <th class="px-6 py-3">Description</th>
                            <th class="px-6 py-3">Status</th>
                            ${canReverse ? '<th class="px-6 py-3">Actions</th>' : ''}
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
            const workersRes = await api.getTeaWorkers();

            modal.openForm('Add Debt Entry', `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Worker *</label>
                    <select id="debtWorker" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                        <option value="">Select Worker</option>
                        ${workersRes.workers.filter(w => w.is_active).map(w => `<option value="${w.id}">${w.full_name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                    <input type="number" id="debtAmount" step="0.01" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" id="debtDate" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="debtDescription" rows="2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        placeholder="e.g., Maize flour, Cooking oil"></textarea>
                </div>
            `, async (e) => {
                const debtData = {
                    worker_id: document.getElementById('debtWorker').value,
                    amount: parseFloat(document.getElementById('debtAmount').value),
                    debt_date: document.getElementById('debtDate').value,
                    description: document.getElementById('debtDescription').value
                };

                try {
                    const response = await api.addDebt(debtData);
                    if (response.success) {
                        modal.close();
                        showToast('Debt recorded successfully!', 'success');
                        await TeaDebts.loadDebts();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            });
        } catch (error) {
            showToast('Error loading form data.', 'error');
        }
    }

    static async reverseDebt(debtId) {
        modal.openConfirm(
            'Reverse Debt',
            'Are you sure you want to reverse this debt entry? This action cannot be undone.',
            async () => {
                try {
                    const response = await api.reverseDebt(debtId, 'Reversed by user');
                    if (response.success) {
                        showToast('Debt reversed successfully!', 'success');
                        await TeaDebts.loadDebts();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            },
            { confirmText: 'Reverse', confirmClass: 'bg-red-600 hover:bg-red-700' }
        );
    }
}
