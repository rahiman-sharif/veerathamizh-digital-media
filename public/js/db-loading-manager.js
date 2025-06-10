/**
 * Brand Loading Manager - Veerathamizh Digital Media
 * Handles loading states for database operations with elegant brand styling
 * Author: Rahiman sharif 
 * Created: 2025-06-06
 */

class DBLoadingManager {
    constructor() {
        this.overlay = null;
        this.isLoading = false;
        this.operationQueue = [];
        this.init();
    }    /**
     * Initialize the loading overlay
     */
    init() {
        // Create overlay HTML structure - simplified brand design
        const overlayHTML = `
            <div id="db-loading-overlay" class="db-loading-overlay">
                <div class="db-loading-container">
                    <div id="db-spinner" class="db-spinner"></div>
                    <div id="db-loading-text" class="db-loading-text">Processing...</div>
                    <div id="db-loading-subtext" class="db-loading-subtext">Please wait while we process your request</div>
                </div>
            </div>
        `;

        // Inject into DOM if not already present
        if (!document.getElementById('db-loading-overlay')) {
            document.body.insertAdjacentHTML('beforeend', overlayHTML);
        }

        this.overlay = document.getElementById('db-loading-overlay');
        this.spinner = document.getElementById('db-spinner');
        this.loadingText = document.getElementById('db-loading-text');
        this.loadingSubtext = document.getElementById('db-loading-subtext');
    }    /**
     * Show loading spinner with optional custom message and operation type
     * @param {string} message - Custom loading message
     * @param {string} operation - Type of operation (for styling only)
     * @param {string} subtext - Additional description
     */
    show(message = 'Processing...', operation = 'fetch', subtext = 'Please wait while we process your request') {
        if (this.isLoading) {
            console.warn('Loading manager: Already showing loader');
            return;
        }

        this.isLoading = true;

        // Update content
        if (this.loadingText) this.loadingText.textContent = message;
        if (this.loadingSubtext) this.loadingSubtext.textContent = subtext;

        // Show overlay with fade-in effect
        if (this.overlay) {
            this.overlay.classList.add('active');
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        console.log(`DB Loading: ${message} (${operation})`);
    }

    /**
     * Hide loading spinner
     */
    hide() {
        if (!this.isLoading) {
            return;
        }

        this.isLoading = false;

        // Hide overlay with fade-out effect
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }

        // Restore body scroll
        document.body.style.overflow = '';

        console.log('DB Loading: Hidden');
    }    /**
     * Show loading for a specific duration (for testing)
     * @param {number} duration - Duration in milliseconds
     * @param {string} message - Loading message
     * @param {string} operation - Operation type
     */
    showForDuration(duration = 2000, message = 'Processing...', operation = 'fetch') {
        this.show(message, operation);
        setTimeout(() => {
            this.hide();
        }, duration);
    }

    /**
     * Check if currently loading
     * @returns {boolean}
     */
    isCurrentlyLoading() {
        return this.isLoading;
    }

    /**
     * Get operation-specific messages
     * @param {string} operation - Operation type
     * @returns {object} - Message and subtext for operation
     */
    getOperationMessages(operation) {
        const messages = {
            login: {
                message: 'Authenticating...',
                subtext: 'Verifying your credentials'
            },
            register: {
                message: 'Creating Account...',
                subtext: 'Setting up your profile'
            },
            save: {
                message: 'Saving Data...',
                subtext: 'Your information is being stored'
            },
            update: {
                message: 'Updating Record...',
                subtext: 'Applying your changes'
            },
            delete: {
                message: 'Deleting Item...',
                subtext: 'Removing from database'
            },
            fetch: {
                message: 'Loading Data...',
                subtext: 'Retrieving information'
            },
            checkout: {
                message: 'Processing Order...',
                subtext: 'Finalizing your purchase'
            },
            upload: {
                message: 'Uploading File...',
                subtext: 'Processing your upload'
            }
        };

        return messages[operation] || messages.fetch;
    }
}

// Create global instance
let dbLoadingManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    dbLoadingManager = new DBLoadingManager();
    
    // Make it globally accessible
    window.DBLoading = dbLoadingManager;
});

// Export for use in modules (if using module system)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DBLoadingManager;
}
