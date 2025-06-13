// Memorial App - Main JavaScript
class MemorialApp {
    constructor() {
        this.currentStep = 1;
        this.selectedOption = null;
        this.memorialData = {
            name: '',
            relationship: '',
            connectionType: ''
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupScrollEffects();
    }
    
    bindEvents() {
        // Modal events
        window.startMemorial = () => this.openModal();
        window.closeModal = () => this.closeModal();
        window.nextStep = () => this.nextStep();
        window.selectOption = (option) => this.selectOption(option);
        window.showDemo = () => this.showDemo();
        
        // Close modal on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
        
        // Form validation
        document.addEventListener('input', (e) => {
            if (e.target.matches('#loved-one-name, #relationship')) {
                this.validateStep1();
            }
        });
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    setupScrollEffects() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Add scroll effects to navigation
        window.addEventListener('scroll', () => {
            const nav = document.querySelector('.nav');
            if (window.scrollY > 100) {
                nav.style.background = 'rgba(255, 255, 255, 0.98)';
                nav.style.borderBottomColor = 'var(--border)';
            } else {
                nav.style.background = 'rgba(255, 255, 255, 0.95)';
                nav.style.borderBottomColor = 'var(--border-light)';
            }
        });
    }
    
    openModal() {
        const modal = document.getElementById('memorial-modal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Reset form
        this.currentStep = 1;
        this.selectedOption = null;
        this.memorialData = { name: '', relationship: '', connectionType: '' };
        this.showStep(1);
        
        // Focus first input
        setTimeout(() => {
            const firstInput = document.getElementById('loved-one-name');
            if (firstInput) firstInput.focus();
        }, 100);
    }
    
    closeModal() {
        const modal = document.getElementById('memorial-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    nextStep() {
        if (this.currentStep === 1) {
            if (this.validateStep1()) {
                this.memorialData.name = document.getElementById('loved-one-name').value;
                this.memorialData.relationship = document.getElementById('relationship').value;
                this.currentStep = 2;
                this.showStep(2);
            }
        }
    }
    
    validateStep1() {
        const name = document.getElementById('loved-one-name').value.trim();
        const relationship = document.getElementById('relationship').value;
        const continueBtn = document.querySelector('[data-step="1"] .btn-primary');
        
        if (name && relationship) {
            continueBtn.disabled = false;
            continueBtn.style.opacity = '1';
            return true;
        } else {
            continueBtn.disabled = true;
            continueBtn.style.opacity = '0.5';
            return false;
        }
    }
    
    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStepEl = document.querySelector(`[data-step="${stepNumber}"]`);
        if (currentStepEl) {
            currentStepEl.classList.add('active');
            currentStepEl.classList.add('animate-fade-in');
        }
    }
    
    selectOption(option) {
        // Update selected option
        this.selectedOption = option;
        this.memorialData.connectionType = option;
        
        // Update UI
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        event.target.closest('.option').classList.add('selected');
        
        // Redirect to memorial creation page after a short delay
        setTimeout(() => {
            this.proceedToMemorialCreation();
        }, 500);
    }
    
    proceedToMemorialCreation() {
        // Store data in localStorage for the next page
        localStorage.setItem('memorialData', JSON.stringify(this.memorialData));
        
        // Close modal and show success message
        this.closeModal();
        this.showSuccessMessage();
    }
    
    showSuccessMessage() {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <div>
                    <h3>Memorial creation started</h3>
                    <p>We'll guide you through creating a memorial for ${this.memorialData.name}</p>
                </div>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--spacing-4);
            box-shadow: var(--shadow-lg);
            z-index: 3000;
            max-width: 350px;
            animation: slideInRight 0.5s ease;
        `;
        
        // Add notification styles to page
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .success-notification {
                    background: white;
                    border-left: 4px solid var(--success);
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-3);
                }
                
                .notification-content i {
                    color: var(--success);
                    font-size: var(--font-size-xl);
                }
                
                .notification-content h3 {
                    font-size: var(--font-size-base);
                    font-weight: 600;
                    margin: 0 0 var(--spacing-1) 0;
                    color: var(--text-primary);
                }
                
                .notification-content p {
                    font-size: var(--font-size-sm);
                    color: var(--text-secondary);
                    margin: 0;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);
        
        // Redirect to memorial creation page after 2 seconds
        setTimeout(() => {
            this.redirectToMemorialApp();
        }, 2000);
    }
    
    redirectToMemorialApp() {
        // For now, we'll just create a memorial creation page
        // In a real app, this would redirect to a separate route
        window.location.href = 'memorial-creation.html';
    }
    
    showDemo() {
        // Create demo modal
        const demoModal = document.createElement('div');
        demoModal.className = 'modal';
        demoModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>How Memorial Works</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="demo-content">
                        <div class="demo-step">
                            <div class="demo-icon">
                                <i class="fas fa-upload"></i>
                            </div>
                            <div class="demo-text">
                                <h3>Upload memories</h3>
                                <p>Share photos, voice recordings, text messages, emails, or any content that captures their personality.</p>
                            </div>
                        </div>
                        
                        <div class="demo-step">
                            <div class="demo-icon">
                                <i class="fas fa-brain"></i>
                            </div>
                            <div class="demo-text">
                                <h3>AI learns their essence</h3>
                                <p>Our AI analyzes their communication style, voice patterns, and personality to create an authentic representation.</p>
                            </div>
                        </div>
                        
                        <div class="demo-step">
                            <div class="demo-icon">
                                <i class="fas fa-comments"></i>
                            </div>
                            <div class="demo-text">
                                <h3>Start conversations</h3>
                                <p>Talk with them through text or voice. Ask questions, share your day, or simply say what you need to say.</p>
                            </div>
                        </div>
                        
                        <div class="demo-cta">
                            <button class="btn btn-primary btn-large" onclick="this.closest('.modal').remove(); startMemorial();">
                                <i class="fas fa-heart"></i>
                                Create your memorial
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add demo styles
        if (!document.getElementById('demo-styles')) {
            const styles = document.createElement('style');
            styles.id = 'demo-styles';
            styles.textContent = `
                .demo-content {
                    padding: var(--spacing-4);
                }
                
                .demo-step {
                    display: flex;
                    align-items: flex-start;
                    gap: var(--spacing-4);
                    margin-bottom: var(--spacing-6);
                    padding: var(--spacing-4);
                    border-radius: var(--radius-lg);
                    background: var(--background-secondary);
                }
                
                .demo-icon {
                    width: 48px;
                    height: 48px;
                    background: var(--gradient-primary);
                    color: white;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: var(--font-size-lg);
                    flex-shrink: 0;
                }
                
                .demo-text h3 {
                    font-size: var(--font-size-lg);
                    font-weight: 600;
                    margin-bottom: var(--spacing-2);
                    color: var(--text-primary);
                }
                
                .demo-text p {
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin: 0;
                }
                
                .demo-cta {
                    text-align: center;
                    padding-top: var(--spacing-6);
                    border-top: 1px solid var(--border-light);
                    margin-top: var(--spacing-6);
                }
            `;
            document.head.appendChild(styles);
        }
        
        demoModal.classList.add('active');
        document.body.appendChild(demoModal);
        document.body.style.overflow = 'hidden';
        
        // Close on outside click
        demoModal.addEventListener('click', (e) => {
            if (e.target === demoModal) {
                demoModal.remove();
                document.body.style.overflow = '';
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MemorialApp();
});

// Add additional utility functions
function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    });
    
    // Observe elements that should animate on scroll
    document.querySelectorAll('.step, .feature, .privacy-content').forEach(el => {
        observer.observe(el);
    });
}

// Initialize scroll animations
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(animateOnScroll, 100);
});

// Add slideOutRight animation
if (!document.getElementById('slide-out-styles')) {
    const styles = document.createElement('style');
    styles.id = 'slide-out-styles';
    styles.textContent = `
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(styles);
}