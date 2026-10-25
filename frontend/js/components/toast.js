// ============================================
// TALAEN FARM - Toast Notifications (Mobile + App Optimized)
// ============================================

class Toast {
    constructor() {
        this._container = null;
        this.maxToasts = 3;
        // Slightly longer in the Android app — messages get read slower on mobile
        this.defaultDuration =
            (window.TALAEN && window.TALAEN.isAndroidApp) ? 4000 : 3500;
    }

    // ---------- Container (lazy) ----------
    _getContainer() {
        if (this._container && document.body.contains(this._container)) {
            return this._container;
        }
        this._container = document.getElementById('toastContainer');
        return this._container;
    }

    // ---------- Escape user-controlled strings ----------
    _escape(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ---------- Toast config ----------
    _config(type) {
        const map = {
            success: { icon: 'fa-circle-check',      gradient: 'from-emerald-500 to-green-600', title: 'Success' },
            error:   { icon: 'fa-circle-xmark',      gradient: 'from-red-500 to-rose-600',      title: 'Error'   },
            warning: { icon: 'fa-triangle-exclamation', gradient: 'from-amber-500 to-orange-600', title: 'Warning' },
            info:    { icon: 'fa-circle-info',       gradient: 'from-blue-500 to-indigo-600',   title: 'Info'    }
        };
        return map[type] || map.info;
    }

    // ---------- Show ----------
    show(message, type = 'info', duration) {
        const container = this._getContainer();
        if (!container) {
            console.warn('[Toast] #toastContainer not found; skipping toast:', message);
            return;
        }

        const dur = (typeof duration === 'number' && duration > 0)
            ? duration
            : this.defaultDuration;

        // Trim to max
        const currentToasts = container.querySelectorAll('.toast-item');
        if (currentToasts.length >= this.maxToasts) {
            this.dismiss(currentToasts[0]);
        }

        const { icon, gradient, title } = this._config(type);
        const safeMessage = this._escape(message);
        const safeTitle = this._escape(title);

        // Haptic feedback in app mode
        if (window.TALAEN && window.TALAEN.isAndroidApp && navigator.vibrate) {
            try {
                navigator.vibrate(type === 'error' ? [10, 40, 10] : 10);
            } catch (_) {}
        }

        const el = document.createElement('div');
        el.className = `toast-item bg-gradient-to-r ${gradient} text-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl flex items-stretch overflow-hidden w-full sm:min-w-[320px] sm:max-w-md`;
        el.style.position = 'relative';

        el.innerHTML = `
            <!-- Icon -->
            <div class="flex items-center justify-center px-3 sm:px-4 bg-black/10">
                <i class="fas ${icon} text-base sm:text-xl"></i>
            </div>

            <!-- Content -->
            <div class="flex-1 px-3 sm:px-4 py-2.5 sm:py-3.5">
                <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70 mb-0.5">${safeTitle}</p>
                <p class="text-xs sm:text-sm font-medium leading-snug">${safeMessage}</p>
            </div>

            <!-- Close -->
            <div class="flex items-center pr-2">
                <button type="button"
                        class="toast-close w-7 h-7 flex items-center justify-center rounded-lg text-white/60 active:text-white active:bg-white/10 transition-all text-xs min-tap"
                        aria-label="Dismiss"
                        title="Dismiss">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Progress -->
            <div class="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-black/20">
                <div class="toast-progress h-full bg-white/60"
                     style="animation: toastProgress ${dur}ms linear forwards;"></div>
            </div>
        `;

        container.appendChild(el);

        // Wire close button (no inline onclick)
        const closeBtn = el.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.dismiss(el));
        }

        // Auto-dismiss with pause/resume timing state
        el._remaining = dur;
        el._startedAt = Date.now();
        el._paused = false;

        el._dismissTimeout = setTimeout(() => this.dismiss(el), dur);

        // Pause on interaction
        const pause = () => {
            if (el._paused) return;
            el._paused = true;
            el._remaining = Math.max(0, el._remaining - (Date.now() - el._startedAt));
            clearTimeout(el._dismissTimeout);
            el._dismissTimeout = null;

            const bar = el.querySelector('.toast-progress');
            if (bar) bar.style.animationPlayState = 'paused';
        };

