// ============================================
// TALAEN FARM - Toast Notifications (Mobile Optimized)
// ============================================

class Toast {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.maxToasts = 3;
        this.defaultDuration = 3500;
    }

    show(message, type = 'info', duration = 3500) {
        // Remove oldest toast if max reached
        const currentToasts = this.container.children.length;
        if (currentToasts >= this.maxToasts) {
            const oldest = this.container.firstChild;
            if (oldest) this.dismiss(oldest);
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
        const isMobile = window.innerWidth < 640;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-item bg-gradient-to-r ${gradient} text-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl flex items-stretch overflow-hidden w-full sm:min-w-[320px] sm:max-w-md`;
        toast.innerHTML = `
            <!-- Icon Section -->
            <div class="flex items-center justify-center px-3 sm:px-4 bg-black/10">
                <i class="fas ${icon} text-base sm:text-xl"></i>
            </div>
            
            <!-- Content Section -->
            <div class="flex-1 px-3 sm:px-4 py-2.5 sm:py-3.5">
                <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70 mb-0.5">${title}</p>
                <p class="text-xs sm:text-sm font-medium leading-snug">${message}</p>
            </div>
            
            <!-- Close Button -->
            <div class="flex items-center pr-2 sm:pr-2">
                <button class="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg text-white/60 active:text-white active:bg-white/10 transition-all text-xs min-tap" 
                        onclick="this.closest('.toast-item').remove()" title="Dismiss">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Progress Bar -->
            <div class="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-black/20">
                <div class="toast-progress h-full bg-white/60" style="animation: toastProgress ${duration}ms linear forwards;"></div>
            </div>
        `;

        toast.style.position = 'relative';
        this.container.appendChild(toast);

        // Auto dismiss
        const dismissTimeout = setTimeout(() => {
            this.dismiss(toast);
        }, duration);
        toast._dismissTimeout = dismissTimeout;

        // Pause dismiss on touch/hover
        const pauseEvents = ['mouseenter', 'touchstart'];
        const resumeEvents = ['mouseleave', 'touchend'];
        
        pauseEvents.forEach(event => {
            toast.addEventListener(event, () => {
                clearTimeout(toast._dismissTimeout);
                const progressBar = toast.querySelector('.toast-progress');
                if (progressBar) progressBar.style.animationPlayState = 'paused';
            });
        });

        resumeEvents.forEach(event => {
            toast.addEventListener(event, () => {
                const remainingDuration = 1500;
                toast._dismissTimeout = setTimeout(() => {
                    this.dismiss(toast);
                }, remainingDuration);
                const progressBar = toast.querySelector('.toast-progress');
                if (progressBar) progressBar.style.animationPlayState = 'running';
            });
        });

        // Swipe to dismiss
        let touchStartX = 0;
        toast.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        toast.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            if (touchEndX - touchStartX > 80) {
                this.dismiss(toast);
            }
        }, { passive: true });
    }

    dismiss(toast) {
        if (!toast || toast.classList.contains('removing')) return;

        if (toast._dismissTimeout) clearTimeout(toast._dismissTimeout);

        toast.classList.add('removing');

        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 350);
    }

    // Quick methods
    success(message, duration) { this.show(message, 'success', duration); }
    error(message, duration) { this.show(message, 'error', duration || 5000); }
    warning(message, duration) { this.show(message, 'warning', duration); }
    info(message, duration) { this.show(message, 'info', duration); }

    // Dismiss all toasts
    dismissAll() {
        const toasts = this.container.querySelectorAll('.toast-item');
        toasts.forEach(toast => this.dismiss(toast));
    }

    // Update toast message
    update(toastElement, message) {
        const messageEl = toastElement.querySelector('p:last-of-type');
        if (messageEl) messageEl.textContent = message;
    }
}

// Global toast instance
const toast = new Toast();

// Helper function
function showToast(message, type = 'info', duration = 3500) {
    toast.show(message, type, duration);
}

// Add progress bar animation dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes toastProgress {
        from { width: 100%; }
        to { width: 0%; }
    }
`;
document.head.appendChild(style);
