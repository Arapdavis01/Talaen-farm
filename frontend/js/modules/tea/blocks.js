// ============================================
// TALAEN FARM - Blocks Management
// ============================================

class TeaBlocks {

    // ---------- Helpers ----------
    static _esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    static _validateForm() {
        const form = document.getElementById('modalForm');
        if (form && !form.checkValidity()) {
            form.reportValidity();
            throw new Error('Please fill all required fields');
        }
    }

    static _haptic(ms = 10) {
        if (window.TALAEN && window.TALAEN.isAndroidApp && navigator.vibrate) {
            try { navigator.vibrate(ms); } catch (_) {}
        }
    }

    // ---------- Show ----------
    static async show() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Farm Blocks</h1>
                    <p class="text-stone-500 text-sm mt-1">Manage tea farm blocks and sections</p>
                </div>
                <button onclick="TeaBlocks.showAddForm()" 
                    class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl active:from-emerald-700 active:to-emerald-800 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-600/20 min-h-[44px] self-start">
                    <i class="fas fa-plus"></i> Add Block
                </button>
            </div>
            
            <div id="blocksTableContainer">
                <div class="text-center py-12">
                    <div class="spinner mx-auto"></div>
                    <p class="text-stone-500 mt-3">Loading blocks...</p>
                </div>
            </div>
        `;

        await TeaBlocks.loadBlocks();
    }

    // ---------- Load ----------
    static async loadBlocks() {
        const container = document.getElementById('blocksTableContainer');
        if (!container) return;

        try {
            const response = await api.getBlocks();
            
            if (response && response.success && Array.isArray(response.blocks) && response.blocks.length > 0) {
                TeaBlocks.renderBlocksGrid(response.blocks);
            } else {
                container.innerHTML = `
                    <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                        <div class="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-map text-stone-300 text-2xl"></i>
                        </div>
                        <p class="text-stone-500 mb-4">No blocks added yet.</p>
                        <button onclick="TeaBlocks.showAddForm()" 
                            class="text-emerald-600 active:text-emerald-700 font-medium min-h-[44px]">
                            <i class="fas fa-plus mr-1"></i> Add your first block
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('[TeaBlocks] Load failed:', error);
            container.innerHTML = `
                <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500 mb-3">Failed to load blocks.</p>
                    <button onclick="TeaBlocks.loadBlocks()" 
                        class="text-emerald-600 font-medium text-sm min-h-[44px]">
                        <i class="fas fa-rotate-right mr-1"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    // ---------- Render Grid ----------
    static renderBlocksGrid(blocks) {
        const container = document.getElementById('blocksTableContainer');
        if (!container) return;

        const cards = blocks.map(block => `
            <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:border-emerald-300 transition-all">
                <div class="flex items-start justify-between mb-3">
                    <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-map-pin text-emerald-600 text-lg"></i>
                    </div>
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        block.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }">
                        ${block.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <h3 class="font-bold text-slate-800 text-lg mb-1">${TeaBlocks._esc(block.name)}</h3>
                <p class="text-sm text-stone-500 line-clamp-2">${TeaBlocks._esc(block.description || 'No description provided.')}</p>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${cards}
            </div>
        `;
    }

    // ---------- Add Block ----------
    static showAddForm() {
        modal.openForm('Add New Block', `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Block Name *</label>
                    <input type="text" id="blockName" required placeholder="e.g., Block A"
                        autocomplete="off" enterkeyhint="next"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[48px]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                    <textarea id="blockDescription" rows="3" placeholder="Optional details about this block..."
                        enterkeyhint="done"
                        class="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[90px]"></textarea>
                </div>
            </div>
        `, async () => {
            TeaBlocks._validateForm();

            const name = document.getElementById('blockName').value.trim();
            if (!name) throw new Error('Block name is required');

            const blockData = {
                name: name,
                description: document.getElementById('blockDescription').value.trim()
            };

            const response = await api.createBlock(blockData);
            if (response && response.success !== false) {
                modal.close();
                TeaBlocks._haptic(15);
                if (typeof showToast === 'function') showToast('Block added successfully!', 'success');
                await TeaBlocks.loadBlocks();
            } else {
                throw new Error((response && response.message) || 'Failed to add block');
            }
        }, { 
            submitText: 'Add Block', 
            submitIcon: 'fa-map-pin', 
            icon: 'fa-map-pin',
            autoClose: false
        });
    }
}
