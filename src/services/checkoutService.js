const dbService = require('./dbService');
const { v4: uuidv4 } = require('uuid');

/**
 * Save delivery address for an order
 * Uses the database abstraction layer
 * @param {string} orderId - Order ID
 * @param {object} addressData - Address data
 * @returns {Promise<object>} - Updated order
 */
exports.saveAddress = async (orderId, addressData) => {
    // Find the order
    const order = await dbService.findById('ORDERS', orderId);
    
    if (!order) {
        throw new Error('Order not found');
    }
    
    // Update address
    const updatedOrder = await dbService.updateById('ORDERS', orderId, {
        delivery_address: addressData,
        updated_at: new Date().toISOString()
    });
    
    return updatedOrder;
};

/**
 * Select delivery option for an order
 * Uses the database abstraction layer
 * @param {string} orderId - Order ID
 * @param {string} deliveryOption - Delivery option
 * @returns {Promise<object>} - Updated order
 */
exports.selectDelivery = async (orderId, deliveryOption) => {
    // Find the order
    const order = await dbService.findById('ORDERS', orderId);
    
    if (!order) {
        throw new Error('Order not found');
    }
    
    // Update delivery option
    const updatedOrder = await dbService.updateById('ORDERS', orderId, {
        delivery_option: deliveryOption,
        updated_at: new Date().toISOString()
    });
    
    return updatedOrder;
};

/**
 * Choose payment method for an order
 * Currently only supports Cash on Delivery - additional payment methods will be implemented in the future
 * Uses the database abstraction layer
 * @param {string} orderId - Order ID
 * @param {string} paymentMethod - Payment method (only 'cod' supported currently)
 * @returns {Promise<object>} - Updated order
 */
exports.choosePayment = async (orderId, paymentMethod = 'cod') => {
    // Find the order
    const order = await dbService.findById('ORDERS', orderId);
    
    if (!order) {
        throw new Error('Order not found');
    }
    
    // NOTE: Currently only supporting Cash on Delivery ('cod')
    // Other payment methods (credit card, online payment, etc.) will be implemented in future
    const method = paymentMethod === 'cod' ? 'cod' : 'cod';
    const paymentInfo = {
        method: method,
        name: method === 'cod' ? 'Cash on Delivery' : 'Cash on Delivery',
        status: 'pending',
        note: 'Additional payment methods will be available in the future'
    };
    
    // Update payment method
    const updatedOrder = await dbService.updateById('ORDERS', orderId, {
        payment: paymentInfo,
        updated_at: new Date().toISOString()
    });
    
    return updatedOrder;
};

/**
 * Create a new order in the database
 * Uses the database abstraction layer
 * @param {object} orderData - Order data
 * @returns {Promise<object>} - Created order
 */
exports.createOrder = async (orderData) => {
    try {
        // Generate unique order ID
        const newOrder = {
            ...orderData,
            id: uuidv4(),
            order_id: uuidv4(), // Keeping order_id for backward compatibility
            created_at: new Date().toISOString(),
            status: 'pending'
        };
        
        // Save to database
        await dbService.create('ORDERS', newOrder);
        
        return newOrder;
    } catch (error) {
        throw new Error(`Failed to create order: ${error.message}`);
    }
};
