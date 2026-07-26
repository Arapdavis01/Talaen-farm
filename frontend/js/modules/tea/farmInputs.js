// ============================================
// TALAEN FARM - Farm Inputs Management
// ============================================

class TeaFarmInputs {
    static allInputs = [];

    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h1 class="text-2xl font-bold text-slate-800 tracking-tight">🌱 Farm Inputs</h1><p class="text-stone-500 text-sm mt-1">Track fertilizers, pesticides, tools and other farm inputs</p></div>
                <button onclick="TeaFarmInputs.showAddForm()" class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-600/20"><i class="fas fa-plus"></i> Add Input</button>
            </div>
            <div id="inputsContainer"><div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading inputs...</p></div></div>
        `;
        await TeaFarmInputs.loadInputs();
    }

    static async loadInputs() {
        try {
            const res = await api.getFarmInputs();
            if (res.success) { TeaFarmInputs.allInputs = res.inputs; TeaFarmInputs.renderInputs(res.inputs); }
            else { document.getElementById('inputsContainer').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-seedling text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No inputs recorded yet.</p></div>'; }
        } catch (e) { document.getElementById('inputsContainer').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-red-500">Failed to load inputs.</p></div>'; }
    }

    static renderInputs(inputs) {
        if (inputs.length === 0) { document.getElementById('inputsContainer').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-seedling text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No inputs recorded yet.</p></div>'; return; }
        
        const getTypeIcon = (type) => {
            const icons = { fertilizer: '🧪', pesticide: '☠️', tool: '🔧', other: '📦' };
            return icons[type] || '📦';
        };

        const cards = inputs.map(i => `
            <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 transition-all">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${getTypeIcon(i.input_type)}</span>
                        <div>
                            <p class="font-semibold text-slate-800">${i.name}</p>
                            <p class="text-xs text-stone-400 capitalize">${i.input_type}</p>
                        </div>
                    </div>
                    <span class="badge bg-stone-50 text-stone-600 border border-stone-200">${i.blocks?.name || 'N/A'}</span>
                </div>
                <div class="flex flex-wrap gap-3 text-sm mb-3">
                    ${i.quantity ? `<span class="text-stone-600">📏 ${i.quantity} ${i.unit||''}</span>` : ''}
                    ${i.cost ? `<span class="text-amber-700 font-medium">💰 KES ${parseFloat(i.cost).toFixed(2)}</span>` : ''}
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-stone-100">
                    <span class="text-xs text-stone-400">📅 ${new Date(i.applied_date).toLocaleDateString('en-GB')}</span>
                    <div class="flex gap-1">
                        <button onclick="TeaFarmInputs.showEditForm('${i.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="TeaFarmInputs.deleteInput('${i.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"><i class="fas fa-trash-alt text-xs"></i></button>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('inputsContainer').innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>`;
    }

    static async showAddForm() {
        try {
            const blocksRes = await api.getBlocks();
            const blockOpts = blocksRes.blocks.filter(b => b.is_active).map(b => `<option value="${b.id}">${b.name}</option>`).join('');
            
            modal.openForm('Add Farm Input', `
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Type *</label><select id="inputType" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"><option value="">Select</option><option value="fertilizer">Fertilizer</option><option value="pesticide">Pesticide</option><option value="tool">Tool</option><option value="other">Other</option></select></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Name *</label><input type="text" id="inputName" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="e.g., NPK Fertilizer"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Quantity</label><input type="number" id="inputQty" step="0.01" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="Amount"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Unit</label><select id="inputUnit" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"><option value="">Select</option><option value="kg">kg</option><option value="litres">Litres</option><option value="pieces">Pieces</option><option value="bags">Bags</option></select></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Cost (KES)</label><input type="number" id="inputCost" step="0.01" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="0.00"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Block</label><select id="inputBlock" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"><option value="">Select Block</option>${blockOpts}</select></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Date</label><input type="date" id="inputDate" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></div>
                </div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5 mt-3">Notes</label><textarea id="inputNotes" rows="2" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></textarea></div>
            `, async () => {
                const data = { input_type: document.getElementById('inputType').value, name: document.getElementById('inputName').value, quantity: parseFloat(document.getElementById('inputQty').value)||null, unit: document.getElementById('inputUnit').value, cost: parseFloat(document.getElementById('inputCost').value)||null, block_id: document.getElementById('inputBlock').value||null, applied_date: document.getElementById('inputDate').value, notes: document.getElementById('inputNotes').value };
                try { const res = await api.addFarmInput(data); if (res.success) { modal.close(); showToast('Input added!','success'); await TeaFarmInputs.loadInputs(); } } catch (e) { showToast(e.message,'error'); }
            }, { submitText: 'Add Input', submitIcon: 'fa-plus', icon: 'fa-seedling', size: 'max-w-xl' });
        } catch (e) { showToast('Error loading form.','error'); }
    }

    static async showEditForm(id) {
        const input = TeaFarmInputs.allInputs.find(i => i.id === id);
        if (!input) { showToast('Not found.','error'); return; }
        try {
            const blocksRes = await api.getBlocks();
            const blockOpts = blocksRes.blocks.map(b => `<option value="${b.id}" ${input.block_id===b.id?'selected':''}>${b.name}</option>`).join('');
            modal.openForm('Edit Farm Input', `
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Type</label><select id="editInputType" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white">${['fertilizer','pesticide','tool','other'].map(t => `<option value="${t}" ${input.input_type===t?'selected':''}>${t}</option>`).join('')}</select></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Name</label><input type="text" id="editInputName" value="${input.name}" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Quantity</label><input type="number" id="editInputQty" value="${input.quantity||''}" step="0.01" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Unit</label><select id="editInputUnit" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white">${['kg','litres','pieces','bags'].map(u => `<option value="${u}" ${input.unit===u?'selected':''}>${u}</option>`).join('')}</select></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Cost (KES)</label><input type="number" id="editInputCost" value="${input.cost||''}" step="0.01" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Block</label><select id="editInputBlock" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white"><option value="">None</option>${blockOpts}</select></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Date</label><input type="date" id="editInputDate" value="${input.applied_date}" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                </div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5 mt-3">Notes</label><textarea id="editInputNotes" rows="2" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm">${input.notes||''}</textarea></div>
            `, async () => {
                const data = { input_type: document.getElementById('editInputType').value, name: document.getElementById('editInputName').value, quantity: parseFloat(document.getElementById('editInputQty').value)||null, unit: document.getElementById('editInputUnit').value, cost: parseFloat(document.getElementById('editInputCost').value)||null, block_id: document.getElementById('editInputBlock').value||null, applied_date: document.getElementById('editInputDate').value, notes: document.getElementById('editInputNotes').value };
                try { const res = await api.updateFarmInput(id, data); if (res.success) { modal.close(); showToast('Updated!','success'); await TeaFarmInputs.loadInputs(); } } catch (e) { showToast(e.message,'error'); }
            }, { submitText: 'Update', submitIcon: 'fa-save', icon: 'fa-edit', size: 'max-w-xl' });
        } catch (e) { showToast('Error.','error'); }
    }

    static async deleteInput(id) {
        modal.openConfirm('Delete Input', 'Delete this farm input record?', async () => {
            try { const res = await api.deleteFarmInput(id); if (res.success) { showToast('Deleted!','success'); await TeaFarmInputs.loadInputs(); } } catch (e) { showToast(e.message,'error'); }
        }, { confirmText: 'Delete', type: 'danger' });
    }
}
