// Companion Options Management
class CompanionOptionsManager {
    constructor() {
        this.currentCompanionType = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('companion-modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    showModal() {
        const modal = document.getElementById('companion-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeModal() {
        const modal = document.getElementById('companion-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    startCompanionCreation(type) {
        this.currentCompanionType = type;
        this.closeModal();
        
        // Store the companion type in session storage
        sessionStorage.setItem('companionType', type);
        
        // Navigate to the appropriate creation flow
        switch(type) {
            case 'loved-one':
                window.location.href = 'companion-creation.html?type=loved-one';
                break;
            case 'future-self':
                window.location.href = 'companion-creation.html?type=future-self';
                break;
            case 'inner-child':
                window.location.href = 'companion-creation.html?type=inner-child';
                break;
            case 'mentor':
                window.location.href = 'companion-creation.html?type=mentor';
                break;
            default:
                console.error('Unknown companion type:', type);
        }
    }
    
    getCompanionType() {
        return this.currentCompanionType || sessionStorage.getItem('companionType');
    }
}

// Global instance
const companionOptionsManager = new CompanionOptionsManager();

// Global functions for HTML onclick handlers
function showCompanionOptions() {
    companionOptionsManager.showModal();
}

function closeCompanionModal() {
    companionOptionsManager.closeModal();
}

function startCompanionCreation(type) {
    companionOptionsManager.startCompanionCreation(type);
}

// Export for use in other modules
window.CompanionOptionsManager = CompanionOptionsManager;
window.companionOptionsManager = companionOptionsManager; 