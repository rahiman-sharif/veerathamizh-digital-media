// Order Creation Page JavaScript
// Handles banner upload, size selection, and order management

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Order creation script loaded successfully!');
    
    // DOM Elements
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const uploadArea = document.getElementById('upload-area');
    const previewArea = document.getElementById('preview-area');
    const bannerPreview = document.getElementById('banner-preview');
    const removeImageBtn = document.getElementById('remove-image');
    const changeImageBtn = document.getElementById('change-image');
    const bannerSizeCards = document.querySelectorAll('.banner-size-card');
    const quantityInput = document.getElementById('quantity');
    const decreaseQtyBtn = document.getElementById('decrease-qty');
    const increaseQtyBtn = document.getElementById('increase-qty');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    
    // Summary elements
    const selectedSizeText = document.getElementById('selected-size-text');
    const selectedQuantityText = document.getElementById('selected-quantity-text');
    const unitPriceText = document.getElementById('unit-price-text');
    const totalPriceText = document.getElementById('total-price-text');
    const validationMessage = document.getElementById('validation-message');

    console.log('📍 Found elements:', {
        fileInput: !!fileInput,
        uploadButton: !!uploadButton,
        uploadArea: !!uploadArea,
        bannerSizeCards: bannerSizeCards.length
    });

    // State variables
    let uploadedImageUrl = null;
    let selectedBannerSize = null;
    let currentQuantity = 1;
    let isUploading = false;

    // Initialize functionality
    console.log('Initializing upload functionality');
    initializeUpload();
    initializeBannerSizeSelection();
    initializeQuantityControls();
    initializeOrderSummary();    // Upload functionality
    function initializeUpload() {
        console.log('Setting up upload functionality');
        
        if (uploadButton && fileInput) {
            console.log('Adding click event to upload button');
            try {
                uploadButton.addEventListener('click', function(e) {
                    console.log('🔥 Upload button clicked - opening file dialog');
                    e.preventDefault();
                    e.stopPropagation();
                    fileInput.click();
                });
            } catch (error) {
                console.error('Error adding click event to upload button:', error);
            }
        } else {
            console.error('Upload button or file input not found!', {
                uploadButton: !!uploadButton,
                fileInput: !!fileInput
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect);
        }

        // Drag and drop functionality
        if (uploadArea) {
            uploadArea.addEventListener('dragover', handleDragOver);
            uploadArea.addEventListener('drop', handleDrop);
            uploadArea.addEventListener('dragenter', handleDragEnter);
            uploadArea.addEventListener('dragleave', handleDragLeave);
        }

        // Remove image functionality
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', removeImage);
        }
        
        if (changeImageBtn && fileInput) {
            changeImageBtn.addEventListener('click', function() {
                fileInput.click();
            });
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        if (uploadArea) {
            uploadArea.classList.add('drag-over');
        }
    }

    function handleDragEnter(e) {
        e.preventDefault();
        if (uploadArea) {
            uploadArea.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        e.preventDefault();
        if (uploadArea) {
            uploadArea.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        if (uploadArea) {
            uploadArea.classList.remove('drag-over');
        }
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }

    function handleFileSelect(e) {
        console.log('File input changed');
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
            handleFile(file);
        }
    }

    function handleFile(file) {
        console.log('Processing file:', file.name, file.type, file.size);
        
        // Validate file type
        if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
            showError('Please select a valid image file (JPG or PNG only).');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showError('File size must be less than 5MB.');
            return;
        }

        // Show preview immediately
        showImagePreview(file);
        
        // Upload file
        uploadFile(file);
    }

    function showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (bannerPreview) {
                bannerPreview.src = e.target.result;
            }
            if (uploadArea) {
                uploadArea.style.display = 'none';
            }
            if (previewArea) {
                previewArea.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }    function uploadFile(file) {
        if (isUploading) return;

        isUploading = true;
        showUploadProgress();
        
        console.log('Starting file upload process for', file.name);

        const formData = new FormData();
        formData.append('banner', file);

        // Set a timeout to abort the request if it takes too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.error('Upload timed out');
        }, 30000); // 30 second timeout

        fetch('/order/upload-banner', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        })
        .then(response => {
            console.log('Upload response received:', response.status);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || `Upload failed with status ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Upload successful, data received:', data);
            if (data.success) {
                uploadedImageUrl = data.imageUrl;
                showSuccess('Image uploaded successfully!');
                updateOrderSummary();
            } else {
                throw new Error(data.error || 'Upload failed - server returned success: false');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            if (error.name === 'AbortError') {
                showError('Upload timed out. Please try again.');
            } else {
                showError('Upload failed: ' + error.message);
            }
            removeImage();
        })
        .finally(() => {
            isUploading = false;
            hideUploadProgress();
        });
    }

    function removeImage() {
        uploadedImageUrl = null;
        if (bannerPreview) {
            bannerPreview.src = '';
        }
        if (previewArea) {
            previewArea.style.display = 'none';
        }
        if (uploadArea) {
            uploadArea.style.display = 'block';
        }
        if (fileInput) {
            fileInput.value = '';
        }
        updateOrderSummary();
    }

    function showUploadProgress() {
        if (uploadButton) {
            uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading...';
            uploadButton.disabled = true;
        }
    }

    function hideUploadProgress() {
        if (uploadButton) {
            uploadButton.innerHTML = '<i class="fas fa-folder-open me-2"></i>Browse Files';
            uploadButton.disabled = false;
        }
    }

    // Banner size selection
    function initializeBannerSizeSelection() {
        if (bannerSizeCards && bannerSizeCards.length > 0) {
            bannerSizeCards.forEach(card => {
                card.addEventListener('click', function() {
                    // Remove active class from all cards
                    bannerSizeCards.forEach(c => c.classList.remove('active'));
                    
                    // Add active class to clicked card
                    this.classList.add('active');
                    
                    // Store selected size data
                    const titleElement = this.querySelector('.card-title');
                    const priceElement = this.querySelector('.text-primary');
                    
                    if (titleElement && priceElement && this.dataset.size) {
                        selectedBannerSize = {
                            id: this.dataset.size,
                            name: titleElement.textContent.trim(),
                            price: parseFloat(priceElement.textContent.replace('₹', '').trim())
                        };
                        
                        updateOrderSummary();
                    }
                });
            });
        }
    }

    // Quantity controls
    function initializeQuantityControls() {
        if (decreaseQtyBtn) {
            decreaseQtyBtn.addEventListener('click', function() {
                if (currentQuantity > 1) {
                    currentQuantity--;
                    if (quantityInput) {
                        quantityInput.value = currentQuantity;
                    }
                    updateOrderSummary();
                }
            });
        }

        if (increaseQtyBtn) {
            increaseQtyBtn.addEventListener('click', function() {
                if (currentQuantity < 100) {
                    currentQuantity++;
                    if (quantityInput) {
                        quantityInput.value = currentQuantity;
                    }
                    updateOrderSummary();
                }
            });
        }

        if (quantityInput) {
            quantityInput.addEventListener('change', function() {
                const value = parseInt(quantityInput.value);
                if (value >= 1 && value <= 100) {
                    currentQuantity = value;
                    updateOrderSummary();
                } else {
                    quantityInput.value = currentQuantity;
                }
            });
        }
    }

    // Order summary
    function initializeOrderSummary() {
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', addToCart);
        }
        updateOrderSummary();
    }

    function updateOrderSummary() {
        // Update size
        if (selectedBannerSize) {
            if (selectedSizeText) {
                selectedSizeText.textContent = selectedBannerSize.name;
            }
            if (unitPriceText) {
                unitPriceText.textContent = `₹${selectedBannerSize.price}`;
            }
        } else {
            if (selectedSizeText) {
                selectedSizeText.textContent = 'Not selected';
            }
            if (unitPriceText) {
                unitPriceText.textContent = '₹0';
            }
        }

        // Update quantity
        if (selectedQuantityText) {
            selectedQuantityText.textContent = currentQuantity;
        }

        // Update total
        const total = selectedBannerSize ? selectedBannerSize.price * currentQuantity : 0;
        if (totalPriceText) {
            totalPriceText.textContent = `₹${total}`;
        }

        // Update validation and button state
        const isValid = uploadedImageUrl && selectedBannerSize;
        
        if (validationMessage) {
            if (!uploadedImageUrl && !selectedBannerSize) {
                validationMessage.textContent = 'Please upload a banner image and select a size to continue.';
                validationMessage.className = 'alert alert-info mb-3';
            } else if (!uploadedImageUrl) {
                validationMessage.textContent = 'Please upload a banner image to continue.';
                validationMessage.className = 'alert alert-warning mb-3';
            } else if (!selectedBannerSize) {
                validationMessage.textContent = 'Please select a banner size to continue.';
                validationMessage.className = 'alert alert-warning mb-3';
            } else {
                validationMessage.textContent = 'Ready to add to cart!';
                validationMessage.className = 'alert alert-success mb-3';
            }
        }

        if (addToCartBtn) {
            addToCartBtn.disabled = !isValid;
        }
    }

    function addToCart() {
        if (!uploadedImageUrl || !selectedBannerSize) {
            showError('Please complete all required fields.');
            return;
        }

        if (addToCartBtn) {
            addToCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Adding...';
            addToCartBtn.disabled = true;
        }

        const orderData = {
            image_url: uploadedImageUrl,
            banner_size: selectedBannerSize.id,
            quantity: currentQuantity
        };

        fetch('/order/add-banner', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Item added to cart successfully!');
                
                // Reset form after successful addition
                setTimeout(() => {
                    resetForm();
                }, 1500);
            } else {
                throw new Error(data.error || 'Failed to add item to cart');
            }
        })
        .catch(error => {
            console.error('Add to cart error:', error);
            showError('Failed to add item to cart: ' + error.message);
        })
        .finally(() => {
            if (addToCartBtn) {
                addToCartBtn.innerHTML = '<i class="fas fa-cart-plus me-2"></i>Add to Cart';
            }
            updateOrderSummary();
        });
    }

    function resetForm() {
        // Reset image
        removeImage();
        
        // Reset banner size selection
        if (bannerSizeCards && bannerSizeCards.length > 0) {
            bannerSizeCards.forEach(card => card.classList.remove('active'));
        }
        selectedBannerSize = null;
        
        // Reset quantity
        currentQuantity = 1;
        if (quantityInput) {
            quantityInput.value = 1;
        }
        
        // Update summary
        updateOrderSummary();
    }

    // Utility functions
    function showSuccess(message) {
        showToast(message, 'success');
    }

    function showError(message) {
        showToast(message, 'error');
    }

    function showToast(message, type) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 500px;
        `;
        
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
});

// Add custom CSS for drag and drop and other UI enhancements
// Use a safe name for the style variable to avoid conflicts
const orderCreateStyle = document.createElement('style');
orderCreateStyle.id = 'order-create-styles'; // Add an ID to make it easy to find
orderCreateStyle.textContent = `
    .upload-area.drag-over {
        border-color: var(--primary-color);
        background-color: rgba(var(--primary-color-rgb), 0.1);
        transform: scale(1.02);
    }
    
    .banner-size-card {
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }
    
    .banner-size-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        border-color: var(--primary-color);
    }
    
    .banner-size-card.active {
        border-color: var(--primary-color);
        background-color: rgba(var(--primary-color-rgb), 0.1);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3);
    }
    
    .banner-preview {
        max-height: 300px;
        border-radius: 8px;
    }
    
    .upload-icon {
        font-size: 3rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
    }
    
    .upload-icon.pulse {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(orderCreateStyle);
