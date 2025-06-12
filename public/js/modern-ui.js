// Modern UI JavaScript for Veerathamizh Digital Media Group

document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });
    
    // Start counting for statistics
    initCounters();
    
    // Initialize parallax effect on hero section
    initParallax();
    
    // Add ripple effect to buttons
    initRippleEffect();
    
    // Smooth scrolling for anchor links
    initSmoothScrolling();
});

// Function to animate counters
function initCounters() {
    const counterElements = document.querySelectorAll('.counter-number');
    
    if (counterElements.length === 0) return;
    
    const options = {
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-count'));
                const duration = 2000; // ms
                const step = target / duration * 10;
                let current = 0;
                
                const updateCounter = setInterval(function() {
                    current += step;
                    if (current >= target) {
                        counter.textContent = target;
                        clearInterval(updateCounter);
                    } else {
                        counter.textContent = Math.floor(current);
                    }
                }, 10);
                
                observer.unobserve(counter);
            }
        });
    }, options);
    
    counterElements.forEach(counter => {
        observer.observe(counter);
    });
}

// Function to initialize parallax effect
function initParallax() {
    const heroSection = document.querySelector('.hero-container');
    
    if (!heroSection) return;
    
    document.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        
        // Parallax effect for hero background
        if (scrollPosition <= window.innerHeight) {
            const translateY = scrollPosition * 0.3;
            const heroBackground = document.querySelector('.hero-background');
            if (heroBackground) {
                heroBackground.style.transform = `translateY(${translateY}px)`;
            }
            
            // Parallax effect for floating shapes
            const floatingShapes = document.querySelectorAll('.floating-shape');
            floatingShapes.forEach((shape, index) => {
                const factor = 0.1 * (index + 1);
                shape.style.transform = `translateY(${scrollPosition * factor}px)`;
            });
        }
    });
}

// Function to add ripple effect to buttons
function initRippleEffect() {
    const buttons = document.querySelectorAll('.btn-modern-primary, .btn-modern-secondary');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Function for smooth scrolling to anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for fixed navbar
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Function to handle sticky navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    
    if (!navbar) return;
    
    if (window.scrollY > 100) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});