        const resume = () => {
            if (!el._paused) return;
            el._paused = false;
            el._startedAt = Date.now();

            const bar = el.querySelector('.toast-progress');
            if (bar) {
                // Restart the progress bar visually from remaining fraction
                const pct = Math.max(0, Math.min(1, el._remaining / dur));
                bar.style.animation = 'none';
                // Force reflow so animation-duration applies freshly
                void bar.offsetWidth;
                bar.style.animation = `toastProgress ${Math.max(300, el._remaining)}ms linear forwards`;
                bar.style.transformOrigin = 'left center';
                bar.style.opacity = '1';
                bar.style.animationPlayState = 'running';
                // Nudge starting width to reflect remaining progress
                bar.style.width = `${pct * 100}%`;
            }

            el._dismissTimeout = setTimeout(() => this.dismiss(el), el._remaining);
        };

        el.addEventListener('mouseenter', pause);
        el.addEventListener('mouseleave', resume);
        el.addEventListener('touchstart', pause, { passive: true });
        el.addEventListener('touchend', resume, { passive: true });
        el.addEventListener('touchcancel', resume, { passive: true });

        // Swipe-to-dismiss (horizontal only; ignore vertical scroll gestures)
        let startX = 0, startY = 0;
        el.addEventListener('touchstart', (e) => {
            if (!e.changedTouches || !e.changedTouches[0]) return;
            startX = e.changedTouches[0].screenX;
            startY = e.changedTouches[0].screenY;
        }, { passive: true });

        el.addEventListener('touchend', (e) => {
            if (!e.changedTouches || !e.changedTouches[0]) return;
            const dx = e.changedTouches[0].screenX - startX;
            const dy = e.changedTouches[0].screenY - startY;
            // Horizontal swipe right, and clearly more horizontal than vertical
            if (dx > 80 && Math.abs(dx) > Math.abs(dy)) {
                this.dismiss(el);
            }
        }, { passive: true });
    }

    // ---------- Dismiss ----------
    dismiss(el) {
        if (!el || el.classList.contains('removing')) return;
        if (el._dismissTimeout) {
            clearTimeout(el._dismissTimeout);
            el._dismissTimeout = null;
        }
        el.classList.add('removing');
        setTimeout(() => {
            if (el.parentElement) el.parentElement.removeChild(el);
        }, 350);
    }

    // ---------- Shortcuts ----------
    success(message, duration) { this.show(message, 'success', duration); }
    error(message, duration)   { this.show(message, 'error', duration || 5000); }
    warning(message, duration) { this.show(message, 'warning', duration); }
    info(message, duration)    { this.show(message, 'info', duration); }

    // ---------- Bulk ----------
    dismissAll() {
        const container = this._getContainer();
        if (!container) return;
        container.querySelectorAll('.toast-item').forEach((el) => this.dismiss(el));
    }

    // ---------- Update ----------
    update(el, message) {
        if (!el) return;
        const p = el.querySelectorAll('p');
        const messageEl = p.length >= 2 ? p[p.length - 1] : null;
        if (messageEl) messageEl.textContent = String(message == null ? '' : message);
    }
}

// ---------- Global instance & helper ----------
const toast = new Toast();
window.toast = toast;

function showToast(message, type = 'info', duration) {
    toast.show(message, type, duration);
}

// ---------- Injected keyframes & helpers (idempotent) ----------
(function injectToastStyle() {
    const STYLE_ID = 'talaen-toast-style';
    if (document.getElementById(STYLE_ID)) return; // already injected

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        @keyframes toastProgress {
            from { width: 100%; }
            to   { width: 0%; }
        }
        .min-tap {
            min-height: 28px;
            min-width: 28px;
        }
        @media (pointer: coarse) {
            .min-tap {
                min-height: 36px;
                min-width: 36px;
            }
        }
    `;
    document.head.appendChild(style);
})();
