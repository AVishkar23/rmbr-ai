// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (navMenu && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                }
            }
        });
    });
    
    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
    
    // Button click animations
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .floating-card');
    animateElements.forEach(el => {
        observer.observe(el);
    });
    
    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    const floatingCards = document.querySelectorAll('.floating-card');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        if (hero) {
            hero.style.transform = `translateY(${rate}px)`;
        }
        
        floatingCards.forEach((card, index) => {
            const speed = 0.1 + (index * 0.05);
            card.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
    
    // Add loading animation
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });
    
    // Typing effect for hero title
    const heroTitle = document.querySelector('.hero-title .gradient-text');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                heroTitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };
        
        // Start typing effect after a short delay
        setTimeout(typeWriter, 500);
    }
});

// Add CSS for ripple effect and animations
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease-out forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .nav-menu.active {
        display: flex;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        flex-direction: column;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border-top: 1px solid #e8e8e8;
    }
    
    .hamburger.active span:nth-child(1) {
        transform: rotate(-45deg) translate(-5px, 6px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(45deg) translate(-5px, -6px);
    }
    
    body.loaded .hero {
        opacity: 1;
        transform: translateY(0);
    }
    
    .hero {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.8s ease-out;
    }
    
    .feature-card {
        opacity: 0;
        transform: translateY(30px);
    }
    
    .feature-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .floating-card {
        opacity: 0;
        transform: translateY(20px);
    }
    
    .floating-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
`;

document.head.appendChild(style);

// Initialize Three.js 3D Background
let scene, camera, renderer, particles;

function initThreeJS() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('bgCanvas'),
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create particles
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

        colors[i * 3] = Math.random() * 0.5 + 0.5; // R
        colors[i * 3 + 1] = Math.random() * 0.3 + 0.7; // G
        colors[i * 3 + 2] = Math.random() * 0.8 + 0.2; // B
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.6
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    camera.position.z = 5;

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    particles.rotation.x += 0.001;
    particles.rotation.y += 0.002;

    // Mouse interaction
    const mouseX = (window.mouseX || 0) * 0.001;
    const mouseY = (window.mouseY || 0) * 0.001;
    
    particles.rotation.x += mouseY * 0.1;
    particles.rotation.y += mouseX * 0.1;

    renderer.render(scene, camera);
}

// Mouse tracking for 3D interaction
document.addEventListener('mousemove', (event) => {
    window.mouseX = event.clientX - window.innerWidth / 2;
    window.mouseY = event.clientY - window.innerHeight / 2;
});

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            gsap.to(window, {
                duration: 1,
                scrollTo: { y: target, offsetY: 80 },
                ease: "power2.inOut"
            });
        }
    });
});

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    ScrollTrigger.create({
        start: "top top",
        end: 99999,
        onUpdate: (self) => {
            if (self.progress > 0.1) {
                navbar.style.background = 'rgba(255, 255, 255, 0.1)';
                navbar.style.backdropFilter = 'blur(20px)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.05)';
                navbar.style.backdropFilter = 'blur(20px)';
            }
        }
    });
}

// Feature cards animation
function initFeatureCards() {
    gsap.utils.toArray('.feature-card').forEach((card, index) => {
        gsap.fromTo(card, 
            {
                y: 100,
                opacity: 0
            },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: card,
                    start: "top bottom-=100",
                    end: "bottom top",
                    toggleActions: "play none none reverse"
                },
                delay: index * 0.1
            }
        );
    });
}

// Step items animation
function initStepItems() {
    gsap.utils.toArray('.step-item').forEach((step, index) => {
        gsap.fromTo(step,
            {
                x: index % 2 === 0 ? -100 : 100,
                opacity: 0
            },
            {
                x: 0,
                opacity: 1,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: step,
                    start: "top bottom-=100",
                    end: "bottom top",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });
}

// Floating elements animation
function initFloatingElements() {
    // Floating card
    gsap.to('.floating-card', {
        y: -20,
        rotation: 2,
        duration: 6,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
    });

    // Floating icons
    gsap.utils.toArray('.floating-icon').forEach((icon, index) => {
        gsap.to(icon, {
            y: -30,
            rotation: 360,
            duration: 8,
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1,
            delay: index * 2
        });
    });
}

// Button hover effects
function initButtonEffects() {
    // Primary button particles
    document.querySelectorAll('.primary-button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            gsap.to(this.querySelector('.button-particles'), {
                scale: 1.2,
                duration: 0.3,
                ease: "power2.out"
            });
        });

        button.addEventListener('mouseleave', function() {
            gsap.to(this.querySelector('.button-particles'), {
                scale: 1,
                duration: 0.3,
                ease: "power2.out"
            });
        });
    });

    // Glow button effect
    document.querySelectorAll('.glow-button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            gsap.to(this, {
                boxShadow: '0 0 30px rgba(102, 126, 234, 0.6)',
                duration: 0.3,
                ease: "power2.out"
            });
        });

        button.addEventListener('mouseleave', function() {
            gsap.to(this, {
                boxShadow: '0 0 20px rgba(102, 126, 234, 0.3)',
                duration: 0.3,
                ease: "power2.out"
            });
        });
    });
}

// Parallax effect for hero section
function initParallax() {
    gsap.to('.hero-visual', {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero-section",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });
}

// Stats counter animation
function initStatsCounter() {
    const stats = document.querySelectorAll('.stat-number');
    
    stats.forEach(stat => {
        const target = parseInt(stat.textContent.replace(/\D/g, ''));
        const suffix = stat.textContent.replace(/\d/g, '');
        
        ScrollTrigger.create({
            trigger: stat,
            start: "top bottom-=100",
            onEnter: () => {
                gsap.fromTo(stat, 
                    { textContent: 0 },
                    {
                        textContent: target,
                        duration: 2,
                        ease: "power2.out",
                        snap: { textContent: 1 },
                        onUpdate: function() {
                            stat.textContent = Math.ceil(stat.textContent) + suffix;
                        }
                    }
                );
            }
        });
    });
}

// Mobile menu toggle
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            const isOpen = navMenu.style.display === 'flex';
            
            if (isOpen) {
                gsap.to(navMenu, {
                    opacity: 0,
                    y: -20,
                    duration: 0.3,
                    ease: "power2.out",
                    onComplete: () => {
                        navMenu.style.display = 'none';
                    }
                });
            } else {
                navMenu.style.display = 'flex';
                gsap.fromTo(navMenu, 
                    { opacity: 0, y: -20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.3,
                        ease: "power2.out"
                    }
                );
            }
            
            // Hamburger animation
            gsap.to(hamburger.querySelectorAll('span'), {
                rotation: isOpen ? 0 : 45,
                y: isOpen ? 0 : 8,
                duration: 0.3,
                ease: "power2.out",
                stagger: 0.1
            });
        });
    }
}

// Cursor trail effect
function initCursorTrail() {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-trail';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        mix-blend-mode: screen;
    `;
    document.body.appendChild(cursor);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.1;
        cursorY += (mouseY - cursorY) * 0.1;
        
        cursor.style.left = cursorX - 10 + 'px';
        cursor.style.top = cursorY - 10 + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
}

