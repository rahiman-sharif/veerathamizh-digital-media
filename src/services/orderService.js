const dbService = require('./dbService');
const { v4: uuidv4 } = require('uuid');
const BANNER_SIZES = [
    { id: '10x10', name: '10x10', width: 10, height: 10, price: 1000 },
    { id: '10x12', name: '10x12', width: 10, height: 12, price: 1200 },
    { id: '10x15', name: '10x15', width: 10, height: 15, price: 1500 },
    { id: '10x20', name: '10x20', width: 10, height: 20, price: 2000 }
];

/**
 * Get all available banner sizes
 * This is abstracted to allow future replacement with SQL database
 */
exports.getBannerSizes = async () => {
    return BANNER_SIZES;
};

/**
 * Add a banner item to an order
 * Uses the database abstraction layer
 * @param {string} userId - User ID
 * @param {object} bannerData - Banner data
 * @returns {Promise<object>} - Order and item details
 */
exports.addBannerItem = async (userId, bannerData) => {
    try {
        // Find user's in-progress order
        const userOrders = await dbService.findByField('ORDERS', 'user_id', userId);
        let userOrder = userOrders.find(order => order.status === 'in_progress');
        
        // Create new order if none exists
        if (!userOrder) {
            userOrder = {
                id: uuidv4(),
                order_id: uuidv4(), // For backward compatibility
                user_id: userId,
                items: [],
                status: 'in_progress',
                created_at: new Date().toISOString()
            };
            await dbService.create('ORDERS', userOrder);
        }
        
        // Get price for the banner size
        const bannerSize = BANNER_SIZES.find(size => size.id === bannerData.banner_size);
        const price = bannerSize ? bannerSize.price : 0;
        
        // Create new item
        const newItem = {
            id: uuidv4(),
            image_url: bannerData.image_url,
            banner_size: bannerData.banner_size,
            quantity: parseInt(bannerData.quantity, 10),
            price: price,
            added_at: new Date().toISOString()
        };
        
        // Add to items array
        userOrder.items.push(newItem);
        
        // Update order in database
        await dbService.updateById('ORDERS', userOrder.id, { 
            items: userOrder.items,
            updated_at: new Date().toISOString()
        });
        
        return { order: userOrder, item: newItem };
    } catch (error) {
        throw new Error(`Failed to add banner item: ${error.message}`);
    }
};

/**
 * Remove a banner item from an order
 * Uses the database abstraction layer
 * @param {string} userId - User ID
 * @param {string} itemId - Item ID
 * @returns {Promise<object>} - Updated order
 */
exports.removeBannerItem = async (userId, itemId) => {
    try {
        // Find user's orders
        const userOrders = await dbService.findByField('ORDERS', 'user_id', userId);
        const orderIndex = userOrders.findIndex(order => order.status === 'in_progress');
        
        if (orderIndex === -1) {
            throw new Error('No active order found');
        }
        
        // Get the order
        const order = userOrders[orderIndex];
        
        // Find and remove the item
        const itemIndex = order.items.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            throw new Error('Item not found in order');
        }
        
        order.items.splice(itemIndex, 1);
        
        // If order has no items, delete it
        if (order.items.length === 0) {
            await dbService.deleteById('ORDERS', order.id);
            return { id: order.id, deleted: true };
        } else {
            // Update the order
            const updatedOrder = await dbService.updateById('ORDERS', order.id, { 
                items: order.items,
                updated_at: new Date().toISOString()
            });
            return updatedOrder;
        }
    } catch (error) {
        throw new Error(`Failed to remove banner item: ${error.message}`);
    }
};

/**
 * List all order items for a user
 * Uses the database abstraction layer
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - User's orders
 */
exports.listOrderItems = async (userId) => {
    try {
        return await dbService.findByField('ORDERS', 'user_id', userId);
    } catch (error) {
        throw new Error(`Failed to list order items: ${error.message}`);
    }
};

/**
 * Get order by ID
 * Uses the database abstraction layer
 * @param {string} orderId - Order ID
 * @returns {Promise<object>} - Order details
 */
exports.getOrderById = async (orderId) => {
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
        
        return order;
    } catch (error) {
        throw new Error(`Failed to get order: ${error.message}`);
    }
};

/**
 * Save cart as a draft order in the database
 * This provides persistence for cart data across sessions
 * @param {string} userId - User ID
 * @param {Array} items - Cart items
 * @returns {Promise<object>} - Saved draft order
 */
exports.saveCartAsDraft = async (userId, items) => {
    try {
        // Look for existing draft order for this user
        const userOrders = await dbService.findByField('ORDERS', 'user_id', userId);
        let draftOrder = userOrders.find(order => order.status === 'draft');

        if (draftOrder) {
            // Update existing draft
            const updated = await dbService.updateById('ORDERS', draftOrder.id, {
                items: items,
                updated_at: new Date().toISOString()
            });
            return updated;
        } else {
            // Create new draft order
            const newDraftOrder = {
                id: uuidv4(),
                order_id: uuidv4(), // For backward compatibility
                user_id: userId,
                items: items,
                status: 'draft',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await dbService.create('ORDERS', newDraftOrder);
            return newDraftOrder;
        }
    } catch (error) {
        throw new Error(`Failed to save cart as draft: ${error.message}`);
    }
};

/**
 * Load cart from draft order
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Cart items
 */
exports.loadCartFromDraft = async (userId) => {
    try {
        const userOrders = await dbService.findByField('ORDERS', 'user_id', userId);
        const draftOrder = userOrders.find(order => order.status === 'draft');
        
        return draftOrder ? draftOrder.items : [];
    } catch (error) {
        console.error('Failed to load cart from draft:', error);
        return []; // Return empty array on error
    }
};

/**
 * Clear draft order when cart is converted to real order
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
exports.clearDraftOrder = async (userId) => {
    try {
        const userOrders = await dbService.findByField('ORDERS', 'user_id', userId);
        const draftOrder = userOrders.find(order => order.status === 'draft');
        
        if (draftOrder) {
            await dbService.deleteById('ORDERS', draftOrder.id);
        }
        return true;
    } catch (error) {
        console.error('Failed to clear draft order:', error);
        return false;
    }
};
