// ============================================
// TALAEN FARM - Modal Component
// (Phone-friendly + App-aware + a11y)
// ============================================

class Modal {
    constructor() {
        this.container = document.getElementById('modalContainer');
        this.content = document.getElementById('modalContent');
        this.isOpen = false;
        this._closing = false;
        this._closable = true;
        this._closeTimer = null;
        this.onCloseCallback = null;

        this._ensureListeners();
    }

    // ---------- Listeners (idempotent) ----------
    _ensureListeners() {
        if (!this.container) this.container = document.getElementById('modalContainer');
        if (!this.content) this.content = document.getElementById('modalContent');
        if (!this.container) return;
        if (this._listenersAttached) return;
        this._listenersAttached = true;

        // Overlay click → close (only when closable)
        this.container.addEventListener('click', (e) => {
            if (!this._closable) return;
            if (e.target === this.container) this.close();
        });

        // Escape → close (desktop/web)
        document.addEventListener('keydown', (e) => {
            if (!this._closable) return;
            if (e.key === 'Escape' && this.isOpen) this.close();
        });

        // Prevent background scroll when overlay is touched
        this.container.addEventListener('touchmove', (e) => {
            if (e.target === this.container) e.preventDefault();
        }, { passive: false });

        // Delegated close: any element with [data-modal-close] closes the modal
        if (this.content) {
            this.content.addEventListener('click', (e) => {
                const t = e.target.closest('[data-modal-close]');
                if (t && this._closable) {
                    e.preventDefault();
                    this.close();
                }
            });
        }
    }

    // ---------- Escape helper ----------
    _escape(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ---------- Body scroll lock ----------
    _lockBody() {
        this._prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }

    _unlockBody() {
        document.body.style.overflow = this._prevOverflow || '';
        document.body.classList.remove('modal-open');
    }

    // ---------- Open ----------
    open(title, content, options = {}) {
        this._ensureListeners();
        if (!this.container || !this.content) {
            console.error('[Modal] container or content element missing');
            return;
        }

        // Cancel any in-flight close
        this._cancelPendingClose();

        const {
            size = 'max-w-lg',
            onClose,
            icon = 'fa-pen',
            closable = true
        } = options;

        this._closable = !!closable;
        this.onCloseCallback = onClose;

        const safeTitle = this._escape(title || '');
        const closeBtnHtml = this._closable
            ? `<button type="button" data-modal-close aria-label="Close"
                       class="w-9 h-9 flex items-center justify-center rounded-xl text-stone-400 active:text-slate-600 active:bg-stone-100 transition-all">
                   <i class="fas fa-times text-lg"></i>
               </button>`
            : '';

        this.content.className = `bg-white rounded-2xl shadow-2xl w-full ${size} max-h-[90vh] overflow-y-auto border border-stone-200`;
        this.content.setAttribute('role', 'dialog');
        this.content.setAttribute('aria-modal', 'true');
        this.content.style.overscrollBehavior = 'contain';

        this.content.innerHTML = `
            <!-- Drag Handle (visible only on mobile) -->
            <div class="sm:hidden flex justify-center pt-2 pb-1">
                <div class="w-10 h-1.5 bg-stone-300 rounded-full"></div>
            </div>

            <!-- Header -->
            <div class="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-stone-100 px-5 py-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 bg-gradient-to-br from-slate-100 to-stone-100 rounded-xl flex items-center justify-center shadow-sm border border-stone-200/50">
                        <i class="fas ${icon} text-slate-600 text-sm"></i>
                    </div>
                    <h3 class="text-base font-bold text-slate-800">${safeTitle}</h3>
                </div>
                ${closeBtnHtml}
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-5 py-4">
                ${content}
            </div>
        `;

        this.container.classList.remove('hidden');
        this.container.classList.add('is-open');
        this.container.dataset.modal = 'open';
        this.isOpen = true;

        this._lockBody();

        // Focus first focusable element in the modal, if any
        const focusable = this.content.querySelector(
            'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
        );
        if (focusable && this._closable) {
            try { focusable.focus({ preventScroll: true }); } catch (_) {}
        }
    }

    _cancelPendingClose() {
        if (this._closeTimer) {
            clearTimeout(this._closeTimer);
            this._closeTimer = null;
        }
        if (this.content) this.content.classList.remove('modal-closing');
        this._closing = false;
    }

    // ---------- Close ----------
    close(force = false) {
        if (!this.isOpen || this._closing) return;
        if (!force && !this._closable) return;

        this._closing = true;

        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;

            if (!this.container || !this.content) return;
            this.container.classList.add('hidden');
            this.container.classList.remove('is-open');
            delete this.container.dataset.modal;
            this.content.classList.remove('modal-closing');
            this.content.innerHTML = '';
            this.isOpen = false;
            this._closing = false;
            this._closable = true;
            this._unlockBody();

            const cb = this.onCloseCallback;
            this.onCloseCallback = null;
            if (typeof cb === 'function') {
                try { cb(); } catch (e) { console.error('[Modal] onClose error:', e); }
            }

            if (this._closeTimer) {
                clearTimeout(this._closeTimer);
                this._closeTimer = null;
            }
        };

        if (!this.content) { finish(); return; }

        this.content.classList.add('modal-closing');
        this.content.addEventListener('animationend', finish, { once: true });
        this._closeTimer = setTimeout(finish, 450);
    }

