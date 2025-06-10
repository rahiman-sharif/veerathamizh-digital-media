// Navbar enhancement script

document.addEventListener('DOMContentLoaded', function() {
    // Handle navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 10) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
        
        // Trigger scroll event on page load
        window.dispatchEvent(new Event('scroll'));
    }
    
    // Add active class to current page nav item
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar .nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath === href) {
            link.classList.add('active');
        }
    });
    
    // Handle mobile menu
    const navbarToggler = document.querySelector('.navbar-toggler');
    if (navbarToggler) {
        navbarToggler.addEventListener('click', function() {
            document.body.classList.toggle('mobile-nav-open');
        });
    }
    
    // Session check for authenticated links
    const authLinks = document.querySelectorAll('[data-auth-check="true"]');
    authLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Ping server to check session status before navigating
            fetch('/user/check-session')
                .then(response => {
                    if (!response.ok) {
                        e.preventDefault();
                        // Show toast or alert message
                        alert('Your session has expired. Please log in again.');
                        window.location.href = '/auth/login?redirect=' + encodeURIComponent(this.href);
                    }
                })
                .catch(() => {
                    console.log('Session check failed');
                });
        });
    });
});
