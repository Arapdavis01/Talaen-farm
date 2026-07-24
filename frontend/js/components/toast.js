// ============================================
// TALAEN FARM - Toast Notifications (Improved)
// ============================================

class Toast {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.maxToasts = 5;
        this.defaultDuration = 4000;
    }

    show(message, type = 'info', duration = 4000) {
        // Remove oldest toast if max reached
        const currentToasts = this.container.children.length;
        if (currentToasts >= this.maxToasts) {
            this.container.firstChild.remove();
        }

        const config = {
            success: {
                icon: 'fa-circle-check',
                gradient: 'from-emerald-500 to-green-600',
                title: 'Success'
            },
            error: {
                icon: 'fa-circle-xmark',
                gradient: 'from-red-500 to-rose-600',
                title: 'Error'
            },
            warning: {
                icon: 'fa-triangle-exclamation',
                gradient: 'from-amber-500 to-orange-600',
                title: 'Warning'
            },
            info: {
                icon: 'fa-circle-info',
                gradient: 'from-blue-500 to-indigo-600',
                title: 'Info'
            }
        };

        const { icon, gradient, title } = config[type] || config.info;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-item bg-gradient-to-r ${gradient} text-white rounded-2xl shadow-2xl flex items-stretch overflow-hidden min-w-[340px] max-w-md`;
        toast.innerHTML = `
            <!-- Icon Section -->
            <div class="flex items-center justify-center px-4 bg-black/10">
                <i class="fas ${icon} text-xl"></i>
            </div>
            
            <!-- Content Section -->
            <div class="flex-1 px-4 py-3.5">
                <p class="text-xs font-semibold uppercase tracking-wider text-white/70 mb-0.5">${title}</p>
                <p class="text-sm font-medium leading-snug">${message}</p>
            </div>
            
            <!-- Close Button & Progress Bar -->
            <div class="flex flex-col items-center justify-between py-2 pr-2">
                <button class="w-6 h-6 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs" 
                        onclick="this.closest('.toast-item').remove()" title="Dismiss">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Progress Bar -->
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                <div class="toast-progress h-full bg-white/60" style="animation: toastProgress ${duration}ms linear forwards;"></div>
            </div>
        `;

        // Make toast position relative for progress bar
        toast.style.position = 'relative';

        this.container.appendChild(toast);

        // Auto dismiss
        const dismissTimeout = setTimeout(() => {
            this.dismiss(toast);
        }, duration);

        // Store timeout on element for cleanup
        toast._dismissTimeout = dismissTimeout;

        // Pause dismiss on hover
        toast.addEventListener('mouseenter', () => {
            clearTimeout(toast._dismissTimeout);
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.animationPlayState = 'paused';
            }
        });

        // Resume dismiss on mouse leave
        toast.addEventListener('mouseleave', () => {
            const remainingDuration = 2000; // Shorter duration after hover
            toast._dismissTimeout = setTimeout(() => {
                this.dismiss(toast);
            }, remainingDuration);
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.animationPlayState = 'running';
            }
        });
    }

    dismiss(toast) {
        if (!toast || toast.classList.contains('removing')) return;

        // Clear timeout
        if (toast._dismissTimeout) {
            clearTimeout(toast._dismissTimeout);
        }

        // Add removing class for animation
        toast.classList.add('removing');

        // Remove after animation
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 350);
    }

    // Quick success toast
    success(message, duration) {
        this.show(message, 'success', duration);
    }

    // Quick error toast
    error(message, duration) {
        this.show(message, 'error', duration || 6000);
    }

    // Quick warning toast
    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    // Quick info toast
    info(message, duration) {
        this.show(message, 'info', duration);
    }

    // Dismiss all toasts
    dismissAll() {
        const toasts = this.container.querySelectorAll('.toast-item');
        toasts.forEach(toast => this.dismiss(toast));
    }

    // Update toast message (for progress updates)
    update(toastElement, message) {
        const messageEl = toastElement.querySelector('p:last-of-type');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }
}

// Global toast instance
const toast = new Toast();

// Helper function for backward compatibility
function showToast(message, type = 'info', duration = 4000) {
    toast.show(message, type, duration);
}

// Add progress bar animation to stylesheet dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes toastProgress {
        from { width: 100%; }
        to { width: 0%; }
    }
`;
document.head.appendChild(style);
