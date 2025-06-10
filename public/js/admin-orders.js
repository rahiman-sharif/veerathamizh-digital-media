/**
 * Admin Orders JavaScript
 * Handles functionality for the admin orders page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(tooltipTriggerEl => {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });    // Handle status changes
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function() {
            const orderId = this.dataset.orderId;
            const newStatus = this.value;
            
            // Find the status badge in the same container as the select
            const statusContainer = this.closest('.d-flex');
            const statusBadge = statusContainer.querySelector('.status-badge');
            
            // Call the API to update status
            fetch(`/admin/orders/${orderId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Only update the badge after successful API call
                    if (statusBadge) {
                        updateStatusBadge(statusBadge, newStatus);
                    }
                    showToast('Order status updated successfully');
                } else {
                    // Revert the select value on failure
                    this.value = statusBadge.textContent.trim().toLowerCase();
                    throw new Error(data.error || 'Failed to update status');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Failed to update order status: ' + error.message, 'error');
            });
        });
    });    // Helper function to update status badge visually
    function updateStatusBadge(badge, status) {
        // Remove existing status classes
        badge.classList.remove('bg-warning', 'text-dark', 'bg-info', 'bg-primary', 'bg-success', 'bg-danger', 'bg-secondary');
        
        // Get or create the icon element if it doesn't exist
        let icon = badge.querySelector('i');
        if (!icon) {
            icon = document.createElement('i');
            icon.className = 'fas me-1';
            badge.prepend(icon);
        } else {
            // Remove existing icon classes
            icon.classList.remove('fa-clock', 'fa-inbox', 'fa-print', 'fa-check-double', 
                                'fa-truck', 'fa-box-open', 'fa-times-circle', 'fa-question-circle');
        }
        
        // Set new status class and icon
        switch(status) {
            case 'pending':
                badge.classList.add('bg-warning', 'text-dark');
                if (icon) icon.classList.add('fa-clock');
                break;
            case 'received':
                badge.classList.add('bg-info');
                if (icon) icon.classList.add('fa-inbox');
                break;
            case 'printing':
                badge.classList.add('bg-primary');
                if (icon) icon.classList.add('fa-print');
                break;
            case 'printed':
                badge.classList.add('bg-info');
                if (icon) icon.classList.add('fa-check-double');
                break;
            case 'shipped':
                badge.classList.add('bg-success');
                if (icon) icon.classList.add('fa-truck');
                break;
            case 'delivered':
                badge.classList.add('bg-success');
                if (icon) icon.classList.add('fa-box-open');
                break;
            case 'cancelled':
                badge.classList.add('bg-danger');
                if (icon) icon.classList.add('fa-times-circle');
                break;
            default:
                badge.classList.add('bg-secondary');
                if (icon) icon.classList.add('fa-question-circle');
        }
          // Update text content - completely replace the text content
        // Remove any existing text nodes
        Array.from(badge.childNodes).forEach(node => {
            if (node.nodeType === 3) { // Text node
                badge.removeChild(node);
            }
        });
        
        // Capitalize first letter of status and add as new text node
        const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
        const newTextNode = document.createTextNode(' ' + formattedStatus);
        badge.appendChild(newTextNode);
    }

    // Handle notes update buttons
    document.querySelectorAll('.update-notes').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            
            // Create modal for order note input
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Update Order Notes</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="orderNotesText" class="form-label">Enter order notes/update message:</label>
                                <textarea class="form-control" id="orderNotesText" rows="3" placeholder="Enter your notes here..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="submitNotesBtn">Update Notes</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
            
            // Focus on textarea when modal is shown
            modal.addEventListener('shown.bs.modal', function() {
                document.getElementById('orderNotesText').focus();
            });
            
            // Handle submit notes button click
            document.getElementById('submitNotesBtn').addEventListener('click', function() {
                const notes = document.getElementById('orderNotesText').value.trim();
                
                if (notes) {
                    updateOrderNotes(orderId, notes);
                    bootstrapModal.hide();
                } else {
                    if (window.enhancedAlerts) {
                        window.enhancedAlerts.warning('Empty Notes', 'Please enter some notes before submitting.');
                    } else {
                        alert('Please enter some notes before submitting.');
                    }
                }
            });
            
            // Remove modal from DOM when hidden
            modal.addEventListener('hidden.bs.modal', function() {
                document.body.removeChild(modal);
            });
        });
    });
});

/**
 * Update order status via API - Deprecated in favor of inline implementation
 * @param {string} orderId - The order ID
 * @param {string} status - The new status
 * @deprecated Use the inline fetch implementation instead
 */
function updateOrderStatus(orderId, status) {
    console.warn('Deprecated function called: updateOrderStatus. Use inline fetch instead');
    return fetch(`/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Order status updated successfully');
            return data;
        } else {
            throw new Error(data.error || 'Failed to update status');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Failed to update order status: ' + error.message, 'error');
        throw error;
    });
}

/**
 * Update order notes via API
 * @param {string} orderId - The order ID
 * @param {string} notes - The notes to add
 */
function updateOrderNotes(orderId, notes) {
    fetch(`/admin/orders/${orderId}/notes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Order notes updated successfully');
        } else {
            throw new Error(data.error || 'Failed to update notes');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Failed to update order notes: ' + error.message, 'error');
    });
}

/**
 * Show toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning)
 */
function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create a new toast
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast show ${type === 'error' ? 'bg-danger text-white' : type === 'warning' ? 'bg-warning' : 'bg-success text-white'}`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Success'}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize the Bootstrap toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove after 3 seconds
    setTimeout(() => {
        bsToast.hide();
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
