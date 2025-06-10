/**
 * Enhanced Alert System for Veerathamizh Digital Media
 * Provides popup-style alerts with brand styling and smooth animations
 */

class EnhancedAlerts {
    constructor() {
        this.container = null;
        this.alerts = new Map();
        this.alertCounter = 0;
        this.defaultDuration = 5000;
        this.init();
    }    init() {
        // Use existing enhanced alerts container or create one
        this.container = document.getElementById('enhanced-alerts-container');
        
        if (!this.container) {
            // Fallback: look for existing alert-container class
            this.container = document.querySelector('.alert-container');
        }
        
        if (!this.container) {
            // Last resort: create new container
            this.container = document.createElement('div');
            this.container.id = 'enhanced-alerts-container';
            this.container.className = 'alert-container alert-stack';
            document.body.appendChild(this.container);
        } else {
            // Ensure the existing container has the proper classes
            if (!this.container.classList.contains('alert-container')) {
                this.container.classList.add('alert-container');
            }
            if (!this.container.classList.contains('alert-stack')) {
                this.container.classList.add('alert-stack');
            }
        }

        // Replace existing Bootstrap alerts on page load
        this.replaceExistingAlerts();
    }

    /**
     * Show an alert with enhanced styling
     * @param {string} type - Alert type: 'success', 'danger', 'warning', 'info'
     * @param {string} title - Alert title
     * @param {string} message - Alert message
     * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
     * @param {boolean} dismissible - Whether the alert can be manually closed
     */
    show(type = 'info', title = '', message = '', duration = this.defaultDuration, dismissible = true) {
        const alertId = `alert-${++this.alertCounter}`;
        
        // Create alert element
        const alertElement = this.createAlertElement(alertId, type, title, message, dismissible);
        
        // Add to container
        this.container.appendChild(alertElement);
        
        // Store alert reference
        this.alerts.set(alertId, {
            element: alertElement,
            type: type,
            duration: duration,
            timeout: null
        });

        // Trigger show animation
        setTimeout(() => {
            alertElement.classList.add('show');
        }, 10);

        // Set auto-dismiss if duration is specified
        if (duration > 0) {
            this.setAutoDismiss(alertId, duration);
        }

        // If a visible .alert-danger is present, skip showing popups for danger alerts
        const visibleDangerAlert = document.querySelector('.alert-danger:not(.processed):not([style*="display: none"])');
        if (visibleDangerAlert && type === 'danger') {
            this.dismiss(alertId);
            return;
        }

        return alertId;
    }

