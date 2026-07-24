// ============================================
// TALAEN FARM - Dairy Cows Management
// ============================================

class DairyCows {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Cows</h1>
                    <p class="text-gray-500">Manage dairy cow records</p>
                </div>
                <button onclick="DairyCows.showAddForm()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                    <i class="fas fa-plus"></i> Add Cow
                </button>
            </div>
            <div id="cowsContainer" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading cows...</p>
                </div>
            </div>
        `;

        await DairyCows.loadCows();
    }

    static async loadCows() {
        try {
            const response = await api.getCows();
            
            if (response.success && response.cows.length > 0) {
                DairyCows.renderCowsGrid(response.cows);
            } else {
                document.getElementById('cowsContainer').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-cow text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500 mb-4">No cows added yet.</p>
                        <button onclick="DairyCows.showAddForm()" 
                            class="text-green-600 hover:text-green-700 font-medium">
                            <i class="fas fa-plus mr-1"></i> Add your first cow
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('cowsContainer').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load cows.</p>
                </div>
            `;
        }
    }

    static renderCowsGrid(cows) {
        const cards = cows.map(cow => `
            <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-cow text-blue-600 text-xl"></i>
                    </div>
                    <span class="badge ${cow.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${cow.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <h3 class="font-semibold text-gray-800 text-lg mb-2">Tag: ${cow.tag_number}</h3>
                <div class="space-y-2 text-sm text-gray-600">
                    <div class="flex justify-between">
                        <span>Breed:</span>
                        <span class="font-medium">${cow.breed || 'Not specified'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Date of Birth:</span>
                        <span class="font-medium">${cow.date_of_birth ? new Date(cow.date_of_birth).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    ${cow.notes ? `
                        <div class="pt-2 border-t">
                            <p class="text-xs text-gray-400">${cow.notes}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="flex gap-2 mt-4 pt-4 border-t">
                    <button onclick="DairyCows.showEditForm('${cow.id}')" 
                        class="flex-1 text-blue-600 hover:bg-blue-50 py-1.5 rounded text-sm transition-colors">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button onclick="DairyCows.deleteCow('${cow.id}', '${cow.tag_number}')" 
                        class="flex-1 text-red-600 hover:bg-red-50 py-1.5 rounded text-sm transition-colors">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
        `).join('');

        document.getElementById('cowsContainer').innerHTML = `
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${cards}
                </div>
            </div>
        `;
    }

    static showAddForm() {
        modal.openForm('Add New Cow', `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tag Number *</label>
                <input type="text" id="cowTagNumber" required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    placeholder="e.g., COW-001">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <select id="cowBreed" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    <option value="">Select Breed</option>
                    <option value="Friesian">Friesian</option>
                    <option value="Ayrshire">Ayrshire</option>
                    <option value="Jersey">Jersey</option>
                    <option value="Guernsey">Guernsey</option>
                    <option value="Cross Breed">Cross Breed</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" id="cowDob" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea id="cowNotes" rows="2" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"></textarea>
            </div>
        `, async (e) => {
            const cowData = {
                tag_number: document.getElementById('cowTagNumber').value,
                breed: document.getElementById('cowBreed').value,
                date_of_birth: document.getElementById('cowDob').value,
                notes: document.getElementById('cowNotes').value
            };

            try {
                const response = await api.createCow(cowData);
                if (response.success) {
                    modal.close();
                    showToast('Cow added successfully!', 'success');
                    await DairyCows.loadCows();
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    static async showEditForm(cowId) {
        try {
            const response = await api.getCows();
            const cow = response.cows.find(c => c.id === cowId);
            
            if (!cow) {
                showToast('Cow not found.', 'error');
                return;
            }

            modal.openForm('Edit Cow', `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tag Number *</label>
                    <input type="text" id="editCowTagNumber" value="${cow.tag_number}" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                    <select id="editCowBreed" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                        <option value="">Select Breed</option>
                        ${['Friesian', 'Ayrshire', 'Jersey', 'Guernsey', 'Cross Breed', 'Other']
                            .map(b => `<option value="${b}" ${cow.breed === b ? 'selected' : ''}>${b}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input type="date" id="editCowDob" value="${cow.date_of_birth || ''}" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea id="editCowNotes" rows="2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">${cow.notes || ''}</textarea>
                </div>
            `, async (e) => {
                const cowData = {
                    tag_number: document.getElementById('editCowTagNumber').value,
                    breed: document.getElementById('editCowBreed').value,
                    date_of_birth: document.getElementById('editCowDob').value,
                    notes: document.getElementById('editCowNotes').value
                };

                try {
                    const response = await api.updateCow(cowId, cowData);
                    if (response.success) {
                        modal.close();
                        showToast('Cow updated successfully!', 'success');
                        await DairyCows.loadCows();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }, { submitText: 'Update' });
        } catch (error) {
            showToast('Error loading cow details.', 'error');
        }
    }

    static deleteCow(cowId, tagNumber) {
        modal.openConfirm(
            'Delete Cow',
            `Are you sure you want to delete cow ${tagNumber}? This action cannot be undone.`,
            async () => {
                try {
                    const response = await api.deleteCow(cowId);
                    if (response.success) {
                        showToast('Cow deleted successfully!', 'success');
                        await DairyCows.loadCows();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                }
            },
            { confirmText: 'Delete', confirmClass: 'bg-red-600 hover:bg-red-700' }
        );
    }
}
