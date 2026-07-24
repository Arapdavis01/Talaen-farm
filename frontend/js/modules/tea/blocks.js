// ============================================
// TALAEN FARM - Blocks Management
// ============================================

class TeaBlocks {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Farm Blocks</h1>
                    <p class="text-gray-500">Manage tea farm blocks and sections</p>
                </div>
                <button onclick="TeaBlocks.showAddForm()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start">
                    <i class="fas fa-plus"></i> Add Block
                </button>
            </div>
            <div id="blocksTableContainer" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading blocks...</p>
                </div>
            </div>
        `;

        await TeaBlocks.loadBlocks();
    }

    static async loadBlocks() {
        try {
            const response = await api.getBlocks();
            
            if (response.success && response.blocks.length > 0) {
                TeaBlocks.renderBlocksGrid(response.blocks);
            } else {
                document.getElementById('blocksTableContainer').innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-map text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500 mb-4">No blocks added yet.</p>
                        <button onclick="TeaBlocks.showAddForm()" 
                            class="text-green-600 hover:text-green-700 font-medium">
                            <i class="fas fa-plus mr-1"></i> Add your first block
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('blocksTableContainer').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load blocks.</p>
                </div>
            `;
        }
    }

    static renderBlocksGrid(blocks) {
        const cards = blocks.map(block => `
            <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-3">
                    <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-map-pin text-green-600"></i>
                    </div>
                    <span class="badge ${block.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${block.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <h3 class="font-semibold text-gray-800 mb-1">${block.name}</h3>
                <p class="text-sm text-gray-500">${block.description || 'No description'}</p>
            </div>
        `).join('');

        document.getElementById('blocksTableContainer').innerHTML = `
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${cards}
                </div>
            </div>
        `;
    }

    static showAddForm() {
        modal.openForm('Add New Block', `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Block Name *</label>
                <input type="text" id="blockName" required placeholder="e.g., Block A"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea id="blockDescription" rows="3" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"></textarea>
            </div>
        `, async (e) => {
            const blockData = {
                name: document.getElementById('blockName').value,
                description: document.getElementById('blockDescription').value
            };

            try {
                const response = await api.createBlock(blockData);
                if (response.success) {
                    modal.close();
                    showToast('Block added successfully!', 'success');
                    await TeaBlocks.loadBlocks();
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }
}
