const dbService = require('../services/dbService');
const bcrypt = require('bcrypt');

exports.getUserDetails = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await dbService.findById('USERS', userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user details' });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const orders = await dbService.findByField('ORDERS', 'user_id', userId);
        
        // Sort orders by date (newest first)
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        res.render('pages/user/orders', {
            title: 'My Orders - Veerathamizh Digital Media',
            orders: orders,
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send('Error loading orders');
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await dbService.findById('USERS', userId);
        
        if (!user) {
            return res.status(404).render('pages/error', { 
                message: 'User not found',
                error: { status: 404 }
            });
        }
        
        // Get user's order count
        const orders = await dbService.findByField('ORDERS', 'user_id', userId);
        const orderCount = orders.length;
        
        // Calculate total spent
        const totalSpent = orders.reduce((sum, order) => {
            const orderTotal = order.items.reduce((itemSum, item) => 
                itemSum + (item.price * item.quantity), 0);
            return sum + orderTotal;
        }, 0);
        
        res.render('pages/user/profile', {
            title: 'My Profile - Veerathamizh Digital Media',
            user: user,
            orderCount: orderCount,
            totalSpent: totalSpent,
            orders: orders.slice(0, 3) // Get latest 3 orders
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).render('pages/error', { 
            message: 'Error loading profile',
            error: { status: 500 }
        });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { first_name, last_name, phone, company_name, address_line1, address_line2, city, state, zipcode } = req.body;
        
        // Get current user data
        const currentUser = await dbService.findById('USERS', userId);
        
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update user data
        const updatedUser = {
            ...currentUser,
            first_name: first_name || currentUser.first_name,
            last_name: last_name || currentUser.last_name,
            phone: phone || currentUser.phone,
            company_name: company_name || currentUser.company_name,
            updated_at: new Date().toISOString(),
            address: {
                address_line1: address_line1 || (currentUser.address ? currentUser.address.address_line1 : ''),
                address_line2: address_line2 || (currentUser.address ? currentUser.address.address_line2 : ''),
                city: city || (currentUser.address ? currentUser.address.city : ''),
                state: state || (currentUser.address ? currentUser.address.state : ''),
                zipcode: zipcode || (currentUser.address ? currentUser.address.zipcode : '')
            }
        };
        
        await dbService.updateById('USERS', userId, updatedUser);
        
        // Update session user data
        req.session.user = {
            ...req.session.user,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name
        };
        
        res.redirect('/user/profile?updated=true');
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Error updating profile' });
    }
};

exports.changePasswordForm = async (req, res) => {
    try {
        res.render('pages/user/change-password', {
            title: 'Change Password - Veerathamizh Digital Media',
            user: req.session.user
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).render('pages/error', { 
            message: 'Error loading change password form',
            error: { status: 500 }
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { current_password, new_password, confirm_password } = req.body;
        
        // Validate inputs
        if (!current_password || !new_password || !confirm_password) {
            return res.render('pages/user/change-password', {
                title: 'Change Password - Veerathamizh Digital Media',
                user: req.session.user,
                error: 'All fields are required',
                formData: req.body
            });
        }
        
        if (new_password !== confirm_password) {
            return res.render('pages/user/change-password', {
                title: 'Change Password - Veerathamizh Digital Media',
                user: req.session.user,
                error: 'New passwords do not match',
                formData: req.body
            });
        }
        
        // Get current user
        const user = await dbService.findById('USERS', userId);
        if (!user) {
            return res.status(404).render('pages/error', { 
                message: 'User not found',
                error: { status: 404 }
            });
        }
        
        // Check current password using bcrypt
        const isPasswordValid = await bcrypt.compare(current_password, user.password);
        if (!isPasswordValid) {
            return res.render('pages/user/change-password', {
                title: 'Change Password - Veerathamizh Digital Media',
                user: req.session.user,
                error: 'Current password is incorrect',
                formData: req.body
            });
        }
        
        // Update password
        const hashedPassword = await bcrypt.hash(new_password, 10);
        const updatedUser = {
            ...user,
            password: hashedPassword,
            updated_at: new Date().toISOString()
        };
        
        await dbService.updateById('USERS', userId, updatedUser);
        
        res.redirect('/user/profile?password_updated=true');
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).render('pages/user/change-password', {
            title: 'Change Password - Veerathamizh Digital Media',
            user: req.session.user,
            error: 'An error occurred while changing your password'
        });
    }
};

exports.getUserOrderDetail = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const orderId = req.params.orderId;
        
        // Find the order
        const order = await dbService.findById('ORDERS', orderId);
        
        // Check if order exists and belongs to the user
        if (!order || order.user_id !== userId) {
            return res.status(404).render('pages/error', { 
                message: 'Order not found',
                error: { status: 404 }
            });
        }
        
        res.render('pages/user/order-detail', {
            title: `Order #${order.id} - Veerathamizh Digital Media`,
            order: order,
            user: req.session.user
        });
    } catch (error) {
        console.error('Get order detail error:', error);
        res.status(500).render('pages/error', { 
            message: 'Error loading order details',
            error: { status: 500 }
        });
    }
};

// Address Management Methods
exports.getUserAddresses = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await dbService.findById('USERS', userId);
        
        if (!user) {
            return res.status(404).render('pages/error', { 
                message: 'User not found',
                error: { status: 404 }
            });
        }
        
        // If the request is an AJAX request, return JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(200).json({
                addresses: user.addresses || []
            });
        }
        
        // Otherwise render the addresses page
        res.render('pages/user/addresses', {
            title: 'My Addresses - Veerathamizh Digital Media',
            user: user,
            addresses: user.addresses || []
        });
    } catch (error) {
        console.error('Get addresses error:', error);
        res.status(500).json({ error: 'Error fetching addresses' });
    }
};

