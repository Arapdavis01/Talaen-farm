// ============================================
// TALAEN FARM - Dynamic Background Manager
// ============================================

class BackgroundManager {
    constructor() {
        this.background = document.getElementById('appBackground');
        this.overlay = this.background.querySelector('.absolute');
        
        this.backgrounds = {
            login: {
                url: 'https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                overlay: 'from-slate-900/80 via-slate-800/70 to-slate-900/80'
            },
            modules: {
                url: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                overlay: 'from-slate-900/70 via-slate-800/60 to-slate-900/70'
            },
            tea: {
                url: 'https://images.unsplash.com/photo-1598890777032-bde835ba27c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                overlay: 'from-emerald-950/70 via-slate-900/60 to-slate-950/70'
            },
            dairy: {
                url: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                overlay: 'from-sky-950/70 via-slate-900/60 to-slate-950/70'
            }
        };
    }

    setBackground(section) {
        const bg = this.backgrounds[section];
        if (!bg) return;

        // Fade out
        this.background.style.opacity = '0.3';
        
        setTimeout(() => {
            // Change background
            this.background.style.backgroundImage = `url('${bg.url}')`;
            
            // Update overlay
            this.overlay.className = `absolute inset-0 bg-gradient-to-br ${bg.overlay}`;
            
            // Fade in
            this.background.style.opacity = '1';
        }, 300);
    }

    setLoginBackground() {
        this.setBackground('login');
    }

    setModulesBackground() {
        this.setBackground('modules');
    }

    setTeaBackground() {
        this.setBackground('tea');
    }

    setDairyBackground() {
        this.setBackground('dairy');
    }
}

// Create global background manager instance
const bgManager = new BackgroundManager();
