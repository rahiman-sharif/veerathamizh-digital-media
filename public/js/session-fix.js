// Enhanced Session Management Script
(function() {
    'use strict';
    
    // Session monitoring configuration
    const SESSION_CONFIG = {
        checkInterval: 30000, // Check every 30 seconds
        warningBeforeExpiry: 300000, // Warn 5 minutes before expiry
        maxRetries: 3,
        currentRetries: 0
    };
    
    let sessionCheckInterval;
    let sessionWarningShown = false;
    
    // Initialize session monitoring
    function initSessionMonitoring() {
        console.log('[Session Fix] Initializing enhanced session monitoring...');
        
        // Start periodic session checks
        sessionCheckInterval = setInterval(checkSessionHealth, SESSION_CONFIG.checkInterval);
        
        // Add session recovery for failed requests
        setupGlobalErrorHandling();
        
        // Monitor navigation events
        setupNavigationMonitoring();
        
        console.log('[Session Fix] Session monitoring initialized successfully');
    }

    
    // Check session health
    async function checkSessionHealth() {
        try {
            const response = await fetch('/user/details', {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.status === 401) {
                handleSessionExpiry();
                return;
            }
            
            if (!response.ok) {
                SESSION_CONFIG.currentRetries++;
                if (SESSION_CONFIG.currentRetries >= SESSION_CONFIG.maxRetries) {
                    console.warn('[Session Fix] Multiple session check failures, redirecting to login');
                    handleSessionExpiry();
                }
                return;
            }
            
            // Reset retry counter on success
            SESSION_CONFIG.currentRetries = 0;
            sessionWarningShown = false;
            
        } catch (error) {
            console.warn('[Session Fix] Session health check failed:', error);
            SESSION_CONFIG.currentRetries++;
            
            if (SESSION_CONFIG.currentRetries >= SESSION_CONFIG.maxRetries) {
                handleSessionExpiry();
            }
        }
    }
    
    // Handle session expiry
    function handleSessionExpiry() {
        console.warn('[Session Fix] Session expired or invalid, redirecting to login');
        
        // Clear any existing intervals
        if (sessionCheckInterval) {
            clearInterval(sessionCheckInterval);
        }
        
        // Store current page for redirect after login
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath !== '/auth/login') {
            localStorage.setItem('redirectAfterLogin', currentPath);
        }
          // Show user-friendly message and redirect
        if (window.enhancedAlerts) {
            window.enhancedAlerts.warning('Session Expired', 'Your session has expired. Please log in again.');
        } else if (window.showToast) {
            showToast('Your session has expired. Please log in again.', 'warning');
        } else {
            alert('Your session has expired. Please log in again.');
        }
        
        setTimeout(() => {
            window.location.href = '/auth/login?error=Session expired';
        }, 1500);
    }

    
    // Setup global error handling for session-related failures
    function setupGlobalErrorHandling() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            try {
                const response = await originalFetch.apply(this, args);
                
                // Check for session-related errors
                if (response.status === 401) {
                    console.warn('[Session Fix] 401 Unauthorized detected in fetch request');
                    handleSessionExpiry();
                    return response;
                }
                
                return response;
            } catch (error) {
                console.error('[Session Fix] Fetch error:', error);
                throw error;
            }
        };
        
        // Intercept XMLHttpRequests
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            
            xhr.open = function(...args) {
                const result = originalOpen.apply(this, args);
                
                // Add event listener for response
                this.addEventListener('load', function() {
                    if (this.status === 401) {
                        console.warn('[Session Fix] 401 Unauthorized detected in XHR request');
                        handleSessionExpiry();
                    }
                });
                
                return result;
            };
            
            return xhr;
        };
    }
    
    // Monitor navigation events that might cause session issues
    function setupNavigationMonitoring() {
        // Monitor clicks on order-related links
        document.addEventListener('click', function(event) {
            const target = event.target.closest('a');
            if (!target) return;
            
            const href = target.getAttribute('href');
            if (href && (href.includes('/user/orders') || href.includes('/order') || href.includes('/checkout'))) {
                // Store the intended destination
                localStorage.setItem('lastIntendedPage', href);
            }
        });
        
        // Monitor page visibility changes
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                // Page became visible, check session health
                setTimeout(checkSessionHealth, 1000);
            }
        });
        
        // Monitor beforeunload to save session state
        window.addEventListener('beforeunload', function() {
            const currentPath = window.location.pathname + window.location.search;
            localStorage.setItem('lastVisitedPage', currentPath);
        });
    }
    
    // Redirect after successful login
    function handlePostLoginRedirect() {
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        const lastIntended = localStorage.getItem('lastIntendedPage');
        const lastVisited = localStorage.getItem('lastVisitedPage');
        
        if (redirectPath && redirectPath !== '/auth/login') {
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectPath;
        } else if (lastIntended && lastIntended !== '/auth/login') {
            localStorage.removeItem('lastIntendedPage');
            window.location.href = lastIntended;
        } else if (lastVisited && lastVisited !== '/auth/login') {
            localStorage.removeItem('lastVisitedPage');
            window.location.href = lastVisited;
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSessionMonitoring);
    } else {
        initSessionMonitoring();
    }
    
    // Handle post-login redirect if on home page
    if (window.location.pathname === '/' && localStorage.getItem('redirectAfterLogin')) {
        setTimeout(handlePostLoginRedirect, 500);
    }
    
    // Export functions for debugging
    window.sessionFix = {
        checkHealth: checkSessionHealth,
        handleExpiry: handleSessionExpiry,
        config: SESSION_CONFIG
    };
    
})();
