// ============================================
// TALAEN FARM - Modal Component (Mobile Optimized)
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

        // Close on Escape key (desktop only)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Prevent touch move on modal background
        this.container.addEventListener('touchmove', (e) => {
            if (e.target === this.container) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    open(title, content, options = {}) {
        const { size = 'max-w-lg', onClose, icon = 'fa-pen' } = options;

        const isMobile = window.innerWidth < 640;
        const mobileClass = isMobile ? 'rounded-t-2xl' : 'rounded-2xl';
        
        this.content.className = `bg-white ${mobileClass} shadow-2xl w-full ${isMobile ? '' : size} ${isMobile ? 'max-h-[92vh]' : 'max-h-[90vh]'} flex flex-col overflow-hidden border border-stone-200`;
        
        this.content.innerHTML = `
            <!-- Drag Handle (Mobile only) -->
            ${isMobile ? '<div class="flex-shrink-0 flex justify-center pt-2 pb-1"><div class="w-10 h-1.5 bg-stone-300 rounded-full"></div></div>' : ''}
            
            <!-- Modal Header - Fixed -->
            <div class="flex-shrink-0 bg-white/98 backdrop-blur-md border-b border-stone-100 px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between z-10 ${isMobile ? 'rounded-t-2xl' : 'rounded-t-2xl'}">
                <div class="flex items-center gap-2 sm:gap-3">
                    <div class="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-100 to-stone-100 rounded-xl flex items-center justify-center shadow-sm border border-stone-200/50">
                        <i class="fas ${icon} text-slate-600 text-xs sm:text-sm"></i>
                    </div>
                    <h3 class="text-base sm:text-lg font-bold text-slate-800 tracking-tight">${title}</h3>
                </div>
                <button class="w-9 h-9 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-stone-400 active:text-slate-600 active:bg-stone-100 transition-all min-tap" 
                        onclick="modal.close()" title="Close">
                    <i class="fas fa-times text-lg"></i>
                </button>
            </div>
            
            <!-- Modal Body - Scrollable -->
            <div class="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-6">
                ${content}
            </div>
        `;

        this.container.classList.remove('hidden');
        this.isOpen = true;
        this.onCloseCallback = onClose;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        document.body.classList.add('no-scroll');
        
        // Focus trap - focus first input if exists
        setTimeout(() => {
            const firstInput = this.content.querySelector('input:not([type="hidden"]), select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 300);
    }

    close() {
        this.content.classList.add('modal-closing');
        
        setTimeout(() => {
            this.container.classList.add('hidden');
            this.content.classList.remove('modal-closing');
            this.isOpen = false;
            document.body.style.overflow = '';
            document.body.classList.remove('no-scroll');
        }, 200);

        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    // Helper to create form modal
    openForm(title, formFields, submitHandler, options = {}) {
        const { 
            submitText = 'Save', 
            submitClass = 'bg-gradient-to-r from-emerald-600 to-emerald-700 active:from-emerald-700 active:to-emerald-800 shadow-lg shadow-emerald-600/20',
            submitIcon = 'fa-check',
            icon = 'fa-pen',
            size = 'max-w-lg'
        } = options;

        const formHtml = `
            <form id="modalForm" class="space-y-4 sm:space-y-5">
                ${formFields}
                
                <!-- Form Actions - Sticky at bottom -->
                <div class="sticky bottom-0 bg-white pt-3 sm:pt-4 pb-1 border-t border-stone-100 flex justify-end gap-2 sm:gap-3">
                    <button type="button" 
                            class="px-4 sm:px-5 py-2.5 text-stone-600 bg-stone-100 active:bg-stone-200 rounded-xl transition-all font-medium flex items-center gap-2 text-sm min-h-[44px]"
                            onclick="modal.close()">
                        <i class="fas fa-times text-sm"></i> Cancel
                    </button>
                    <button type="submit" 
                            class="px-4 sm:px-5 py-2.5 text-white ${submitClass} rounded-xl transition-all font-medium flex items-center gap-2 text-sm min-h-[44px]">
                        <i class="fas ${submitIcon} text-sm"></i> ${submitText}
                    </button>
                </div>
            </form>
        `;

        this.open(title, formHtml, { size, icon });

        setTimeout(() => {
            const form = document.getElementById('modalForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const submitBtn = form.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `
                        <span class="spinner spinner-sm spinner-white"></span>
                        Processing...
                    `;
                    
                    try {
                        await submitHandler(e);
                    } catch (error) {
                        console.error('Form submit error:', error);
                        showToast(error.message || 'An error occurred', 'error');
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }
                });
            }
        }, 100);
    }

    // Helper for confirm dialogs
    openConfirm(title, message, confirmHandler, options = {}) {
        const { 
            confirmText = 'Confirm', 
            confirmClass = 'bg-gradient-to-r from-red-600 to-rose-600 active:from-red-700 active:to-rose-700 shadow-lg shadow-red-600/20',
            confirmIcon = 'fa-check',
            type = 'warning'
        } = options;

        const typeStyles = {
            warning: {
                iconBg: 'bg-amber-50',
                iconColor: 'text-amber-600',
                icon: 'fa-triangle-exclamation',
                borderColor: 'border-amber-200'
            },
            danger: {
                iconBg: 'bg-red-50',
                iconColor: 'text-red-600',
                icon: 'fa-trash-can',
                borderColor: 'border-red-200'
            },
            info: {
                iconBg: 'bg-sky-50',
                iconColor: 'text-sky-600',
                icon: 'fa-circle-info',
                borderColor: 'border-sky-200'
            }
        };

        const style = typeStyles[type] || typeStyles.warning;

        const content = `
            <div class="text-center py-2 sm:py-4">
                <div class="w-16 h-16 sm:w-20 sm:h-20 ${style.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 animate-bounceIn border ${style.borderColor}">
                    <i class="fas ${style.icon} ${style.iconColor} text-2xl sm:text-3xl"></i>
                </div>
                
                <h3 class="text-base sm:text-lg font-bold text-slate-800 mb-2">${title}</h3>
                <p class="text-stone-500 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">${message}</p>
                
                <div class="flex justify-center gap-2 sm:gap-3">
                    <button class="px-5 sm:px-6 py-2.5 text-stone-600 bg-stone-100 active:bg-stone-200 rounded-xl transition-all font-medium text-sm min-h-[44px]"
                            onclick="modal.close()">
                        Cancel
                    </button>
                    <button id="confirmBtn" 
                            class="px-5 sm:px-6 py-2.5 text-white ${confirmClass} rounded-xl transition-all font-medium flex items-center gap-2 text-sm min-h-[44px]">
                        <i class="fas ${confirmIcon} text-sm"></i> ${confirmText}
                    </button>
                </div>
            </div>
        `;

        this.open(title, content, { icon: style.icon });

        setTimeout(() => {
            const btn = document.getElementById('confirmBtn');
            if (btn) {
                btn.addEventListener('click', async () => {
                    const originalText = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = '<span class="spinner spinner-sm spinner-white"></span> Processing...';
                    
                    try {
                        await confirmHandler();
                    } catch (error) {
                        console.error('Confirm action error:', error);
                        showToast(error.message || 'Action failed', 'error');
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                    }
                    
                    this.close();
                });
            }
        }, 100);
    }

    // Helper for success/info modals
    openAlert(title, message, type = 'success', options = {}) {
        const typeStyles = {
            success: {
                iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', icon: 'fa-circle-check',
                btnClass: 'bg-emerald-600 active:bg-emerald-700 shadow-lg shadow-emerald-600/20', borderColor: 'border-emerald-200'
            },
            error: {
                iconBg: 'bg-red-50', iconColor: 'text-red-600', icon: 'fa-circle-xmark',
                btnClass: 'bg-red-600 active:bg-red-700 shadow-lg shadow-red-600/20', borderColor: 'border-red-200'
            },
            info: {
                iconBg: 'bg-sky-50', iconColor: 'text-sky-600', icon: 'fa-circle-info',
                btnClass: 'bg-sky-600 active:bg-sky-700 shadow-lg shadow-sky-600/20', borderColor: 'border-sky-200'
            }
        };

        const style = typeStyles[type] || typeStyles.success;
        const { buttonText = 'OK' } = options;

        const content = `
            <div class="text-center py-2 sm:py-4">
                <div class="w-16 h-16 sm:w-20 sm:h-20 ${style.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 animate-bounceIn border ${style.borderColor}">
                    <i class="fas ${style.icon} ${style.iconColor} text-2xl sm:text-3xl"></i>
                </div>
                <h3 class="text-base sm:text-lg font-bold text-slate-800 mb-2">${title}</h3>
                <p class="text-stone-500 mb-6 sm:mb-8 text-sm sm:text-base">${message}</p>
                <button class="px-6 sm:px-8 py-2.5 text-white ${style.btnClass} rounded-xl transition-all font-medium text-sm min-h-[44px]"
                        onclick="modal.close()">
                    ${buttonText}
                </button>
            </div>
        `;

        this.open(title, content, { icon: style.icon });
    }

    // Helper for loading modal
    openLoading(message = 'Loading...') {
        const content = `
            <div class="text-center py-8 sm:py-10">
                <div class="spinner spinner-lg mx-auto mb-4 sm:mb-5"></div>
                <p class="text-slate-600 font-medium text-sm sm:text-base">${message}</p>
                <p class="text-stone-400 text-xs sm:text-sm mt-1">Please wait...</p>
            </div>
        `;

        this.open('', content, { icon: 'fa-spinner fa-spin' });
    }
}

// Create global modal instance
const modal = new Modal();
