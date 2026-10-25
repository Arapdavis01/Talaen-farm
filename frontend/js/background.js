// ============================================
// TALAEN FARM - Dynamic Background Manager
// ============================================

class BackgroundManager {
    constructor() {
        this.background = null;
        this.overlay = null;

        this._currentSection = null;
        this._currentTimer = null;
        this._requestId = 0;

        this._reducedMotion =
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this._backgrounds = {
            login: {
                url: 'https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                overlay: 'from-slate-900/80 via-slate-800/70 to-slate-900/80'
            },
            modules: {
                url: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                overlay: 'from-slate-900/70 via-slate-800/60 to-slate-900/70'
            },
            tea: {
                url: 'https://6a649f852a4b54c07b2779d6.imgix.net/sandbox/19acdee3aaa62b4b4de3ab52b5b87ea5.jpg',
                overlay: 'from-emerald-950/70 via-slate-900/60 to-slate-950/70'
            },
            dairy: {
                url: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                overlay: 'from-sky-950/70 via-slate-900/60 to-slate-950/70'
            }
        };

        this._refs();
    }

    // ---------- Refs ----------
    _refs() {
        if (!this.background || !document.body.contains(this.background)) {
            this.background = document.getElementById('appBackground');
        }
        if (this.background && (!this.overlay || !document.body.contains(this.overlay))) {
            this.overlay = this.background.querySelector('.absolute');
        }
        // Promote to its own compositor layer for smooth opacity transitions
        if (this.background) this.background.style.willChange = 'opacity';
        return !!(this.background && this.overlay);
    }

    // ---------- Public ----------
    setLoginBackground()   { this.setBackground('login'); }
    setModulesBackground() { this.setBackground('modules'); }
    setTeaBackground()     { this.setBackground('tea'); }
    setDairyBackground()   { this.setBackground('dairy'); }

    setBackground(section) {
        const bg = this._backgrounds[section];
        if (!bg) {
            console.warn('[Background] Unknown section:', section);
            return;
        }
        if (!this._refs()) {
            console.warn('[Background] #appBackground not ready; skipping');
            return;
        }
        // No-op if already on this section (avoids flicker on re-navigation)
        if (this._currentSection === section) return;

        const requestId = ++this._requestId;

        // Cancel any pending fade
        if (this._currentTimer) {
            clearTimeout(this._currentTimer);
            this._currentTimer = null;
        }

        // Reduced motion: apply instantly
        if (this._reducedMotion) {
            this._applyBackground(bg);
            this._currentSection = section;
            return;
        }

        // Preload image, then fade-swap
        const applyNow = () => {
            if (requestId !== this._requestId) return; // stale
            this._fadeTo(bg, requestId, section);
        };

        this._preloadImage(bg.url, applyNow, applyNow /* apply on error too */);
    }

    // ---------- Private ----------
    _preloadImage(url, onLoad, onError) {
        try {
            const img = new Image();
            let done = false;
            const finish = (ok) => {
                if (done) return;
                done = true;
                if (ok) onLoad && onLoad();
                else     onError && onError();
            };
            img.onload  = () => finish(true);
            img.onerror = () => finish(false);
            img.src = url;
            // Safety timeout — don't stall the UI if the CDN hangs
            setTimeout(() => finish(false), 2500);
        } catch (_) {
            // Very old WebViews without Image constructor support — just apply
            (onError || onLoad) && (onError || onLoad)();
        }
    }

    _fadeTo(bg, requestId, section) {
        const targetOpacity = this._targetOpacity();

        // Fade out
        this.background.style.opacity = '0.3';

        this._currentTimer = setTimeout(() => {
            this._currentTimer = null;
            if (requestId !== this._requestId) return;

            this._applyBackground(bg);
            this._currentSection = section;

            // Fade in to the target opacity (0.9 in app, 1.0 on web)
            this.background.style.opacity = String(targetOpacity);
        }, 300);
    }

    _applyBackground(bg) {
        if (!this.background || !this.overlay) return;

        this.background.style.backgroundImage = `url('${bg.url}')`;

        // Only replace gradient classes — keep any other classes on the overlay
        const CLS_PREFIXES = ['from-', 'via-', 'to-', 'bg-gradient-'];
        const clsList = Array.from(this.overlay.classList);
        clsList.forEach((c) => {
            if (CLS_PREFIXES.some((p) => c.startsWith(p))) {
                this.overlay.classList.remove(c);
            }
        });
        bg.overlay.split(/\s+/).forEach((c) => {
            if (c) this.overlay.classList.add(c);
        });
    }

    _targetOpacity() {
        // Respect app-shell.css which keeps the background subtly darker on app
        return (window.TALAEN && window.TALAEN.isAndroidApp) ? 0.9 : 1;
    }
}

// Global instance
const bgManager = new BackgroundManager();
window.bgManager = bgManager;
