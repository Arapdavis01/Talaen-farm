// ============================================
// TALAEN FARM - Mobile Navbar Component (Optimized)
// ============================================

class Navbar {
    constructor() {
        this.hamburgerBtn = document.getElementById('hamburgerBtn');
        this.mobileNavbar = document.getElementById('mobileNavbar');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.currentPageTitle = 'Dashboard';
        this.lastScrollY = 0;
        this.navbarVisible = true;
        
        this.setupEventListeners();
        this.setupResizeHandler();
        this.setupScrollBehavior();
        // Swipe gestures handled by sidebar.js
    }

    setupEventListeners() {
        // Hamburger menu toggle
        this.hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });

        // Close sidebar when overlay is clicked
        this.sidebarOverlay.addEventListener('click', () => {
            sidebar.close();
            this.updateHamburgerIcon(false);
        });

        // Close sidebar on outside click (mobile)
        document.addEventListener('click', (e) => {
            if (sidebar.isOpen && window.innerWidth < 1024) {
                const clickedOutside = !this.sidebar.contains(e.target) && 
                                       !this.hamburgerBtn.contains(e.target);
                if (clickedOutside) {
                    sidebar.close();
                    this.updateHamburgerIcon(false);
                }
            }
        });

        // Keyboard shortcut to toggle sidebar
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                this.toggleSidebar();
            }
        });
    }

    setupScrollBehavior() {
        // Hide navbar on scroll down, show on scroll up (saves screen space)
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (window.innerWidth >= 1024) return;
            
            clearTimeout(scrollTimeout);
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > this.lastScrollY && currentScrollY > 80) {
                // Scrolling down - hide navbar
                if (this.navbarVisible) {
                    this.mobileNavbar.style.transform = 'translateY(-100%)';
                    this.mobileNavbar.style.transition = 'transform 0.3s ease';
                    this.navbarVisible = false;
                }
            } else {
                // Scrolling up - show navbar
                if (!this.navbarVisible) {
                    this.mobileNavbar.style.transform = 'translateY(0)';
                    this.mobileNavbar.style.transition = 'transform 0.3s ease';
                    this.navbarVisible = true;
                }
            }
            
            this.lastScrollY = currentScrollY;
            
            // Reset after scroll stops
            scrollTimeout = setTimeout(() => {
                if (!this.navbarVisible) {
                    this.mobileNavbar.style.transform = 'translateY(0)';
                    this.navbarVisible = true;
                }
            }, 2000);
        }, { passive: true });
    }

    setupResizeHandler() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth >= 1024) {
                    // Desktop: ensure sidebar visible, overlay hidden
                    this.sidebar.classList.remove('sidebar-open');
                    this.sidebarOverlay.classList.add('hidden');
                    sidebar.isOpen = false;
                    this.updateHamburgerIcon(false);
                    // Reset navbar position
                    this.mobileNavbar.style.transform = 'translateY(0)';
                    this.navbarVisible = true;
                }
            }, 250);
        });
    }

    toggleSidebar() {
        if (sidebar.isOpen) {
            sidebar.close();
            this.updateHamburgerIcon(false);
        } else {
            sidebar.open();
            this.updateHamburgerIcon(true);
        }
        // Haptic feedback if available
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }
    }

    updateHamburgerIcon(isOpen) {
        const icon = this.hamburgerBtn.querySelector('i');
        if (icon) {
            if (isOpen) {
                icon.className = 'fas fa-times text-lg sm:text-xl';
                this.hamburgerBtn.classList.add('bg-stone-100');
            } else {
                icon.className = 'fas fa-bars text-lg sm:text-xl';
                this.hamburgerBtn.classList.remove('bg-stone-100');
            }
        }
    }

    // Update the page title in the mobile navbar
    setPageTitle(title) {
        this.currentPageTitle = title;
        const titleElement = this.mobileNavbar.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    // Show/hide mobile navbar
    show() {
        this.mobileNavbar.style.transform = 'translateY(0)';
        this.navbarVisible = true;
    }

    hide() {
        this.mobileNavbar.style.transform = 'translateY(-100%)';
        this.navbarVisible = false;
    }

    // Add notification badge to hamburger
    setNotificationBadge(count) {
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

// Create global navbar instance
const navbar = new Navbar();
