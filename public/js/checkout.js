// Checkout page JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Calculate delivery fee and total
    const deliveryOptions = document.querySelectorAll('input[name="deliveryOption"]');
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const deliveryFeeElement = document.getElementById('deliveryFee');
    const orderTotalElement = document.getElementById('orderTotal');
    const deliveryOptionInput = document.getElementById('delivery_option_input');
    const paymentMethodInput = document.getElementById('payment_method_input');
    
    // Get subtotal from data attribute
    const subtotalEl = document.getElementById('subtotal-value');
    const subtotal = subtotalEl ? parseFloat(subtotalEl.dataset.value) : 0;
    
    function updateTotal() {
        const selectedDelivery = document.querySelector('input[name="deliveryOption"]:checked').value;
        let deliveryFee = 0;
        
        if (selectedDelivery === 'Premium') {
            deliveryFee = 250;
        } else if (selectedDelivery === 'Express') {
            deliveryFee = 150;
        }
        
        deliveryFeeElement.textContent = `₹${deliveryFee.toFixed(2)}`;
        orderTotalElement.textContent = `₹${(subtotal + deliveryFee).toFixed(2)}`;
        deliveryOptionInput.value = selectedDelivery;
    }
    
    // Add change event listeners to delivery options
    deliveryOptions.forEach(option => {
        option.addEventListener('change', updateTotal);
    });
    
    // Add change event listeners to payment methods
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            paymentMethodInput.value = this.value;
        });
    });
    
    // Initialize with default values
    updateTotal();
});
