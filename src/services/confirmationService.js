const dbService = require('./dbService');

/**
 * Get confirmation details for a specific order
 * Uses the database abstraction layer
 * @param {string} orderId - Order ID
 * @returns {Promise<object>} - Order confirmation details
 */
exports.getConfirmationDetails = async (orderId) => {
    try {
        // Try to find by order_id first (for backward compatibility)
        let orders = await dbService.findByField('ORDERS', 'order_id', orderId);
        let order = orders.length > 0 ? orders[0] : null;
        
        // If not found, try to find by id
        if (!order) {
            order = await dbService.findById('ORDERS', orderId);
        }
        
        if (!order) {
            throw new Error('Order not found');
        }
        
        // Calculate ETA based on delivery option
        let eta = '7-10 business days'; // Default for Standard
        if (order.delivery_option === 'Premium') {
            eta = '1-2 business days';
        } else if (order.delivery_option === 'Express') {
            eta = '3-5 business days';
        }
        
        return {
            order_id: order.order_id || order.id,
            items: order.items,
            delivery_eta: eta,
            confirmation_message: 'Your order has been successfully placed!'
        };
    } catch (error) {
        throw new Error(`Failed to get confirmation details: ${error.message}`);
    }
};

/**
 * Finalize an order after confirmation
 * Uses the database abstraction layer
 * @param {string} orderId - Order ID
 * @returns {Promise<object>} - Finalized order
 */
exports.finalizeOrder = async (orderId) => {
    try {
        // Try to find by order_id first (for backward compatibility)
        let orders = await dbService.findByField('ORDERS', 'order_id', orderId);
        let order = orders.length > 0 ? orders[0] : null;
        let actualOrderId = order ? order.id : orderId;
        
        // If not found by order_id, use the provided id directly
        if (!order) {
            order = await dbService.findById('ORDERS', orderId);
            actualOrderId = orderId;
        }
        
        if (!order) {
            throw new Error('Order not found');
        }
        
        // Update order status
        const updatedOrder = await dbService.updateById('ORDERS', actualOrderId, {
            status: 'confirmed',
            updated_at: new Date().toISOString()
        });
        
        return updatedOrder;
    } catch (error) {
        throw new Error(`Failed to finalize order: ${error.message}`);
    }
};

/**
 * Send confirmation notification (email/SMS)
 * This is a stub for now but designed to be replaceable
 */
exports.sendConfirmationNotification = (order, email) => {
    console.log(`[NOTIFICATION] Order confirmation sent to: ${email}`);
    console.log(`[NOTIFICATION] Order ID: ${order.order_id}`);
    
    // In a real app, this would integrate with an email service like SendGrid
    // or SMS service like Twilio
    return {
        success: true,
        message: `Confirmation sent to ${email}`
    };
};
