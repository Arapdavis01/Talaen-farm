// ============================================
// TALAEN FARM - Mobile Navbar Component
// ============================================

class Navbar {
    constructor() {
        this.hamburgerBtn = document.getElementById('hamburgerBtn');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.hamburgerBtn.addEventListener('click', () => {
            sidebar.toggle();
        });

        // Close sidebar when overlay is clicked
        document.getElementById('sidebarOverlay').addEventListener('click', () => {
            sidebar.close();
        });
    }
}

// Create global navbar instance
const navbar = new Navbar();
