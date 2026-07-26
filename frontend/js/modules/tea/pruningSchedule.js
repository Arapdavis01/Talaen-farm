// ============================================
// TALAEN FARM - Pruning Schedule
// ============================================

class TeaPruningSchedule {
    static allSchedule = [];

    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h1 class="text-2xl font-bold text-slate-800 tracking-tight">✂️ Pruning Schedule</h1><p class="text-stone-500 text-sm mt-1">Track pruning activities and plan future pruning</p></div>
                <button onclick="TeaPruningSchedule.showAddForm()" class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-600/20"><i class="fas fa-plus"></i> Add Pruning</button>
            </div>
            <div id="pruneContainer"><div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading schedule...</p></div></div>
        `;
        await TeaPruningSchedule.loadSchedule();
    }

    static async loadSchedule() {
        try {
            const res = await api.getPruningSchedule();
            if (res.success) { TeaPruningSchedule.allSchedule = res.schedule; TeaPruningSchedule.renderSchedule(res.schedule); }
            else { document.getElementById('pruneContainer').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-scissors text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No pruning records.</p></div>'; }
        } catch (e) { document.getElementById('pruneContainer').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-red-500">Failed to load.</p></div>'; }
    }

    static renderSchedule(items) {
        if (items.length === 0) { document.getElementById('pruneContainer').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-scissors text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No pruning records.</p></div>'; return; }
        const today = new Date().toISOString().split('T')[0];
        
        const cards = items.map(p => {
            const isOverdue = p.next_pruning_date && p.next_pruning_date < today;
            return `
                <div class="bg-white rounded-2xl border ${isOverdue ? 'border-red-200 bg-red-50/20' : 'border-stone-200'} p-5 shadow-sm hover:border-emerald-300 transition-all">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">✂️</span>
                            <div>
                                <p class="font-semibold text-slate-800">${p.pruning_type||'Pruning'}</p>
                                <p class="text-xs text-stone-400">${p.blocks?.name||'N/A'}</p>
                            </div>
                        </div>
                        ${isOverdue ? '<span class="badge bg-red-50 text-red-700 border border-red-200">⚠️ Overdue</span>' : ''}
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div><span class="text-stone-500">Date:</span> <span class="font-medium">${new Date(p.pruning_date).toLocaleDateString('en-GB')}</span></div>
                        ${p.next_pruning_date ? `<div><span class="text-stone-500">Next:</span> <span class="font-medium ${isOverdue?'text-red-600':'text-emerald-600'}">${new Date(p.next_pruning_date).toLocaleDateString('en-GB')}</span></div>` : ''}
                        ${p.workers_count ? `<div><span class="text-stone-500">Workers:</span> <span class="font-medium">${p.workers_count}</span></div>` : ''}
                    </div>
                    <div class="flex justify-end gap-1 pt-3 border-t border-stone-100">
                        <button onclick="TeaPruningSchedule.showEditForm('${p.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="TeaPruningSchedule.deleteItem('${p.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"><i class="fas fa-trash-alt text-xs"></i></button>
                    </div>
                </div>`;
        }).join('');

        document.getElementById('pruneContainer').innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>`;
    }

    static async showAddForm() {
        try {
            const blocksRes = await api.getBlocks();
            const bOpts = blocksRes.blocks.filter(b=>b.is_active).map(b=>`<option value="${b.id}">${b.name}</option>`).join('');
            modal.openForm('Add Pruning Record', `
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Pruning Type</label><select id="pType" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white"><option value="Light">Light</option><option value="Medium">Medium</option><option value="Heavy">Heavy</option><option value="Maintenance">Maintenance</option></select></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Workers</label><input type="number" id="pWorkers" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm" placeholder="Number of workers"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Date *</label><input type="date" id="pDate" value="${new Date().toISOString().split('T')[0]}" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Next Pruning</label><input type="date" id="pNextDate" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div class="col-span-2"><label class="block text-sm font-semibold text-slate-700 mb-1.5">Block</label><select id="pBlock" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white"><option value="">Select</option>${bOpts}</select></div>
                </div>
                <div class="mt-3"><label class="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label><textarea id="pNotes" rows="2" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></textarea></div>
            `, async () => {
                const data = { pruning_type: document.getElementById('pType').value, workers_count: parseInt(document.getElementById('pWorkers').value)||null, pruning_date: document.getElementById('pDate').value, next_pruning_date: document.getElementById('pNextDate').value||null, block_id: document.getElementById('pBlock').value||null, notes: document.getElementById('pNotes').value };
                try { const r = await api.addPruning(data); if (r.success) { modal.close(); showToast('Added!','success'); await TeaPruningSchedule.loadSchedule(); } } catch (e) { showToast(e.message,'error'); }
            }, { submitText: 'Add', submitIcon: 'fa-plus', icon: 'fa-scissors', size: 'max-w-lg' });
        } catch (e) { showToast('Error.','error'); }
    }

    static async showEditForm(id) {
        const p = TeaPruningSchedule.allSchedule.find(x=>x.id===id); if(!p){showToast('Not found.','error');return;}
        try {
            const blocksRes = await api.getBlocks();
            const bOpts = blocksRes.blocks.map(b=>`<option value="${b.id}" ${p.block_id===b.id?'selected':''}>${b.name}</option>`).join('');
            modal.openForm('Edit Pruning', `
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Type</label><select id="epType" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white">${['Light','Medium','Heavy','Maintenance'].map(t=>`<option value="${t}" ${p.pruning_type===t?'selected':''}>${t}</option>`).join('')}</select></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Workers</label><input type="number" id="epWorkers" value="${p.workers_count||''}" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Date</label><input type="date" id="epDate" value="${p.pruning_date}" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Next</label><input type="date" id="epNext" value="${p.next_pruning_date||''}" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                    <div class="col-span-2"><label class="block text-sm font-semibold text-slate-700 mb-1.5">Block</label><select id="epBlock" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white"><option value="">None</option>${bOpts}</select></div>
                </div>
                <div class="mt-3"><label class="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label><textarea id="epNotes" rows="2" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm">${p.notes||''}</textarea></div>
            `, async () => {
                const data = { pruning_type: document.getElementById('epType').value, workers_count: parseInt(document.getElementById('epWorkers').value)||null, pruning_date: document.getElementById('epDate').value, next_pruning_date: document.getElementById('epNext').value||null, block_id: document.getElementById('epBlock').value||null, notes: document.getElementById('epNotes').value };
                try { const r = await api.updatePruning(id, data); if (r.success) { modal.close(); showToast('Updated!','success'); await TeaPruningSchedule.loadSchedule(); } } catch (e) { showToast(e.message,'error'); }
            }, { submitText: 'Update', submitIcon: 'fa-save', icon: 'fa-edit', size: 'max-w-lg' });
        } catch (e) { showToast('Error.','error'); }
    }

    static async deleteItem(id) {
        modal.openConfirm('Delete','Delete this pruning record?',async()=>{
            try{const r=await api.deletePruning(id);if(r.success){showToast('Deleted!','success');await TeaPruningSchedule.loadSchedule();}}catch(e){showToast(e.message,'error');}
        },{confirmText:'Delete',type:'danger'});
    }
}