exports.addUserAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const addressData = req.body;
        
        // Get current user data
        const user = await dbService.findById('USERS', userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Initialize addresses array if it doesn't exist
        if (!user.addresses) {
            user.addresses = [];
        }
        
        // Generate a unique ID for the address
        const addressId = Date.now().toString();
        
        // Create a new address object
        const newAddress = {
            id: addressId,
            address_name: addressData.address_name,
            first_name: addressData.first_name,
            last_name: addressData.last_name,
            address_line1: addressData.address_line1,
            address_line2: addressData.address_line2 || '',
            city: addressData.city,
            state: addressData.state,
            zipcode: addressData.zipcode,
            phone: addressData.phone,
            is_default: user.addresses.length === 0 // Set as default if it's the first address
        };
        
        // Add the new address to the addresses array
        user.addresses.push(newAddress);
        
        // If this is the first address or it's set as default, also update the main address field
        if (newAddress.is_default) {
            user.address = {
                address_line1: newAddress.address_line1,
                address_line2: newAddress.address_line2,
                city: newAddress.city,
                state: newAddress.state,
                zipcode: newAddress.zipcode
            };
        }
        
        // Update user in database
        const updatedUser = await dbService.updateById('USERS', userId, {
            ...user,
            updated_at: new Date().toISOString()
        });
        
        // If the request is an AJAX request, return JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(201).json({
                success: true,
                address: newAddress,
                message: 'Address added successfully'
            });
        }
        
        // Otherwise redirect to the addresses page
        res.redirect('/user/profile?updated=true');
        
    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ error: 'Error adding address' });
    }
};