    // ---------- Convenience: Form ----------
    openForm(title, formFields, submitHandler, options = {}) {
        const {
            submitText = 'Save',
            submitClass = 'bg-gradient-to-r from-emerald-600 to-emerald-700 active:from-emerald-700 active:to-emerald-800 shadow-lg shadow-emerald-600/20',
            submitIcon = 'fa-check',
            icon = 'fa-pen',
            size = 'max-w-lg',
            autoClose = false,
            onClose
        } = options;

        const formHtml = `
            <form id="modalForm" class="space-y-4">
                ${formFields}
                <div class="sticky bottom-0 bg-white pt-3 border-t border-stone-100 flex justify-end gap-2">
                    <button type="button" data-modal-close
                            class="px-4 py-2.5 text-stone-600 bg-stone-100 active:bg-stone-200 rounded-xl font-medium text-sm min-h-[44px]">
                        Cancel
                    </button>
                    <button type="submit"
                            class="px-4 py-2.5 text-white ${submitClass} rounded-xl font-medium text-sm min-h-[44px] flex items-center gap-2">
                        <i class="fas ${submitIcon} text-sm"></i> ${submitText}
                    </button>
                </div>
            </form>
        `;

        this.open(title, formHtml, { icon, size, onClose });

        // Attach submit handler synchronously — the form exists in the DOM now
        const form = this.content.querySelector('#modalForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalHTML = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner spinner-sm spinner-white"></span> Processing...';
            }
            let succeeded = false;
            try {
                await submitHandler(e);
                succeeded = true;
            } catch (error) {
                if (typeof showToast === 'function') {
                    showToast(error.message || 'An error occurred', 'error');
                }
            } finally {
                if (submitBtn && document.body.contains(submitBtn)) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHTML;
                }
            }
            if (succeeded && autoClose) {
                this.close();
            }
        });
    }

    // ---------- Convenience: Confirm ----------
    openConfirm(title, message, confirmHandler, options = {}) {
        const {
            confirmText = 'Confirm',
            confirmClass = 'bg-gradient-to-r from-red-600 to-rose-600 active:from-red-700 active:to-rose-700',
            type = 'warning'
        } = options;

        const styles = {
            warning: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600', icon: 'fa-triangle-exclamation', border: 'amber' },
            danger:  { iconBg: 'bg-red-50',   iconColor: 'text-red-600',   icon: 'fa-trash-can',             border: 'red'   },
            info:    { iconBg: 'bg-sky-50',   iconColor: 'text-sky-600',   icon: 'fa-circle-info',           border: 'sky'   }
        };
        const s = styles[type] || styles.warning;
        const safeTitle = this._escape(title);
        const safeMessage = this._escape(message);

        const content = `
            <div class="text-center py-4">
                <div class="w-16 h-16 ${s.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 animate-bounceIn border border-${s.border}-200">
                    <i class="fas ${s.icon} ${s.iconColor} text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-2">${safeTitle}</h3>
                <p class="text-stone-500 mb-6">${safeMessage}</p>
                <div class="flex justify-center gap-3">
                    <button type="button" data-modal-close
                            class="px-5 py-2.5 text-stone-600 bg-stone-100 active:bg-stone-200 rounded-xl font-medium text-sm min-h-[44px]">
                        Cancel
                    </button>
                    <button type="button" id="confirmBtn"
                            class="px-5 py-2.5 text-white ${confirmClass} rounded-xl font-medium text-sm min-h-[44px] flex items-center gap-2">
                        <i class="fas fa-check text-sm"></i> ${confirmText}
                    </button>
                </div>
            </div>
        `;

        this.open(title, content, { icon: s.icon });

        const btn = this.content.querySelector('#confirmBtn');
        if (!btn) return;

        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner spinner-sm spinner-white"></span>';
            let succeeded = false;
            try {
                await confirmHandler();
                succeeded = true;
            } catch (error) {
                if (typeof showToast === 'function') {
                    showToast(error.message || 'Action failed', 'error');
                }
            } finally {
                if (document.body.contains(btn)) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fas fa-check text-sm"></i> ${confirmText}`;
                }
            }
            if (succeeded) this.close();
        });
    }

    // ---------- Convenience: Alert ----------
    openAlert(title, message, type = 'success', buttonText = 'OK') {
        const styles = {
            success: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', icon: 'fa-circle-check', btnClass: 'bg-emerald-600 active:bg-emerald-700' },
            error:   { iconBg: 'bg-red-50',     iconColor: 'text-red-600',     icon: 'fa-circle-xmark', btnClass: 'bg-red-600 active:bg-red-700' },
            info:    { iconBg: 'bg-sky-50',     iconColor: 'text-sky-600',     icon: 'fa-circle-info',  btnClass: 'bg-sky-600 active:bg-sky-700' }
        };
        const s = styles[type] || styles.success;
        const safeTitle = this._escape(title);
        const safeMessage = this._escape(message);

        const content = `
            <div class="text-center py-4">
                <div class="w-16 h-16 ${s.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 animate-bounceIn">
                    <i class="fas ${s.icon} ${s.iconColor} text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-2">${safeTitle}</h3>
                <p class="text-stone-500 mb-6">${safeMessage}</p>
                <button type="button" data-modal-close
                        class="px-6 py-2.5 text-white ${s.btnClass} rounded-xl font-medium text-sm min-h-[44px]">
                    ${this._escape(buttonText)}
                </button>
            </div>
        `;

        this.open(title, content, { icon: s.icon });
    }

    // ---------- Convenience: Loading ----------
    openLoading(message = 'Loading...') {
        const content = `
            <div class="text-center py-8">
                <div class="spinner spinner-lg mx-auto mb-4"></div>
                <p class="text-slate-600 font-medium">${this._escape(message)}</p>
                <p class="text-stone-400 text-sm mt-1">Please wait...</p>
            </div>
        `;
        this.open('', content, { icon: 'fa-spinner fa-spin', closable: false });
    }
}

// ---------- Global instance ----------
let modal;
document.addEventListener('DOMContentLoaded', () => {
    modal = new Modal();
    window.modal = modal;
});