    createAlertElement(id, type, title, message, dismissible) {
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible`;
        alertElement.id = id;
        alertElement.setAttribute('role', 'alert');

        // Get icon for alert type
        const icon = this.getAlertIcon(type);

        alertElement.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="alert-message">
                    ${title ? `<div class="alert-title">${title}</div>` : ''}
                    ${message ? `<div class="alert-description">${message}</div>` : ''}
                </div>
            </div>
            ${dismissible ? `
                <button type="button" class="btn-close" aria-label="Close" onclick="enhancedAlerts.dismiss('${id}')">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
            <div class="alert-progress"></div>
        `;

        return alertElement;
    }

    getAlertIcon(type) {
        const icons = {
            'success': 'fas fa-check',
            'danger': 'fas fa-exclamation-triangle',
            'warning': 'fas fa-exclamation',
            'info': 'fas fa-info'
        };
        return icons[type] || icons['info'];
    }

    setAutoDismiss(alertId, duration) {
        const alert = this.alerts.get(alertId);
        if (!alert) return;

        alert.timeout = setTimeout(() => {
            this.dismiss(alertId);
        }, duration);
    }

    dismiss(alertId) {
        const alert = this.alerts.get(alertId);
        if (!alert) return;

        // Clear timeout if exists
        if (alert.timeout) {
            clearTimeout(alert.timeout);
        }

        // Add hiding animation
        alert.element.classList.add('hiding');

        // Remove after animation
        setTimeout(() => {
            if (alert.element.parentNode) {
                alert.element.parentNode.removeChild(alert.element);
            }
            this.alerts.delete(alertId);
        }, 300);
    }

    dismissAll() {
        this.alerts.forEach((alert, alertId) => {
            this.dismiss(alertId);
        });
    }

    /**
     * Show a confirmation dialog with enhanced styling
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {function} onConfirm - Callback when confirmed
     * @param {function} onCancel - Callback when cancelled (optional)
     * @param {string} confirmText - Text for confirm button (default: 'Confirm')
     * @param {string} cancelText - Text for cancel button (default: 'Cancel')
     * @param {string} type - Dialog type: 'warning', 'danger', 'info' (default: 'warning')
     */
    confirm(title, message, onConfirm, onCancel = null, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning') {
        const modalId = `confirm-modal-${++this.alertCounter}`;
        
        // Create modal HTML
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header bg-${type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'primary'} text-white">
                            <h5 class="modal-title d-flex align-items-center" id="${modalId}Label">
                                <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation' : 'question'} me-2"></i>
                                ${title}
                            </h5>
                        </div>
                        <div class="modal-body py-4">
                            <p class="mb-0">${message}</p>
                        </div>
                        <div class="modal-footer border-0 pt-0">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" id="${modalId}-cancel">
                                <i class="fas fa-times me-1"></i>${cancelText}
                            </button>
                            <button type="button" class="btn btn-${type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'primary'}" id="${modalId}-confirm">
                                <i class="fas fa-check me-1"></i>${confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Get modal element
        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement);
        
        // Handle confirm button
        document.getElementById(`${modalId}-confirm`).addEventListener('click', () => {
            modal.hide();
            if (onConfirm) onConfirm();
        });
        
        // Handle cancel button
        document.getElementById(`${modalId}-cancel`).addEventListener('click', () => {
            modal.hide();
            if (onCancel) onCancel();
        });
        
        // Clean up modal after hide
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });
        
        // Show modal
        modal.show();
        
        return modal;
    }

    /**
     * Show success alert
     */
    success(title, message, duration = this.defaultDuration) {
        return this.show('success', title, message, duration);
    }

    /**
     * Show error alert
     */
    error(title, message, duration = 0) {
        return this.show('danger', title, message, duration);
    }

    /**
     * Show warning alert
     */
    warning(title, message, duration = this.defaultDuration) {
        return this.show('warning', title, message, duration);
    }

    /**
     * Show info alert
     */
    info(title, message, duration = this.defaultDuration) {
        return this.show('info', title, message, duration);
    }    // Replace existing Bootstrap alerts with enhanced ones
    replaceExistingAlerts() {
        // First, handle alerts with data attributes (server-side alerts)
        const dataAlerts = document.querySelectorAll('[data-enhanced-alert]:not(.processed)');        dataAlerts.forEach(alert => {
            const type = alert.getAttribute('data-enhanced-alert');
            const message = alert.getAttribute('data-message');
            
            if (type && message) {
                const title = this.getAlertTitle(type, message);
                this.show(type, title, message, 6000);
                alert.classList.add('processed');
                alert.remove();
            }
        });

        // Then handle any remaining Bootstrap alerts
        const existingAlerts = document.querySelectorAll('.alert:not(.enhanced):not([data-enhanced-alert]):not(.processed)');
        
        // If a visible .alert-danger is present, skip showing enhanced popup for danger alerts
        const visibleDangerAlert = document.querySelector('.alert-danger:not(.processed):not([style*="display: none"])');
        
        existingAlerts.forEach(alert => {
            // Skip if already hidden or processed
            if (alert.style.display === 'none' || alert.classList.contains('d-none')) {
                return;
            }

            // Extract information from existing alert
            let type = 'info';
            const alertClass = alert.getAttribute('class') || '';
            if (alertClass.includes('alert-success')) type = 'success';
            else if (alertClass.includes('alert-danger')) type = 'danger';
            else if (alertClass.includes('alert-warning')) type = 'warning';
            else if (alertClass.includes('alert-info')) type = 'info';

            // If a visible .alert-danger is present, skip showing enhanced popup for danger alerts
            if (type === 'danger' && visibleDangerAlert) {
                alert.classList.add('processed');
                alert.style.display = 'none';
                return;
            }            const message = alert.textContent.trim();
            const title = this.getAlertTitle(type, message);

            // Create enhanced alert
            if (message) {
                this.show(type, title, message, 6000);
            }

            // Mark as processed and remove original alert
            alert.classList.add('processed');
            alert.style.display = 'none';
        });
    }    getAlertTitle(type, message) {
        // Check if this is a logout message to avoid duplicate "Success!"
        if (type === 'success' && message && 
            (message.includes('logged out') || message.includes('logout'))) {
            return '';  // Empty title for logout messages
        }
        
        const titles = {
            'success': 'Success!',
            'danger': 'Error!',
            'warning': 'Warning!',
            'info': 'Information'
        };
        return titles[type] || 'Notification';
    }

    // Method to handle server-side flash messages
    handleFlashMessages(messages) {
        if (typeof messages === 'object') {            Object.keys(messages).forEach(type => {
                if (Array.isArray(messages[type])) {
                    messages[type].forEach(message => {
                        this.show(type, this.getAlertTitle(type, message), message);
                    });
                } else {
                    const message = messages[type];
                    this.show(type, this.getAlertTitle(type, message), message);
                }
            });
        }
    }
}

// Initialize enhanced alerts system
if (!window.enhancedAlerts) {
    const enhancedAlerts = new EnhancedAlerts();
    
    // Export for use in other scripts
    window.enhancedAlerts = enhancedAlerts;
    
    // Auto-replace alerts when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Handle any existing alerts
        enhancedAlerts.replaceExistingAlerts();
        
        // Handle flash messages if they exist in window
        if (window.flashMessages) {
            enhancedAlerts.handleFlashMessages(window.flashMessages);
        }
    });
}

// Example usage functions for testing
window.testAlerts = {
    success: () => enhancedAlerts.success('Success!', 'Your action was completed successfully.'),
    error: () => enhancedAlerts.error('Error!', 'Something went wrong. Please try again.'),
    warning: () => enhancedAlerts.warning('Warning!', 'Please check your input and try again.'),
    info: () => enhancedAlerts.info('Information', 'Here is some important information for you.'),
    multiple: () => {
        enhancedAlerts.success('Order Created', 'Your order has been successfully created.');
        setTimeout(() => enhancedAlerts.info('Email Sent', 'Confirmation email has been sent.'), 500);
        setTimeout(() => enhancedAlerts.warning('Payment Pending', 'Please complete the payment process.'), 1000);
    },
    confirm: () => {
        enhancedAlerts.confirm(
            'Confirm Action',
            'Are you sure you want to perform this action?',
            () => { enhancedAlerts.success('Confirmed', 'Your action has been confirmed.'); },
            () => { enhancedAlerts.info('Cancelled', 'The action has been cancelled.'); },
            'Yes, Confirm',
            'No, Cancel',
            'warning'
        );
    }
};