// Text reveal animation
function initTextReveal() {
    gsap.utils.toArray('.title-line').forEach((line, index) => {
        gsap.fromTo(line,
            {
                y: 50,
                opacity: 0
            },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out",
                delay: index * 0.2
            }
        );
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Three.js
    initThreeJS();
    
    // Initialize all animations
    initNavbarScroll();
    initFeatureCards();
    initStepItems();
    initFloatingElements();
    initButtonEffects();
    initParallax();
    initStatsCounter();
    initMobileMenu();
    initCursorTrail();
    initTextReveal();
    
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
});

// Performance optimization
let ticking = false;

function updateOnScroll() {
    if (!ticking) {
        requestAnimationFrame(() => {
            // Update any scroll-based animations here
            ticking = false;
        });
        ticking = true;
    }
}

window.addEventListener('scroll', updateOnScroll);

// Preload critical assets
function preloadAssets() {
    const criticalImages = [
        // Add any critical images here
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Initialize preloading
preloadAssets();

// Add loading screen (optional)
function showLoadingScreen() {
    const loader = document.createElement('div');
    loader.className = 'loading-screen';
    loader.innerHTML = `
        <div class="loader">
            <div class="loader-icon">
                <i class="fas fa-heart"></i>
            </div>
            <div class="loader-text">Loading Rmbr AI...</div>
        </div>
    `;
    
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--background);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    document.body.appendChild(loader);
    
    // Remove loader after page loads
    window.addEventListener('load', () => {
        gsap.to(loader, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => {
                loader.remove();
            }
        });
    });
}

// Show loading screen
showLoadingScreen(); 