// ============================================
// TALAEN FARM - Fertilizer Schedule
// ============================================

class TeaFertilizerSchedule {
    static allSchedule = [];

    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h1 class="text-2xl font-bold text-slate-800 tracking-tight">📅 Fertilizer Schedule</h1><p class="text-stone-500 text-sm mt-1">Track fertilizer applications and plan future ones</p></div>
                <button onclick="TeaFertilizerSchedule.showAddForm()" class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-600/20"><i class="fas fa-plus"></i> Add Application</button>
            </div>
            <div id="fertContainer"><div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading schedule...</p></div></div>
        `;
        await TeaFertilizerSchedule.loadSchedule();
    }

    static async loadSchedule() {
        try {
            const res = await api.getFertilizerSchedule();
            if (res.success) { TeaFertilizerSchedule.allSchedule = res.schedule; TeaFertilizerSchedule.renderSchedule(res.schedule); }
            else { document.getElementById('fertContainer').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-calendar-check text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No fertilizer records.</p></div>'; }
        } catch (e) { document.getElementById('fertContainer').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-red-500">Failed to load.</p></div>'; }
    }

    static renderSchedule(items) {
        if (items.length === 0) { document.getElementById('fertContainer').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-calendar-check text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No fertilizer records.</p></div>'; return; }
        
        const today = new Date().toISOString().split('T')[0];
        
        const cards = items.map(f => {
            const isOverdue = f.next_application_date && f.next_application_date < today;
            return `
                <div class="bg-white rounded-2xl border ${isOverdue ? 'border-red-200 bg-red-50/20' : 'border-stone-200'} p-5 shadow-sm hover:border-emerald-300 transition-all">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">🧪</span>
                            <div>
                                <p class="font-semibold text-slate-800">${f.fertilizer_name}</p>
                                <p class="text-xs text-stone-400">${f.blocks?.name || 'N/A'}</p>
                            </div>
                        </div>
                        ${isOverdue ? '<span class="badge bg-red-50 text-red-700 border border-red-200">⚠️ Overdue</span>' : ''}
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div><span class="text-stone-500">Applied:</span> <span class="font-medium">${new Date(f.application_date).toLocaleDateString('en-GB')}</span></div>
                        ${f.next_application_date ? `<div><span class="text-stone-500">Next:</span> <span class="font-medium ${isOverdue ? 'text-red-600' : 'text-emerald-600'}">${new Date(f.next_application_date).toLocaleDateString('en-GB')}</span></div>` : ''}
                        <div><span class="text-stone-500">Qty:</span> <span class="font-medium">${f.quantity||'-'} ${f.unit||''}</span></div>
                        ${f.cost ? `<div><span class="text-stone-500">Cost:</span> <span class="font-medium text-amber-700">KES ${parseFloat(f.cost).toFixed(2)}</span></div>` : ''}
                    </div>
                    <div class="flex justify-end gap-1 pt-3 border-t border-stone-100">
                        <button onclick="TeaFertilizerSchedule.showEditForm('${f.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="TeaFertilizerSchedule.deleteItem('${f.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"><i class="fas fa-trash-alt text-xs"></i></button>
                    </div>
                </div>`;
        }).join('');

        document.getElementById('fertContainer').innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>`;
    }

