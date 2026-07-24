// ============================================
// TALAEN FARM - Modal Component (Improved)
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
        const { size = 'max-w-lg', onClose, icon = 'fa-pen' } = options;

        this.content.className = `bg-white rounded-2xl shadow-2xl w-full ${size} max-h-[92vh] overflow-hidden border border-gray-100`;
        
        this.content.innerHTML = `
            <!-- Modal Header -->
            <div class="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
                        <i class="fas ${icon} text-green-600 text-sm"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800">${title}</h3>
                </div>
                <button class="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all" 
                        onclick="modal.close()" title="Close">
                    <i class="fas fa-times text-lg"></i>
                </button>
            </div>
            
            <!-- Modal Body -->
            <div class="p-6">
                ${content}
            </div>
        `;

        this.container.classList.remove('hidden');
        this.isOpen = true;
        this.onCloseCallback = onClose;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus trap - focus first input if exists
        setTimeout(() => {
            const firstInput = this.content.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 200);
    }

    close() {
        // Add closing animation
        this.content.classList.add('modal-closing');
        
        setTimeout(() => {
            this.container.classList.add('hidden');
            this.content.classList.remove('modal-closing');
            this.isOpen = false;
            document.body.style.overflow = '';
        }, 200);

        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    // Helper to create form modal
    openForm(title, formFields, submitHandler, options = {}) {
        const { 
            submitText = 'Save', 
            submitClass = 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-600/25',
            submitIcon = 'fa-check',
            icon = 'fa-pen',
            size = 'max-w-lg'
        } = options;

        const formHtml = `
            <form id="modalForm" class="space-y-5">
                ${formFields}
                
                <!-- Form Actions -->
                <div class="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button type="button" 
                            class="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium flex items-center gap-2"
                            onclick="modal.close()">
                        <i class="fas fa-times text-sm"></i> Cancel
                    </button>
                    <button type="submit" 
                            class="px-5 py-2.5 text-white ${submitClass} rounded-xl transition-all font-medium flex items-center gap-2">
                        <i class="fas ${submitIcon} text-sm"></i> ${submitText}
                    </button>
                </div>
            </form>
        `;

        this.open(title, formHtml, { size, icon });

        // Add submit handler with loading state
        setTimeout(() => {
            const form = document.getElementById('modalForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const submitBtn = form.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    
                    // Show loading state
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
                        // Restore button
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
            confirmClass = 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-600/25',
            confirmIcon = 'fa-check',
            type = 'warning' // warning, danger, info
        } = options;

        const typeStyles = {
            warning: {
                iconBg: 'bg-amber-100',
                iconColor: 'text-amber-500',
                icon: 'fa-exclamation-triangle'
            },
            danger: {
                iconBg: 'bg-red-100',
                iconColor: 'text-red-500',
                icon: 'fa-trash-alt'
            },
            info: {
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-500',
                icon: 'fa-info-circle'
            }
        };

        const style = typeStyles[type] || typeStyles.warning;

        const content = `
            <div class="text-center py-4">
                <!-- Icon -->
                <div class="w-20 h-20 ${style.iconBg} rounded-full flex items-center justify-center mx-auto mb-5 animate-bounceIn">
                    <i class="fas ${style.icon} ${style.iconColor} text-3xl"></i>
                </div>
                
                <!-- Title & Message -->
                <h3 class="text-lg font-bold text-gray-800 mb-2">${title}</h3>
                <p class="text-gray-500 mb-8 leading-relaxed">${message}</p>
                
                <!-- Actions -->
                <div class="flex justify-center gap-3">
                    <button class="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                            onclick="modal.close()">
                        Cancel
                    </button>
                    <button id="confirmBtn" 
                            class="px-6 py-2.5 text-white ${confirmClass} rounded-xl transition-all font-medium flex items-center gap-2">
                        <i class="fas ${confirmIcon} text-sm"></i> ${confirmText}
                    </button>
                </div>
            </div>
        `;

        this.open(title, content, { icon: style.icon.replace('fa-', 'fa-') });

        setTimeout(() => {
            const btn = document.getElementById('confirmBtn');
            if (btn) {
                btn.addEventListener('click', async () => {
                    // Show loading
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
                iconBg: 'bg-green-100',
                iconColor: 'text-green-500',
                icon: 'fa-check-circle',
                btnClass: 'bg-green-600 hover:bg-green-700'
            },
            error: {
                iconBg: 'bg-red-100',
                iconColor: 'text-red-500',
                icon: 'fa-times-circle',
                btnClass: 'bg-red-600 hover:bg-red-700'
            },
            info: {
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-500',
                icon: 'fa-info-circle',
                btnClass: 'bg-blue-600 hover:bg-blue-700'
            }
        };

        const style = typeStyles[type] || typeStyles.success;
        const { buttonText = 'OK' } = options;

        const content = `
            <div class="text-center py-4">
                <div class="w-20 h-20 ${style.iconBg} rounded-full flex items-center justify-center mx-auto mb-5 animate-bounceIn">
                    <i class="fas ${style.icon} ${style.iconColor} text-3xl"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">${title}</h3>
                <p class="text-gray-500 mb-8">${message}</p>
                <button class="px-8 py-2.5 text-white ${style.btnClass} rounded-xl transition-all font-medium shadow-lg"
                        onclick="modal.close()">
                    ${buttonText}
                </button>
            </div>
        `;

        this.open(title, content, { icon: style.icon.replace('fa-', 'fa-') });
    }

    // Helper for loading modal
    openLoading(message = 'Loading...') {
        const content = `
            <div class="text-center py-10">
                <div class="spinner spinner-lg mx-auto mb-5"></div>
                <p class="text-gray-600 font-medium">${message}</p>
                <p class="text-gray-400 text-sm mt-1">Please wait...</p>
            </div>
        `;

        this.open('', content, { icon: 'fa-spinner fa-spin' });
    }
}

// Create global modal instance
const modal = new Modal();
