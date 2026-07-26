// ============================================
// TALAEN FARM - Worker Profile
// ============================================

class TeaWorkerProfile {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6"><h1 class="text-2xl font-bold text-slate-800 tracking-tight">👤 My Profile</h1><p class="text-stone-500 text-sm mt-1">Your personal details</p></div>
            <div id="wprofContent"><div class="text-center py-12"><div class="spinner mx-auto"></div></div></div>
        `;
        await TeaWorkerProfile.load();
    }

    static async load() {
        try {
            const user = auth.getCurrentUser();
            const workersRes = await api.getTeaWorkers();
            const worker = workersRes.workers.find(w => w.user_id === user.id);

            if (worker) {
                document.getElementById('wprofContent').innerHTML = `
                    <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm max-w-2xl">
                        <div class="flex items-center gap-4 mb-6">
                            <div class="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-emerald-700">${worker.full_name.charAt(0)}</div>
                            <div><h2 class="text-xl font-bold text-slate-800">${worker.full_name}</h2><span class="badge bg-emerald-50 text-emerald-700 border border-emerald-200">${worker.worker_type||'Permanent'}</span></div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-stone-50 rounded-xl p-4"><p class="text-xs text-stone-500 mb-1">Phone</p><p class="font-semibold text-slate-800">${worker.phone||'—'}</p></div>
                            <div class="bg-stone-50 rounded-xl p-4"><p class="text-xs text-stone-500 mb-1">ID Number</p><p class="font-semibold text-slate-800">${worker.id_number||'—'}</p></div>
                            <div class="bg-stone-50 rounded-xl p-4"><p class="text-xs text-stone-500 mb-1">Gender</p><p class="font-semibold text-slate-800 capitalize">${worker.gender||'—'}</p></div>
                            <div class="bg-stone-50 rounded-xl p-4"><p class="text-xs text-stone-500 mb-1">Date of Birth</p><p class="font-semibold text-slate-800">${worker.date_of_birth ? new Date(worker.date_of_birth).toLocaleDateString('en-GB') : '—'}</p></div>
                            <div class="bg-stone-50 rounded-xl p-4"><p class="text-xs text-stone-500 mb-1">Date Joined</p><p class="font-semibold text-slate-800">${worker.date_joined ? new Date(worker.date_joined).toLocaleDateString('en-GB') : '—'}</p></div>
                            <div class="bg-stone-50 rounded-xl p-4"><p class="text-xs text-stone-500 mb-1">Worker Type</p><p class="font-semibold text-slate-800 capitalize">${worker.worker_type||'—'}</p></div>
                            <div class="bg-stone-50 rounded-xl p-4"><p class="text-xs text-stone-500 mb-1">Total Kg Plucked</p><p class="font-semibold text-emerald-700">${(worker.total_kg||0).toFixed(2)} kg</p></div>
                            <div class="bg-stone-50 rounded-xl p-4"><p class="text-xs text-stone-500 mb-1">Current Debt</p><p class="font-semibold text-red-700">KES ${(worker.current_debt||0).toFixed(2)}</p></div>
                        </div>
                    </div>`;
            }
        } catch (e) { document.getElementById('wprofContent').innerHTML = '<p class="text-red-500 text-center py-8">Failed to load profile.</p>'; }
    }
}