    static async showAddForm() {
        try {
            const blocksRes = await api.getBlocks();
            const bOpts = blocksRes.blocks.filter(b=>b.is_active).map(b=>`<option value="${b.id}">${b.name}</option>`).join('');
            modal.openForm('Add Fertilizer Application', `
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2"><label class="block text-sm font-semibold text-slate-700 mb-1.5">Fertilizer Name *</label><input type="text" id="fName" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="e.g., NPK 17:17:17"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Quantity</label><input type="number" id="fQty" step="0.01" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Unit</label><select id="fUnit" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white"><option value="kg">kg</option><option value="bags">Bags</option><option value="litres">Litres</option></select></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Application Date *</label><input type="date" id="fDate" value="${new Date().toISOString().split('T')[0]}" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Next Application</label><input type="date" id="fNextDate" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Cost (KES)</label><input type="number" id="fCost" step="0.01" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Block</label><select id="fBlock" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white"><option value="">Select</option>${bOpts}</select></div>
                </div>
                <div class="mt-3"><label class="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label><textarea id="fNotes" rows="2" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></textarea></div>
            `, async () => {
                const data = { fertilizer_name: document.getElementById('fName').value, quantity: parseFloat(document.getElementById('fQty').value)||null, unit: document.getElementById('fUnit').value, application_date: document.getElementById('fDate').value, next_application_date: document.getElementById('fNextDate').value||null, cost: parseFloat(document.getElementById('fCost').value)||null, block_id: document.getElementById('fBlock').value||null, notes: document.getElementById('fNotes').value };
                try { const r = await api.addFertilizer(data); if (r.success) { modal.close(); showToast('Added!','success'); await TeaFertilizerSchedule.loadSchedule(); } } catch (e) { showToast(e.message,'error'); }
            }, { submitText: 'Add', submitIcon: 'fa-plus', icon: 'fa-calendar-check', size: 'max-w-xl' });
        } catch (e) { showToast('Error.','error'); }
    }

    static async showEditForm(id) {
        const f = TeaFertilizerSchedule.allSchedule.find(x=>x.id===id); if(!f){showToast('Not found.','error');return;}
        try {
            const blocksRes = await api.getBlocks();
            const bOpts = blocksRes.blocks.map(b=>`<option value="${b.id}" ${f.block_id===b.id?'selected':''}>${b.name}</option>`).join('');
            modal.openForm('Edit Fertilizer', `
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2"><label class="block text-sm font-semibold text-slate-700 mb-1.5">Name</label><input type="text" id="efName" value="${f.fertilizer_name}" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Qty</label><input type="number" id="efQty" value="${f.quantity||''}" step="0.01" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Unit</label><select id="efUnit" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white">${['kg','bags','litres'].map(u=>`<option value="${u}" ${f.unit===u?'selected':''}>${u}</option>`).join('')}</select></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Applied</label><input type="date" id="efDate" value="${f.application_date}" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Next</label><input type="date" id="efNext" value="${f.next_application_date||''}" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Cost</label><input type="number" id="efCost" value="${f.cost||''}" step="0.01" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Block</label><select id="efBlock" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white"><option value="">None</option>${bOpts}</select></div>
                </div>
                <div class="mt-3"><label class="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label><textarea id="efNotes" rows="2" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm">${f.notes||''}</textarea></div>
            `, async () => {
                const data = { fertilizer_name: document.getElementById('efName').value, quantity: parseFloat(document.getElementById('efQty').value)||null, unit: document.getElementById('efUnit').value, application_date: document.getElementById('efDate').value, next_application_date: document.getElementById('efNext').value||null, cost: parseFloat(document.getElementById('efCost').value)||null, block_id: document.getElementById('efBlock').value||null, notes: document.getElementById('efNotes').value };
                try { const r = await api.updateFertilizer(id, data); if (r.success) { modal.close(); showToast('Updated!','success'); await TeaFertilizerSchedule.loadSchedule(); } } catch (e) { showToast(e.message,'error'); }
            }, { submitText: 'Update', submitIcon: 'fa-save', icon: 'fa-edit', size: 'max-w-xl' });
        } catch (e) { showToast('Error.','error'); }
    }

    static async deleteItem(id) {
        modal.openConfirm('Delete','Delete this fertilizer record?',async()=>{
            try{const r=await api.deleteFertilizer(id);if(r.success){showToast('Deleted!','success');await TeaFertilizerSchedule.loadSchedule();}}catch(e){showToast(e.message,'error');}
        },{confirmText:'Delete',type:'danger'});
    }
}
