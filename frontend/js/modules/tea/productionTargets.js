// ============================================
// TALAEN FARM - Production Targets
// ============================================

class TeaProductionTargets {
    static allTargets = [];

    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h1 class="text-2xl font-bold text-slate-800 tracking-tight">🎯 Production Targets</h1><p class="text-stone-500 text-sm mt-1">Set and track daily production goals per block</p></div>
                <button onclick="TeaProductionTargets.showAddForm()" class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-600/20"><i class="fas fa-plus"></i> Set Target</button>
            </div>
            <div id="targetsContainer"><div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-stone-500 mt-3">Loading targets...</p></div></div>
        `;
        await TeaProductionTargets.loadTargets();
    }

    static async loadTargets() {
        try {
            const res = await api.getProductionTargets();
            if (res.success) { TeaProductionTargets.allTargets = res.targets; TeaProductionTargets.renderTargets(res.targets); }
            else { document.getElementById('targetsContainer').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-bullseye text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No targets set.</p></div>'; }
        } catch (e) { document.getElementById('targetsContainer').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><p class="text-red-500">Failed to load targets.</p></div>'; }
    }

    static renderTargets(targets) {
        if (targets.length === 0) { document.getElementById('targetsContainer').innerHTML = '<div class="bg-white rounded-2xl border border-stone-200 p-12 text-center"><i class="fas fa-bullseye text-stone-300 text-3xl mb-3"></i><p class="text-stone-500">No targets set.</p></div>'; return; }

        const rows = targets.map(t => {
            const achieved = parseFloat(t.achieved_kg||0);
            const target = parseFloat(t.target_kg);
            const pct = target > 0 ? Math.round((achieved/target)*100) : 0;
            return `
                <tr class="hover:bg-stone-50">
                    <td class="px-4 py-3">${new Date(t.target_date).toLocaleDateString('en-GB')}</td>
                    <td class="px-4 py-3">${t.blocks?.name||'N/A'}</td>
                    <td class="px-4 py-3"><span class="font-semibold text-slate-700">${target.toFixed(1)} kg</span></td>
                    <td class="px-4 py-3"><span class="font-semibold text-emerald-700">${achieved.toFixed(1)} kg</span></td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2"><div class="w-24 h-2 bg-stone-200 rounded-full overflow-hidden"><div class="h-full ${pct>=100?'bg-emerald-500':pct>=50?'bg-amber-500':'bg-red-500'} rounded-full" style="width:${Math.min(pct,100)}%"></div></div><span class="text-xs font-medium ${pct>=100?'text-emerald-600':pct>=50?'text-amber-600':'text-red-600'}">${pct}%</span></div>
                    </td>
                    <td class="px-4 py-3"><span class="badge ${t.status==='achieved'?'bg-emerald-50 text-emerald-700 border-emerald-200':t.status==='pending'?'bg-amber-50 text-amber-700 border-amber-200':'bg-stone-50 text-stone-500 border-stone-200'}">${t.status}</span></td>
                    <td class="px-4 py-3"><div class="flex gap-1"><button onclick="TeaProductionTargets.showEditForm('${t.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50"><i class="fas fa-edit text-xs"></i></button><button onclick="TeaProductionTargets.deleteTarget('${t.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"><i class="fas fa-trash-alt text-xs"></i></button></div></td>
                </tr>`;
        }).join('');

        document.getElementById('targetsContainer').innerHTML = `<div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"><div class="overflow-x-auto"><table class="responsive-table w-full"><thead><tr class="bg-stone-50/80 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wider"><th class="px-4 py-3">Date</th><th class="px-4 py-3">Block</th><th class="px-4 py-3">Target</th><th class="px-4 py-3">Achieved</th><th class="px-4 py-3">Progress</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Actions</th></tr></thead><tbody class="divide-y divide-stone-100">${rows}</tbody></table></div></div>`;
    }

    static async showAddForm() {
        try {
            const blocksRes = await api.getBlocks();
            const bOpts = blocksRes.blocks.filter(b=>b.is_active).map(b=>`<option value="${b.id}">${b.name}</option>`).join('');
            modal.openForm('Set Production Target', `
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Block *</label><select id="tBlock" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white"><option value="">Select</option>${bOpts}</select></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Target Date *</label><input type="date" id="tDate" value="${new Date().toISOString().split('T')[0]}" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Target (kg) *</label><input type="number" id="tKg" step="0.01" required class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm" placeholder="e.g., 50"></div>
            `, async () => {
                const data = { block_id: document.getElementById('tBlock').value, target_date: document.getElementById('tDate').value, target_kg: parseFloat(document.getElementById('tKg').value) };
                try { const r = await api.addProductionTarget(data); if (r.success) { modal.close(); showToast('Target set!','success'); await TeaProductionTargets.loadTargets(); } } catch (e) { showToast(e.message,'error'); }
            }, { submitText: 'Set Target', submitIcon: 'fa-bullseye', icon: 'fa-bullseye', size: 'max-w-md' });
        } catch (e) { showToast('Error.','error'); }
    }

    static async showEditForm(id) {
        const t = TeaProductionTargets.allTargets.find(x=>x.id===id); if(!t){showToast('Not found.','error');return;}
        try {
            const blocksRes = await api.getBlocks();
            const bOpts = blocksRes.blocks.map(b=>`<option value="${b.id}" ${t.block_id===b.id?'selected':''}>${b.name}</option>`).join('');
            modal.openForm('Edit Target', `
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Block</label><select id="etBlock" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white">${bOpts}</select></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Date</label><input type="date" id="etDate" value="${t.target_date}" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Target (kg)</label><input type="number" id="etKg" value="${t.target_kg}" step="0.01" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Achieved (kg)</label><input type="number" id="etAchieved" value="${t.achieved_kg||0}" step="0.01" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm"></div>
                <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Status</label><select id="etStatus" class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm bg-white"><option value="pending" ${t.status==='pending'?'selected':''}>Pending</option><option value="achieved" ${t.status==='achieved'?'selected':''}>Achieved</option></select></div>
            `, async () => {
                const data = { block_id: document.getElementById('etBlock').value, target_date: document.getElementById('etDate').value, target_kg: parseFloat(document.getElementById('etKg').value), achieved_kg: parseFloat(document.getElementById('etAchieved').value)||0, status: document.getElementById('etStatus').value };
                try { const r = await api.updateProductionTarget(id, data); if (r.success) { modal.close(); showToast('Updated!','success'); await TeaProductionTargets.loadTargets(); } } catch (e) { showToast(e.message,'error'); }
            }, { submitText: 'Update', submitIcon: 'fa-save', icon: 'fa-edit', size: 'max-w-md' });
        } catch (e) { showToast('Error.','error'); }
    }

    static async deleteTarget(id) {
        modal.openConfirm('Delete Target','Delete this production target?',async()=>{
            try{const r=await api.deleteProductionTarget(id);if(r.success){showToast('Deleted!','success');await TeaProductionTargets.loadTargets();}}catch(e){showToast(e.message,'error');}
        },{confirmText:'Delete',type:'danger'});
    }
}
