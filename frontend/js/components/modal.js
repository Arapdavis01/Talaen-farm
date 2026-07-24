// ============================================
// TALAEN FARM - Modal Component
// ============================================

class Modal {
    constructor() {
        this.container = document.getElementById('modalContainer');
        this.content = document.getElementById('modalContent');
        this.isOpen = false;

        // Close on overlay click
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    open(title, content, options = {}) {
        const { size = 'max-w-lg', onClose } = options;

        this.content.innerHTML = `
            <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
                <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
                <button class="text-gray-400 hover:text-gray-600 transition-colors" onclick="modal.close()">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="p-6">
                ${content}
            </div>
        `;

        this.container.classList.remove('hidden');
        this.isOpen = true;
        this.onCloseCallback = onClose;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.container.classList.add('hidden');
        this.isOpen = false;
        document.body.style.overflow = '';

        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    // Helper to create form modal
    openForm(title, formFields, submitHandler, options = {}) {
        const { submitText = 'Save', submitClass = 'bg-green-600 hover:bg-green-700' } = options;

        const formHtml = `
            <form id="modalForm" class="space-y-4">
                ${formFields}
                <div class="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" onclick="modal.close()">
                        Cancel
                    </button>
                    <button type="submit" class="px-4 py-2 text-white ${submitClass} rounded-lg transition-colors">
                        ${submitText}
                    </button>
                </div>
            </form>
        `;

        this.open(title, formHtml, options);

        // Add submit handler
        setTimeout(() => {
            document.getElementById('modalForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await submitHandler(e);
            });
        }, 100);
    }

    // Helper for confirm dialogs
    openConfirm(title, message, confirmHandler, options = {}) {
        const { confirmText = 'Confirm', confirmClass = 'bg-red-600 hover:bg-red-700' } = options;

        const content = `
            <div class="text-center">
                <i class="fas fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
                <p class="text-gray-600 mb-6">${message}</p>
                <div class="flex justify-center gap-3">
                    <button class="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" onclick="modal.close()">
                        Cancel
                    </button>
                    <button id="confirmBtn" class="px-6 py-2 text-white ${confirmClass} rounded-lg transition-colors">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        this.open(title, content);

        setTimeout(() => {
            document.getElementById('confirmBtn').addEventListener('click', async () => {
                await confirmHandler();
                this.close();
            });
        }, 100);
    }
}

// Create global modal instance
const modal = new Modal();
