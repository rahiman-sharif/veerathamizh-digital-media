// Fix for file upload in order-create.js
console.log('Upload fix script loaded');

// Fix upload functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we were redirected from an authentication failure
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error && error.includes('login')) {
        console.log('Session error detected:', error);
        if (window.Swal) {
            Swal.fire({
                title: 'Session Issue',
                text: error,
                icon: 'warning',
                confirmButtonText: 'OK'
            });
        }
    }

    // Check if we're on the order confirmation page
    if (window.location.pathname.includes('/confirmation')) {
        const viewOrderButtons = document.querySelectorAll('a[href*="/user/orders"]');
        viewOrderButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // First ping the server to validate session
                fetch('/user/details')
                .then(response => {
                    if (response.ok) {
                        // Session is valid, proceed to orders page
                        window.location.href = this.getAttribute('href');
                    } else {
                        // Session issue detected, show warning and redirect to login
                        alert('Your session may have expired. Please log in again to view your orders.');
                        window.location.href = '/auth/login?redirect=' + encodeURIComponent('/user/orders');
                    }
                })
                .catch(() => {
                    alert('Connection error. Please log in again to view your orders.');
                    window.location.href = '/auth/login';
                });
            });
        });
    }
    
    // Let the test script run first
    setTimeout(function() {
        console.log('Running upload fix script');
        
        // Get the file input and related elements
        const fileInput = document.getElementById('file-input');
        const uploadButton = document.getElementById('upload-button');
        const uploadArea = document.getElementById('upload-area');
        const previewArea = document.getElementById('preview-area');
        const bannerPreview = document.getElementById('banner-preview');
        
        console.log('Upload fix elements:', {
            fileInput: !!fileInput,
            uploadButton: !!uploadButton,
            uploadArea: !!uploadArea,
            previewArea: !!previewArea,
            bannerPreview: !!bannerPreview
        });
        
        // If the elements don't exist, don't do anything
        if (!fileInput || !uploadButton) {
            console.log('Upload fix: elements not found');
            return;
        }
        
        // Improve file upload handling
        function handleFileUpload(file) {
            console.log('Upload fix: handling file', file.name);
            
            // Validate file type
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                alert('Please upload a valid image file (JPG or PNG only).');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size exceeds 5MB limit.');
                return;
            }
            
            // Show a loading indicator in the preview area
            if (previewArea) {
                previewArea.innerHTML = `
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2">Uploading...</p>
                    </div>`;
                previewArea.style.display = 'block';
            }
            
            if (uploadArea) {
                uploadArea.style.display = 'none';
            }
            
            // Create FormData and upload the file
            const formData = new FormData();
            formData.append('banner', file);
            
            fetch('/order/upload-banner', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('Upload fix: received response', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Upload fix: parsed data', data);
                
                if (data.success) {
                    console.log('Upload fix: success', data.imageUrl);
                    
                    // Show the image preview
                    if (previewArea && bannerPreview) {
                        previewArea.innerHTML = '';
                        previewArea.appendChild(bannerPreview);
                        bannerPreview.src = data.imageUrl;
                        bannerPreview.style.display = 'block';
                        
                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'btn btn-danger mt-2';
                        removeBtn.innerHTML = 'Remove Image';
                        removeBtn.addEventListener('click', function() {
                            previewArea.style.display = 'none';
                            uploadArea.style.display = 'block';
                            bannerPreview.src = '';
                            // Trigger a custom event to notify the main script
                            document.dispatchEvent(new CustomEvent('bannerRemoved'));
                        });
                        
                        previewArea.appendChild(removeBtn);
                    }
                    
                    // Dispatch a custom event that the main script can listen for
                    document.dispatchEvent(new CustomEvent('bannerUploaded', {
                        detail: { imageUrl: data.imageUrl }
                    }));                    
                    
                    
                } else {
                    console.error('Upload fix: server returned error', data);
                    alert(data.error || 'Upload failed');
                    
                    // Reset UI
                    if (previewArea) previewArea.style.display = 'none';
                    if (uploadArea) uploadArea.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Upload fix: fetch error', error);
                
                // Reset UI
                if (previewArea) previewArea.style.display = 'none';
                if (uploadArea) uploadArea.style.display = 'block';
            });
        }
        
        // Override the click handler for the upload button
        if (uploadButton && fileInput) {
            console.log('Upload fix: attaching click handler to upload button');
            
            uploadButton.addEventListener('click', function(e) {
                console.log('Upload fix: upload button clicked');
                e.preventDefault();
                e.stopPropagation();
                fileInput.click();
            }, true);
            
            fileInput.addEventListener('change', function() {
                console.log('Upload fix: file input changed');
                if (this.files && this.files[0]) {
                    handleFileUpload(this.files[0]);
                }
            }, true);
        }
        
        // Add drag and drop support
        if (uploadArea) {
            console.log('Upload fix: adding drag and drop support');
            
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('drag-over');
            }, true);
            
            uploadArea.addEventListener('dragleave', function() {
                this.classList.remove('drag-over');
            }, true);
            
            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');
                
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                }
            }, true);
        }
    }, 500);
});