exports.updateUserAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const addressId = req.params.addressId;
        const addressData = req.body;
        
        // Get current user data
        const user = await dbService.findById('USERS', userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if user has addresses
        if (!user.addresses || !Array.isArray(user.addresses)) {
            return res.status(404).json({ error: 'No addresses found' });
        }
        
        // Find the address to update
        const addressIndex = user.addresses.findIndex(addr => addr.id === addressId);
        
        if (addressIndex === -1) {
            return res.status(404).json({ error: 'Address not found' });
        }
        
        // Update the address
        const updatedAddress = {
            ...user.addresses[addressIndex],
            address_name: addressData.address_name,
            first_name: addressData.first_name,
            last_name: addressData.last_name,
            address_line1: addressData.address_line1,
            address_line2: addressData.address_line2 || '',
            city: addressData.city,
            state: addressData.state,
            zipcode: addressData.zipcode,
            phone: addressData.phone,
        };
        
        // Update the address in the addresses array
        user.addresses[addressIndex] = updatedAddress;
        
        // If this is the default address, also update the main address field
        if (updatedAddress.is_default) {
            user.address = {
                address_line1: updatedAddress.address_line1,
                address_line2: updatedAddress.address_line2,
                city: updatedAddress.city,
                state: updatedAddress.state,
                zipcode: updatedAddress.zipcode
            };
        }
        
        // Update user in database
        const updatedUser = await dbService.updateById('USERS', userId, {
            ...user,
            updated_at: new Date().toISOString()
        });
        
        // If the request is an AJAX request, return JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(200).json({
                success: true,
                address: updatedAddress,
                message: 'Address updated successfully'
            });
        }
        
        // Otherwise redirect to the addresses page
        res.redirect('/user/profile?updated=true');
        
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ error: 'Error updating address' });
    }
};

exports.deleteUserAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const addressId = req.params.addressId;
        
        // Get current user data
        const user = await dbService.findById('USERS', userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if user has addresses
        if (!user.addresses || !Array.isArray(user.addresses)) {
            return res.status(404).json({ error: 'No addresses found' });
        }
        
        // Find the address to delete
        const address = user.addresses.find(addr => addr.id === addressId);
        
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }
        
        // Check if this is the default address
        const isDefault = address.is_default;
        
        // Remove the address from the addresses array
        user.addresses = user.addresses.filter(addr => addr.id !== addressId);
        
        // If this was the default address, set a new default if there are any addresses left
        if (isDefault && user.addresses.length > 0) {
            user.addresses[0].is_default = true;
            
            // Also update the main address field
            user.address = {
                address_line1: user.addresses[0].address_line1,
                address_line2: user.addresses[0].address_line2,
                city: user.addresses[0].city,
                state: user.addresses[0].state,
                zipcode: user.addresses[0].zipcode
            };
        } else if (user.addresses.length === 0) {
            // If no addresses left, clear the main address
            user.address = {};
        }
        
        // Update user in database
        const updatedUser = await dbService.updateById('USERS', userId, {
            ...user,
            updated_at: new Date().toISOString()
        });
        
        // If the request is an AJAX request, return JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(200).json({
                success: true,
                message: 'Address deleted successfully'
            });
        }
        
        // Otherwise redirect to the addresses page
        res.redirect('/user/profile?updated=true');
        
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ error: 'Error deleting address' });
    }
};

exports.setDefaultAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const addressId = req.params.addressId;
        
        // Get current user data
        const user = await dbService.findById('USERS', userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if user has addresses
        if (!user.addresses || !Array.isArray(user.addresses)) {
            return res.status(404).json({ error: 'No addresses found' });
        }
        
        // Find the address to set as default
        const addressIndex = user.addresses.findIndex(addr => addr.id === addressId);
        
        if (addressIndex === -1) {
            return res.status(404).json({ error: 'Address not found' });
        }
        
        // Set all addresses as non-default first
        user.addresses.forEach(addr => {
            addr.is_default = false;
        });
        
        // Set the selected address as default
        user.addresses[addressIndex].is_default = true;
        
        // Also update the main address field for backward compatibility
        user.address = {
            address_line1: user.addresses[addressIndex].address_line1,
            address_line2: user.addresses[addressIndex].address_line2,
            city: user.addresses[addressIndex].city,
            state: user.addresses[addressIndex].state,
            zipcode: user.addresses[addressIndex].zipcode
        };
        
        // Update user in database
        const updatedUser = await dbService.updateById('USERS', userId, {
            ...user,
            updated_at: new Date().toISOString()
        });
        
        // If the request is an AJAX request, return JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(200).json({
                success: true,
                message: 'Default address updated successfully'
            });
        }
        
        // Otherwise redirect to the addresses page
        res.redirect('/user/profile?updated=true');
        
    } catch (error) {
        console.error('Set default address error:', error);
        res.status(500).json({ error: 'Error setting default address' });
    }
};
