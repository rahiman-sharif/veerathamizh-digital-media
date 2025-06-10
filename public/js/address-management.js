// Address Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const checkoutForm = document.getElementById('checkout-form');
    const addressForm = document.getElementById('addressForm');
    
    // If we're on the checkout page with address management
    if (addressForm && checkoutForm) {
        const savedAddressRadios = document.querySelectorAll('input[name="selected_address"]');
        const newAddressFields = addressForm.querySelectorAll('input, select');
        const saveAddressCheckbox = document.getElementById('save_address');
        const addressCards = document.querySelectorAll('.address-selection-card');
        
        // Function to handle address selection
        function handleAddressSelection() {
            const selectedRadio = document.querySelector('input[name="selected_address"]:checked');
            
            if (selectedRadio) {
                // A saved address is selected
                const addressId = selectedRadio.value;
                
                // Create or update hidden input for selected address ID
                let hiddenInput = document.getElementById('selected_address_input');
                if (!hiddenInput) {
                    hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = 'selected_address_id';
                    hiddenInput.id = 'selected_address_input';
                    checkoutForm.appendChild(hiddenInput);
                }
                hiddenInput.value = addressId;
                  // Disable new address form fields
                newAddressFields.forEach(field => {
                    field.disabled = true;
                    // Clear validation states when disabling
                    field.classList.remove('is-valid', 'is-invalid');
                });
                
                // Remove any error messages and alerts from address form
                const errorDivs = addressForm.querySelectorAll('.invalid-feedback');
                errorDivs.forEach(div => div.remove());
                
                const alerts = addressForm.querySelectorAll('.alert');
                alerts.forEach(alert => alert.remove());
                
                // Hide save address checkbox
                if (saveAddressCheckbox) {
                    saveAddressCheckbox.parentElement.style.display = 'none';
                }
            } else {
                // No saved address selected, enable form fields
                newAddressFields.forEach(field => {
                    field.disabled = false;
                });
                
                // Show save address checkbox
                if (saveAddressCheckbox) {
                    saveAddressCheckbox.parentElement.style.display = 'block';
                }
                
                // Remove hidden input if it exists
                const hiddenInput = document.getElementById('selected_address_input');
                if (hiddenInput) {
                    hiddenInput.remove();
                }
            }
        }
        
        // Add click event listeners to address cards
        addressCards.forEach(card => {
            card.addEventListener('click', function() {
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;
                
                // Update UI
                addressCards.forEach(c => c.classList.remove('border-primary'));
                this.classList.add('border-primary');
                
                handleAddressSelection();
            });
        });
          // Listen for changes on radio buttons
        savedAddressRadios.forEach(radio => {
            radio.addEventListener('change', handleAddressSelection);
        });
        
        // Real-time validation for address form fields
        function setupRealTimeValidation() {
            const requiredFields = addressForm.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                // Validate on blur
                field.addEventListener('blur', function() {
                    if (!this.disabled) {
                        this.classList.remove('is-valid', 'is-invalid');
                        
                        if (!this.value.trim()) {
                            this.classList.add('is-invalid');
                            
                            // Add error message if it doesn't exist
                            let errorDiv = this.parentNode.querySelector('.invalid-feedback');
                            if (!errorDiv) {
                                errorDiv = document.createElement('div');
                                errorDiv.className = 'invalid-feedback';
                                errorDiv.textContent = 'This field is required.';
                                this.parentNode.appendChild(errorDiv);
                            }
                        } else {
                            this.classList.add('is-valid');
                            
                            // Remove error message if field is valid
                            const errorDiv = this.parentNode.querySelector('.invalid-feedback');
                            if (errorDiv) {
                                errorDiv.remove();
                            }
                        }
                    }
                });
                
                // Validate on input for immediate feedback
                field.addEventListener('input', function() {
                    if (!this.disabled && this.classList.contains('is-invalid') && this.value.trim()) {
                        this.classList.remove('is-invalid');
                        this.classList.add('is-valid');
                        
                        // Remove error message
                        const errorDiv = this.parentNode.querySelector('.invalid-feedback');
                        if (errorDiv) {
                            errorDiv.remove();
                        }
                    }
                });
            });
        }
        
        // Initialize real-time validation
        setupRealTimeValidation();
        
        // Add "Use new address" button
        if (savedAddressRadios.length > 0) {
            const useNewAddressBtn = document.createElement('button');
            useNewAddressBtn.type = 'button';
            useNewAddressBtn.className = 'btn btn-outline-secondary mb-3';
            useNewAddressBtn.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Use New Address';            useNewAddressBtn.onclick = function() {
                // Uncheck all saved address radio buttons
                savedAddressRadios.forEach(radio => {
                    radio.checked = false;
                });
                
                // Remove active class from all cards
                addressCards.forEach(card => card.classList.remove('border-primary'));
                
                // Clear any validation states and error messages
                const formFields = addressForm.querySelectorAll('.form-control, .form-select');
                formFields.forEach(field => {
                    field.classList.remove('is-valid', 'is-invalid');
                });
                
                // Remove any error messages
                const errorDivs = addressForm.querySelectorAll('.invalid-feedback');
                errorDivs.forEach(div => div.remove());
                
                // Remove any error alerts
                const alerts = addressForm.querySelectorAll('.alert');
                alerts.forEach(alert => alert.remove());
                
                handleAddressSelection();
                
                // Focus on first field
                document.getElementById('first_name').focus();
            };
            
            // Insert button before horizontal rule
            const hr = document.querySelector('.card-body hr');
            if (hr) {
                hr.parentNode.insertBefore(useNewAddressBtn, hr);
            }
        }
          // Add submit event to checkout form
        checkoutForm.addEventListener('submit', function(e) {
            const selectedRadio = document.querySelector('input[name="selected_address"]:checked');
            
            if (!selectedRadio) {
                // No saved address selected, validate the form
                const requiredFields = addressForm.querySelectorAll('[required]:not(:disabled)');
                let isValid = true;
                
                // Remove any existing error alerts
                const existingAlert = document.querySelector('.address-validation-alert');
                if (existingAlert) {
                    existingAlert.remove();
                }
                
                requiredFields.forEach(field => {
                    field.classList.remove('is-valid', 'is-invalid');
                    
                    if (!field.value.trim()) {
                        field.classList.add('is-invalid');
                        isValid = false;
                        
                        // Add error message if it doesn't exist
                        let errorDiv = field.parentNode.querySelector('.invalid-feedback');
                        if (!errorDiv) {
                            errorDiv = document.createElement('div');
                            errorDiv.className = 'invalid-feedback';
                            errorDiv.textContent = 'This field is required.';
                            field.parentNode.appendChild(errorDiv);
                        }
                    } else {
                        field.classList.add('is-valid');
                        
                        // Remove error message if field is valid
                        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
                        if (errorDiv) {
                            errorDiv.remove();
                        }
                    }
                });
                
                if (!isValid) {
                    e.preventDefault();
                    
                    // Focus on first invalid field
                    const firstInvalid = addressForm.querySelector('.is-invalid');
                    if (firstInvalid) {
                        firstInvalid.focus();
                    }
                    
                    // Show error alert
                    const errorAlert = document.createElement('div');
                    errorAlert.className = 'alert alert-danger alert-dismissible fade show mt-3 address-validation-alert';
                    errorAlert.innerHTML = `
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Please fill in all required address fields correctly.
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    `;
                    
                    // Add error alert to address form
                    addressForm.appendChild(errorAlert);
                    
                    // Auto-hide alert after 5 seconds
                    setTimeout(() => {
                        if (errorAlert.parentNode) {
                            errorAlert.remove();
                        }
                    }, 5000);
                    
                    return;
                }
                
                // Add form data to hidden inputs
                const hiddenFieldsContainer = document.getElementById('hidden-address-fields');
                hiddenFieldsContainer.innerHTML = ''; // Clear previous fields
                
                // Copy all values from the address form to hidden fields
                newAddressFields.forEach(field => {
                    if (field.name && !field.disabled) {
                        const hiddenField = document.createElement('input');
                        hiddenField.type = 'hidden';
                        hiddenField.name = field.name;
                        hiddenField.value = field.value;
                        hiddenFieldsContainer.appendChild(hiddenField);
                    }
                });
            }
        });
        
        // Initialize address selection
        handleAddressSelection();
    }
});
