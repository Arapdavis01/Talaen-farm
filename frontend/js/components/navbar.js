// ============================================
// TALAEN FARM - Mobile Navbar Component (Improved)
// ============================================

class Navbar {
    constructor() {
        this.hamburgerBtn = document.getElementById('hamburgerBtn');
        this.mobileNavbar = document.getElementById('mobileNavbar');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.currentPageTitle = 'Dashboard';
        
        this.setupEventListeners();
        this.setupSwipeGestures();
        this.setupResizeHandler();
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

    setupSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }

    handleSwipe(startX, endX) {
        const swipeThreshold = 70;
        const swipeDistance = endX - startX;

        if (window.innerWidth < 1024) {
            // Swipe right to open
            if (swipeDistance > swipeThreshold && !sidebar.isOpen && startX < 50) {
                sidebar.open();
                this.updateHamburgerIcon(true);
            }
            // Swipe left to close
            if (swipeDistance < -swipeThreshold && sidebar.isOpen) {
                sidebar.close();
                this.updateHamburgerIcon(false);
            }
        }
    }

    setupResizeHandler() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth >= 1024) {
                    // On desktop, ensure sidebar is visible and overlay hidden
                    this.sidebar.classList.remove('sidebar-open');
                    this.sidebarOverlay.classList.add('hidden');
                    sidebar.isOpen = false;
                    this.updateHamburgerIcon(false);
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
    }

    updateHamburgerIcon(isOpen) {
        const icon = this.hamburgerBtn.querySelector('i');
        if (icon) {
            if (isOpen) {
                icon.className = 'fas fa-times text-xl';
                this.hamburgerBtn.classList.add('bg-gray-100');
            } else {
                icon.className = 'fas fa-bars text-xl';
                this.hamburgerBtn.classList.remove('bg-gray-100');
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

    // Show/hide mobile navbar (useful for full-screen views)
    show() {
        this.mobileNavbar.classList.remove('hidden');
    }

    hide() {
        this.mobileNavbar.classList.add('hidden');
    }

    // Add notification badge to hamburger
    setNotificationBadge(count) {
        if (count > 0) {
            let badge = this.hamburgerBtn.querySelector('.notification-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notification-badge absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold';
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
