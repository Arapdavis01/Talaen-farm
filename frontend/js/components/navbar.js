// ============================================
// TALAEN FARM - Mobile Navbar Component
// ============================================

class Navbar {
    constructor() {
        this.hamburgerBtn = null;
        this.mobileNavbar = null;
        this.sidebarEl = null;
        this.sidebarOverlay = null;

        this.currentPageTitle = 'Dashboard';
        this.lastScrollY = 0;
        this.navbarVisible = true;

        this._scrollRaf = null;
        this._scrollTimeout = null;

        // Prefer reduced-motion?
        this._reducedMotion =
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this._refs();
        this._setupEventListeners();
        this._setupResizeHandler();
        this._setupScrollBehavior();
    }

    // ---------- Refs ----------
    _refs() {
        this.hamburgerBtn   = document.getElementById('hamburgerBtn');
        this.mobileNavbar   = document.getElementById('mobileNavbar');
        this.sidebarEl      = document.getElementById('sidebar');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        return !!(this.hamburgerBtn && this.mobileNavbar);
    }

    // Sidebar instance (may not be loaded yet)
    _s() {
        return (typeof sidebar !== 'undefined' && sidebar) ? sidebar : null;
    }

    // ---------- Listeners ----------
    _setupEventListeners() {
        if (!this.hamburgerBtn) {
            console.warn('[Navbar] #hamburgerBtn not found; skipping click wiring');
        } else {
            this.hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSidebar();
            });
        }

        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => {
                const s = this._s();
                if (s) s.close();
                this.updateHamburgerIcon(false);
            });
        }

        // Outside click closes sidebar on mobile
        document.addEventListener('click', (e) => {
            const s = this._s();
            if (!s || !s.isOpen || window.innerWidth >= 1024) return;
            const clickedOutside =
                (!this.sidebarEl || !this.sidebarEl.contains(e.target)) &&
                (!this.hamburgerBtn || !this.hamburgerBtn.contains(e.target));
            if (clickedOutside) {
                s.close();
                this.updateHamburgerIcon(false);
            }
        });

        // Ctrl+B toggle (skip in Android app — no keyboard)
        if (!(window.TALAEN && window.TALAEN.isAndroidApp)) {
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'b') {
                    e.preventDefault();
                    this.toggleSidebar();
                }
            });
        }
    }

    // ---------- Scroll behavior (hide on scroll down) ----------
    _setupScrollBehavior() {
        // Which element actually scrolls? In the app it's #mainContent.
        const main = document.getElementById('mainContent');
        const scrollTarget = (main && main.scrollHeight > main.clientHeight) ? main : window;

        const getScrollY = () => {
            if (scrollTarget === window) return window.scrollY || 0;
            return scrollTarget.scrollTop || 0;
        };

        const onScroll = () => {
            if (window.innerWidth >= 1024) return;
            if (!this.mobileNavbar) return;

            if (this._scrollRaf) cancelAnimationFrame(this._scrollRaf);
            this._scrollRaf = requestAnimationFrame(() => {
                const y = getScrollY();

                if (y > this.lastScrollY && y > 80) {
                    // Scrolling down → hide
                    if (this.navbarVisible) {
                        this._applyNavbarTransform(true);
                        this.navbarVisible = false;
                    }
                } else {
                    // Scrolling up → show
                    if (!this.navbarVisible) {
                        this._applyNavbarTransform(false);
                        this.navbarVisible = true;
                    }
                }
                this.lastScrollY = y;

                // Auto-show after scrolling stops for 2s
                if (this._scrollTimeout) clearTimeout(this._scrollTimeout);
                this._scrollTimeout = setTimeout(() => {
                    if (!this.navbarVisible) {
                        this._applyNavbarTransform(false);
                        this.navbarVisible = true;
                    }
                }, 2000);
            });
        };

        scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    }

    _applyNavbarTransform(hidden) {
        if (!this.mobileNavbar) return;
        const t = this._reducedMotion ? '' : 'transform 0.3s ease';
        this.mobileNavbar.style.transition = t;
        this.mobileNavbar.style.transform = hidden ? 'translateY(-100%)' : 'translateY(0)';
        this.mobileNavbar.style.visibility = hidden ? 'hidden' : 'visible';
    }

    // ---------- Resize ----------
    _setupResizeHandler() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth >= 1024) {
                    // Desktop: reset sidebar state
                    if (this.sidebarEl) this.sidebarEl.classList.remove('sidebar-open');
                    if (this.sidebarOverlay) this.sidebarOverlay.classList.add('hidden');
                    const s = this._s();
                    if (s) s.isOpen = false;
                    this.updateHamburgerIcon(false);
                    // Reset navbar position
                    if (this.mobileNavbar) {
                        this.mobileNavbar.style.transform = 'translateY(0)';
                        this.mobileNavbar.style.visibility = 'visible';
                    }
                    this.navbarVisible = true;
                }
            }, 250);
        });
    }

    // ---------- Toggle / icon ----------
    toggleSidebar() {
        const s = this._s();
        if (!s) return;

        // Sidebar itself calls updateHamburgerIcon(true/false) — no duplicate here.
        s.toggle();

        // Haptic only in app mode
        if (window.TALAEN && window.TALAEN.isAndroidApp && navigator.vibrate) {
            try { navigator.vibrate(10); } catch (_) {}
        }
    }

    updateHamburgerIcon(isOpen) {
        if (!this.hamburgerBtn) return;
        const icon = this.hamburgerBtn.querySelector('i');
        if (!icon) return;

        if (isOpen) {
            icon.className = 'fas fa-times text-lg sm:text-xl';
            this.hamburgerBtn.classList.add('bg-stone-100');
            this.hamburgerBtn.setAttribute('aria-label', 'Close menu');
        } else {
            icon.className = 'fas fa-bars text-lg sm:text-xl';
            this.hamburgerBtn.classList.remove('bg-stone-100');
            this.hamburgerBtn.setAttribute('aria-label', 'Open menu');
        }
    }

    // ---------- Page title ----------
    setPageTitle(title) {
        this.currentPageTitle = title;
        if (!this.mobileNavbar) return;
        const titleElement = this.mobileNavbar.querySelector('h2');
        if (titleElement) titleElement.textContent = title;
    }

    // Backwards-compatible alias (some modules may call updateTitle)
    updateTitle(title) { this.setPageTitle(title); }

    // ---------- Show / hide ----------
    show() {
        this._applyNavbarTransform(false);
        this.navbarVisible = true;
    }

    hide() {
        this._applyNavbarTransform(true);
        this.navbarVisible = false;
    }

    // ---------- Notification badge ----------
    setNotificationBadge(count) {
        if (!this.hamburgerBtn) return;
        if (count > 0) {
            let badge = this.hamburgerBtn.querySelector('.notification-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notification-badge absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow';
                this.hamburgerBtn.style.position = 'relative';
                this.hamburgerBtn.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
        } else {
            const badge = this.hamburgerBtn.querySelector('.notification-badge');
            if (badge) badge.remove();
        }
    }
}

// Global instance
const navbar = new Navbar();
window.navbar = navbar;
