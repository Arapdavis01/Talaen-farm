// ============================================
// TALAEN FARM - Phone‑Friendly Modal Component
// ============================================

class Modal {
    constructor() {
        this.container = document.getElementById('modalContainer');
        this.content = document.getElementById('modalContent');
        this.isOpen = false;

        // Close on overlay click
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) this.close();
        });

        // Close on Escape (desktop)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });

        // Prevent scrolling behind modal on touch devices
        this.container.addEventListener('touchmove', (e) => {
            if (e.target === this.container) e.preventDefault();
        }, { passive: false });
    }

    /**
     * Open the modal with any HTML content.
     * The keyboard does NOT open automatically – the user must tap a field.
     */
    open(title, content, options = {}) {
        const {
            size = 'max-w-lg',
            onClose,
            icon = 'fa-pen'
        } = options;

        this.content.innerHTML = `
            <!-- Drag Handle (visible only on mobile) -->
            <div class="sm:hidden flex justify-center pt-2 pb-1">
                <div class="w-10 h-1.5 bg-stone-300 rounded-full"></div>
            </div>

            <!-- Modal Header -->
            <div class="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-stone-100 px-5 py-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 bg-gradient-to-br from-slate-100 to-stone-100 rounded-xl flex items-center justify-center shadow-sm border border-stone-200/50">
                        <i class="fas ${icon} text-slate-600 text-sm"></i>
                    </div>
                    <h3 class="text-base font-bold text-slate-800">${title}</h3>
                </div>
                <button class="w-9 h-9 flex items-center justify-center rounded-xl text-stone-400 active:text-slate-600 active:bg-stone-100 transition-all min-tap"
                        onclick="modal.close()" title="Close">
                    <i class="fas fa-times text-lg"></i>
                </button>
            </div>

            <!-- Modal Body (scrollable) -->
            <div class="flex-1 overflow-y-auto px-5 py-4">
                ${content}
            </div>
        `;

        // Show container
        this.container.classList.remove('hidden');
        this.isOpen = true;
        this.onCloseCallback = onClose;

        // Prevent background scroll
        document.body.classList.add('no-scroll');

        // IMPORTANT: Do NOT auto-focus any input.
        // The user will see the form first, then tap to open the keyboard.
    }

    close() {
        if (!this.isOpen) return;

        // Trigger closing animation
        this.content.classList.add('modal-closing');

        const finishClose = () => {
            this.container.classList.add('hidden');
            this.content.classList.remove('modal-closing');
            this.isOpen = false;
            document.body.classList.remove('no-scroll');
            this.content.innerHTML = '';
            if (typeof this.onCloseCallback === 'function') this.onCloseCallback();
            this.content.removeEventListener('animationend', finishClose);
        };

        this.content.addEventListener('animationend', finishClose, { once: true });
        // Fallback
        setTimeout(finishClose, 400);
    }

    // ========== Convenience methods ==========

    openForm(title, formFields, submitHandler, options = {}) {
        const {
            submitText = 'Save',
            submitClass = 'bg-gradient-to-r from-emerald-600 to-emerald-700 active:from-emerald-700 active:to-emerald-800 shadow-lg shadow-emerald-600/20',
            submitIcon = 'fa-check',
            icon = 'fa-pen',
            size = 'max-w-lg'
        } = options;

        const formHtml = `
            <form id="modalForm" class="space-y-4">
                ${formFields}
                <div class="sticky bottom-0 bg-white pt-3 border-t border-stone-100 flex justify-end gap-2">
                    <button type="button"
                            class="px-4 py-2.5 text-stone-600 bg-stone-100 active:bg-stone-200 rounded-xl font-medium text-sm min-h-[44px]"
                            onclick="modal.close()">
                        Cancel
                    </button>
                    <button type="submit"
                            class="px-4 py-2.5 text-white ${submitClass} rounded-xl font-medium text-sm min-h-[44px] flex items-center gap-2">
                        <i class="fas ${submitIcon} text-sm"></i> ${submitText}
                    </button>
                </div>
            </form>
        `;

        this.open(title, formHtml, { icon, size });

        // Attach submit handler
        setTimeout(() => {
            const form = document.getElementById('modalForm');
            if (!form) return;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalHTML = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner spinner-sm spinner-white"></span> Processing...';
                try {
                    await submitHandler(e);
                } catch (error) {
                    showToast(error.message || 'An error occurred', 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHTML;
                }
            });
        }, 100);
    }

    openConfirm(title, message, confirmHandler, options = {}) {
        const {
            confirmText = 'Confirm',
            confirmClass = 'bg-gradient-to-r from-red-600 to-rose-600 active:from-red-700 active:to-rose-700',
            type = 'warning'
        } = options;

        const styles = {
            warning: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600', icon: 'fa-triangle-exclamation' },
            danger: { iconBg: 'bg-red-50', iconColor: 'text-red-600', icon: 'fa-trash-can' },
            info: { iconBg: 'bg-sky-50', iconColor: 'text-sky-600', icon: 'fa-circle-info' }
        };
        const s = styles[type] || styles.warning;

        const content = `
            <div class="text-center py-4">
                <div class="w-16 h-16 ${s.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 animate-bounceIn border border-${type === 'warning' ? 'amber' : type === 'danger' ? 'red' : 'sky'}-200">
                    <i class="fas ${s.icon} ${s.iconColor} text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-2">${title}</h3>
                <p class="text-stone-500 mb-6">${message}</p>
                <div class="flex justify-center gap-3">
                    <button class="px-5 py-2.5 text-stone-600 bg-stone-100 active:bg-stone-200 rounded-xl font-medium text-sm min-h-[44px]"
                            onclick="modal.close()">Cancel</button>
                    <button id="confirmBtn"
                            class="px-5 py-2.5 text-white ${confirmClass} rounded-xl font-medium text-sm min-h-[44px] flex items-center gap-2">
                        <i class="fas fa-check text-sm"></i> ${confirmText}
                    </button>
                </div>
            </div>
        `;

        this.open(title, content, { icon: s.icon });

        setTimeout(() => {
            const btn = document.getElementById('confirmBtn');
            if (btn) {
                btn.addEventListener('click', async () => {
                    btn.disabled = true;
                    btn.innerHTML = '<span class="spinner spinner-sm spinner-white"></span>';
                    try {
                        await confirmHandler();
                    } catch (error) {
                        showToast(error.message || 'Action failed', 'error');
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = `<i class="fas fa-check text-sm"></i> ${confirmText}`;
                    }
                    this.close();
                });
            }
        }, 100);
    }

    openAlert(title, message, type = 'success', buttonText = 'OK') {
        const styles = {
            success: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', icon: 'fa-circle-check', btnClass: 'bg-emerald-600 active:bg-emerald-700' },
            error: { iconBg: 'bg-red-50', iconColor: 'text-red-600', icon: 'fa-circle-xmark', btnClass: 'bg-red-600 active:bg-red-700' },
            info: { iconBg: 'bg-sky-50', iconColor: 'text-sky-600', icon: 'fa-circle-info', btnClass: 'bg-sky-600 active:bg-sky-700' }
        };
        const s = styles[type] || styles.success;

        const content = `
            <div class="text-center py-4">
                <div class="w-16 h-16 ${s.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 animate-bounceIn">
                    <i class="fas ${s.icon} ${s.iconColor} text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-2">${title}</h3>
                <p class="text-stone-500 mb-6">${message}</p>
                <button class="px-6 py-2.5 text-white ${s.btnClass} rounded-xl font-medium text-sm min-h-[44px]"
                        onclick="modal.close()">${buttonText}</button>
            </div>
        `;

        this.open(title, content, { icon: s.icon });
    }

    openLoading(message = 'Loading...') {
        const content = `
            <div class="text-center py-8">
                <div class="spinner spinner-lg mx-auto mb-4"></div>
                <p class="text-slate-600 font-medium">${message}</p>
                <p class="text-stone-400 text-sm mt-1">Please wait...</p>
            </div>
        `;
        this.open('', content, { icon: 'fa-spinner fa-spin' });
    }
}

// Create the global instance
const modal = new Modal();
