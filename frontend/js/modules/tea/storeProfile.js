// ============================================
// TALAEN FARM - Store Manager Profile
// ============================================

class TeaStoreProfile {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mb-6"><h1 class="text-2xl font-bold text-slate-800 tracking-tight">👤 My Profile</h1><p class="text-stone-500 text-sm mt-1">Store Manager details</p></div>
            <div id="spContent"><div class="text-center py-12"><div class="spinner mx-auto"></div></div></div>
        `;
        await TeaStoreProfile.load();
    }

    static async load() {
        try {
            const res = await api.getProfile();
            if (res.success) {
                const user = res.user;
                document.getElementById('spContent').innerHTML = `
                    <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm max-w-2xl">
                        <div class="flex items-center gap-4 mb-6">
                            <div class="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-red-700">${user.full_name.charAt(0)}</div>
                            <div><h2 class="text-xl font-bold text-slate-800">${user.full_name}</h2><span class="badge bg-red-50 text-red-700 border border-red-200">Store Manager</span></div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-stone-50 rounded-xl p-4"><p class="text-xs text-stone-500 mb-1">Username</p><p class="font-semibold text-slate-800">${user.username}</p></div>
                            <div class="bg-stone-50 rounded-xl p-4"><p class="text-xs text-stone-500 mb-1">Phone</p><p class="font-semibold text-slate-800">${user.phone||'—'}</p></div>
                            <div class="bg-stone-50 rounded-xl p-4"><p class="text-xs text-stone-500 mb-1">Role</p><p class="font-semibold text-slate-800 capitalize">${user.role.replace('_',' ')}</p></div>
                            <div class="bg-stone-50 rounded-xl p-4"><p class="text-xs text-stone-500 mb-1">Status</p><span class="badge ${user.is_active?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-red-50 text-red-700 border-red-200'}">${user.is_active?'Active':'Inactive'}</span></div>
                            <div class="bg-stone-50 rounded-xl p-4 col-span-2"><p class="text-xs text-stone-500 mb-1">Joined</p><p class="font-semibold text-slate-800">${new Date(user.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p></div>
                        </div>
                    </div>`;
            }
        } catch (e) { document.getElementById('spContent').innerHTML = '<p class="text-red-500 text-center py-8">Failed to load.</p>'; }
    }
}
