// Direct fix for upload and session issues
console.log('🔧 Direct fix loaded for upload and session management');

// Session management functionality
window.checkSession = function() {
    return fetch('/user/details')
        .then(response => {
            if (!response.ok) {
                throw new Error('Session expired or invalid');
            }
            return response.json();
        })
        .then(data => {
            console.log('Session is valid', data);
            return true;
        })
        .catch(error => {
            console.error('Session error:', error);
            alert('Your session has expired. Please log in again.');
            window.location.href = '/auth/login?session_expired=true';
            return false;
        });
};

// Setup session handling for order confirmation page
function setupSessionHandling() {
    // Add error handling to view order button
    const viewOrderButtons = document.querySelectorAll('a[href="/user/orders"]');
    
    viewOrderButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            // Store a flag in localStorage to check if we can access the page
            localStorage.setItem('checkingOrderAccess', 'true');
            
            // We'll let the navigation proceed normally
        });
    });
    
    // Check if we're on the orders page and there was an error
    if (window.location.pathname === '/user/orders' && 
        document.body.textContent.includes('Error loading orders') &&
        localStorage.getItem('checkingOrderAccess') === 'true') {
        
        // Clear the flag
        localStorage.removeItem('checkingOrderAccess');
        
        // Show helpful message
        alert('Session error detected. Please log in again to view your orders.');
        
        // Redirect to login page
        window.location.href = '/auth/login?session_expired=true';
    }
    
    // Add debug info to confirmation page
    if (window.location.pathname.includes('/confirmation')) {
        console.log('On confirmation page - checking session');
        
        // Add a hidden button to check session
        const debugButton = document.createElement('button');
        debugButton.textContent = 'Debug Session';
        debugButton.style.position = 'fixed';
        debugButton.style.bottom = '10px';
        debugButton.style.right = '10px';
        debugButton.style.zIndex = '9999';
        debugButton.style.opacity = '0.7';
        debugButton.style.fontSize = '10px';
        
        debugButton.addEventListener('click', function() {
            checkSession();
        });
        
        document.body.appendChild(debugButton);
    }
}

// Upload fix functionality
window.fixUpload = function() {
    console.log('Running direct upload fix');
    
    // Get the necessary elements
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const uploadArea = document.getElementById('upload-area');
    const previewArea = document.getElementById('preview-area');
    
    if (!fileInput || !uploadButton) {
        console.error('Required elements not found');
        return;
    }
    
    console.log('Elements found, applying fix');
    
    // Create a new file input to replace the existing one
    const newFileInput = document.createElement('input');
    newFileInput.type = 'file';
    newFileInput.id = 'file-input-fixed';
    newFileInput.accept = 'image/*';
    newFileInput.style.display = 'none';
    
    // Replace the old file input
    fileInput.parentNode.insertBefore(newFileInput, fileInput);
    fileInput.parentNode.removeChild(fileInput);
    
    // Update the upload button to use the new file input
    uploadButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Upload button clicked (fixed)');
        newFileInput.click();
    });
    
    // Handle file selection
    newFileInput.addEventListener('change', function() {
        if (!this.files || !this.files[0]) return;
        
        const file = this.files[0];
        console.log('File selected:', file.name);
        
        // Preview the image immediately
        const reader = new FileReader();
        reader.onload = function(e) {
            previewArea.innerHTML = `
                <div class="position-relative mb-4">
                    <img id="banner-preview" src="${e.target.result}" alt="Banner Preview" class="banner-preview img-fluid mb-3 shadow-sm">
                    <div class="position-absolute top-0 end-0 m-3">
                        <button type="button" id="remove-image" class="btn btn-light rounded-circle">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <button type="button" id="change-image" class="btn btn-outline-primary me-3">
                    <i class="fas fa-exchange-alt me-2"></i>Change Image
                </button>
                <div id="upload-status" class="mt-3">Uploading to server...</div>
            `;
            
            uploadArea.style.display = 'none';
            previewArea.style.display = 'block';
            
            // Set up the remove and change buttons
            const removeBtn = document.getElementById('remove-image');
            const changeBtn = document.getElementById('change-image');
            
            if (removeBtn) {
                removeBtn.addEventListener('click', function() {
                    previewArea.style.display = 'none';
                    uploadArea.style.display = 'block';
                    newFileInput.value = '';
                    
                    // If we're using the old script too, trigger its update
                    if (window.removeImage && typeof window.removeImage === 'function') {
                        window.removeImage();
                    }
                });
            }
            
            if (changeBtn) {
                changeBtn.addEventListener('click', function() {
                    newFileInput.click();
                });
            }
        };
        reader.readAsDataURL(file);
        
        // Upload the file
        const formData = new FormData();
        formData.append('banner', file);
        
        fetch('/order/upload-banner', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Upload response:', data);
            const statusDiv = document.getElementById('upload-status');
            
            if (data.success) {
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle me-2"></i> Upload successful!
                        </div>
                    `;
                }
                
                // Store the image URL as a data attribute on the preview area
                previewArea.dataset.imageUrl = data.imageUrl;
                
                // If we're using the old script too, update its state
                if (window.uploadedImageUrl !== undefined) {
                    window.uploadedImageUrl = data.imageUrl;
                }
                
                // Trigger validation if available
                if (window.validateForm && typeof window.validateForm === 'function') {
                    window.validateForm();
                }
                
            } else {
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i> ${data.error || 'Upload failed'}
                        </div>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            const statusDiv = document.getElementById('upload-status');
            
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i> ${error.message || 'Upload failed'}
                    </div>
                `;
            }
        });
    });
    
    console.log('Direct upload fix applied');
};

// Run the fixes when the page is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(fixUpload, 1000);
    setupSessionHandling();
});
