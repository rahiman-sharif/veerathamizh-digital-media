const dbService = require('../services/dbService');
const bcrypt = require('bcrypt');

/**
 * Render admin dashboard
 */
exports.renderDashboard = async (req, res) => {
    try {
        // Get counts of users and orders
        const users = await dbService.findAll('USERS');
        const orders = await dbService.findAll('ORDERS');
        
        // Calculate active orders (non-confirmed)
        const activeOrders = orders.filter(o => o.status === 'pending');
        
        // Get recent orders (last 5)
        const recentOrders = [...orders]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
        
        res.render('pages/admin/dashboard', {
            title: 'Admin Dashboard - Veerathamizh Digital Media',
            userCount: users.length,
            orderCount: orders.length,
            activeOrderCount: activeOrders.length,
            recentOrders,
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send('Error loading dashboard');
    }
};

/**
 * Render users list
 */
exports.renderUsersList = async (req, res) => {
    try {
        const users = await dbService.findAll('USERS');
        
        res.render('pages/admin/users', {
            title: 'Manage Users - Veerathamizh Digital Media',
            users,
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send('Error loading users');
    }
};

/**
 * Render orders list
 */
exports.renderOrdersList = async (req, res) => {
    try {
        let orders = await dbService.findAll('ORDERS');
        const users = await dbService.findAll('USERS');
        
        // Get query parameters
        const orderNumber = req.query.orderNumber;
        const status = req.query.status;
        const userId = req.query.userId;

        // Apply filters if they exist
        if (orderNumber) {
            orders = orders.filter(order => 
                order.order_id.toLowerCase().includes(orderNumber.toLowerCase()) ||
                order.id.toLowerCase().includes(orderNumber.toLowerCase())
            );
        }

        if (status && status !== 'all') {
            orders = orders.filter(order => order.status === status);
        }

        if (userId) {
            orders = orders.filter(order => order.user_id === userId);
        }

        // Sort orders by date (newest first)
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Add user details to orders
        orders = orders.map(order => {
            const user = users.find(u => u.id === order.user_id);
            return {
                ...order,
                user_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
                user_email: user ? user.email : 'N/A'
            };
        });

        res.render('pages/admin/orders', {
            title: 'Manage Orders - Veerathamizh Digital Media',
            orders,
            users,
            filterStatus: status || 'all',
            searchOrderNumber: orderNumber || '',
            filterUserId: userId || '',
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send('Error loading orders');
    }
};

/**
 * Render order details page
 */
exports.renderOrderDetail = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await dbService.findById('ORDERS', orderId);
        
        if (!order) {
            return res.status(404).render('pages/error', { 
                message: 'Order not found',
                error: { status: 404 }
            });
        }

        // Get user details
        const user = await dbService.findById('USERS', order.user_id);
        
        res.render('pages/admin/order-detail', {
            title: `Order #${order.order_id || order.id} - Admin Panel`,
            order: order,
            customer: user,
            user: req.session.user
        });
    } catch (error) {
        console.error('Admin order detail error:', error);
        res.status(500).render('pages/error', { 
            message: 'Error loading order details',
            error: { status: 500 }
        });
    }
};

/**
 * Get order details (API endpoint)
 */
exports.getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await dbService.findById('ORDERS', orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get user details
        const user = await dbService.findById('USERS', order.user_id);
        
        res.status(200).json({
            ...order,
            user_details: user ? {
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                phone: user.phone
            } : null
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching order details' });
    }
};

/**
 * Update order status
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        const order = await dbService.findById('ORDERS', orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update status and add status history
        const statusUpdate = {
            status,
            updatedBy: req.session.user.id,
            updatedAt: new Date().toISOString()
        };

        // Initialize or append to status history
        if (!order.statusHistory) {
            order.statusHistory = [];
        }
        order.statusHistory.push(statusUpdate);

        // Update order
        const updatedOrder = await dbService.updateById('ORDERS', orderId, {
            status,
            statusHistory: order.statusHistory,
            updated_at: new Date().toISOString()
        });

        res.status(200).json({ 
            success: true, 
            order: updatedOrder 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error updating order status' });
    }
};

/**
 * Update order notes
 */
exports.updateOrderNotes = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { notes } = req.body;

        const order = await dbService.findById('ORDERS', orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Create notes entry
        const noteEntry = {
            note: notes,
            addedBy: req.session.user.id,
            addedAt: new Date().toISOString()
        };

        // Initialize or append to notes history
        if (!order.notes) {
            order.notes = [];
        }
        order.notes.push(noteEntry);

        // Update order
        const updatedOrder = await dbService.updateById('ORDERS', orderId, {
            notes: order.notes,
            updated_at: new Date().toISOString()
        });

        res.status(200).json({ 
            success: true, 
            order: updatedOrder 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error updating order notes' });
    }
};

/**
 * Render user detail page
 */
exports.renderUserDetail = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await dbService.findById('USERS', userId);
        
        if (!user) {
            return res.status(404).render('pages/error', { 
                message: 'User not found',
                error: { status: 404 }
            });
        }

        // Get user's orders
        const orders = await dbService.findAll('ORDERS');
        const userOrders = orders.filter(order => order.user_id === userId);

        res.render('pages/admin/user-detail', {
            title: `User: ${user.first_name} ${user.last_name} - Admin Panel`,
            userDetail: user,
            userOrders: userOrders,
            user: req.session.user
        });
    } catch (error) {
        console.error('Admin user detail error:', error);
        res.status(500).render('pages/error', { 
            message: 'Error loading user details',
            error: { status: 500 }
        });
    }
};

/**
 * Update user type (Admin <-> Normal User) - Only Super Users allowed
 */
exports.updateUserType = async (req, res) => {
    try {
        const userId = req.params.id;
        const { user_type } = req.body;

        // Check if the current user is a Super User
        if (req.session.user.user_type !== 'Super User') {
            return res.status(403).json({ error: 'Only Super Users can change user types' });
        }

        const user = await dbService.findById('USERS', userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent changing Super User type
        if (user.user_type === 'Super User') {
            return res.status(403).json({ error: 'Cannot change Super User type' });
        }

        // Update user type
        const updatedUser = await dbService.updateById('USERS', userId, {
            user_type,
            updated_at: new Date().toISOString()
        });

        res.status(200).json({ 
            success: true, 
            message: `User type updated to ${user_type}`,
            user: updatedUser 
        });
    } catch (error) {
        console.error('Update user type error:', error);
        res.status(500).json({ error: 'Error updating user type' });
    }
};

/**
 * Update user details
 */
exports.updateUserDetails = async (req, res) => {
    try {
        const userId = req.params.id;
        const { 
            first_name, 
            last_name, 
            email, 
            phone, 
            company_name, 
            company_address, 
            city, 
            state, 
            zipcode, 
            zone 
        } = req.body;

        const user = await dbService.findById('USERS', userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if email is already used by another user
        if (email !== user.email) {
            const existingUser = await dbService.findByField('USERS', 'email', email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }

        // Update user details
        const updatedUser = await dbService.updateById('USERS', userId, {
            first_name,
            last_name,
            email,
            phone,
            company_name,
            company_address,
            city,
            state,
            zipcode,
            zone,
            updated_at: new Date().toISOString()
        });

        res.status(200).json({ 
            success: true, 
            message: 'User details updated successfully',
            user: updatedUser 
        });
    } catch (error) {
        console.error('Update user details error:', error);
        res.status(500).json({ error: 'Error updating user details' });
    }
};

/**
 * Reset user password (Super User only - no verification required)
 */
exports.resetUserPassword = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const { new_password } = req.body;

        // Check if the current user is a Super User
        if (req.session.user.user_type !== 'Super User') {
            return res.status(403).json({ error: 'Only Super Users can reset passwords' });
        }

        // Validate input
        if (!new_password || new_password.trim().length === 0) {
            return res.status(400).json({ error: 'New password is required' });
        }

        // Validate password length (minimum 6 characters for admin reset)
        if (new_password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Get user to verify they exist
        const user = await dbService.findById('USERS', userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update user's password
        await dbService.updateById('USERS', userId, {
            password: hashedPassword,
            updated_at: new Date().toISOString()
        });

        res.status(200).json({ 
            success: true,
            message: `Password successfully reset for ${user.first_name} ${user.last_name}` 
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Error resetting password' });
    }
};
