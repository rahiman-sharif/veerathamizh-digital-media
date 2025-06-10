const checkoutService = require('../services/checkoutService');
const dbService = require('../services/dbService');

// Render page controller
exports.renderCheckoutPage = async (req, res, next) => {
    try {
        // Check if user is logged in
        if (!req.session.user) {
            return res.redirect('/auth/login?error=Please login to proceed with checkout');
        }
        
        // Check if cart exists in session
        if (!req.session.cart || !req.session.cart.items || req.session.cart.items.length === 0) {
            return res.redirect('/order/cart?error=Your cart is empty');
        }
        
        // Calculate subtotal
        let subtotal = 0;
        req.session.cart.items.forEach(item => {
            subtotal += item.price * item.quantity;
        });
          // Fetch current user's data from database to get addresses
        const currentUser = await dbService.findById('USERS', req.session.user.id);
        
        res.render('pages/checkout/index', {
            title: 'Checkout - Veerathamizh Digital Media',
            cartItems: req.session.cart.items,
            subtotal: subtotal,
            user: currentUser || req.session.user, // Use database user or fallback to session user
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (error) {
        console.error('Checkout page render error:', error);
        next(error);
    }
};

// API controllers
exports.saveAddress = async (req, res, next) => {
    try {
        const addressData = req.body;
        const savedAddress = await checkoutService.saveAddress(addressData);
        res.status(201).json(savedAddress);
    } catch (error) {
        next(error);
    }
};

exports.selectDelivery = async (req, res, next) => {
    try {
        const deliveryOption = req.body.deliveryOption;
        const updatedOrder = await checkoutService.selectDelivery(deliveryOption);
        res.status(200).json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

exports.choosePayment = async (req, res, next) => {
    try {
        // NOTE: Currently only Cash on Delivery is available
        // Additional payment methods will be implemented in the future
        const paymentMethod = 'cod'; // Force Cash on Delivery for now
        const updatedOrder = await checkoutService.choosePayment(paymentMethod);
        res.status(200).json({
            ...updatedOrder,
            message: 'Cash on Delivery selected. Additional payment methods will be available in the future.'
        });
    } catch (error) {
        next(error);
    }
};

exports.processCheckout = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login?error=Please login to complete your order');
        }
        
        if (!req.session.cart || !req.session.cart.items || req.session.cart.items.length === 0) {
            return res.redirect('/order/cart?error=Your cart is empty');
        }
        
        const { delivery_option, payment_method, selected_address_id } = req.body;
        let deliveryAddress = {};
        
        // If a saved address is selected, use it
        if (selected_address_id && req.session.user.addresses) {
            const selectedAddress = req.session.user.addresses.find(addr => addr.id === selected_address_id);
            
            if (selectedAddress) {
                deliveryAddress = {
                    first_name: selectedAddress.first_name,
                    last_name: selectedAddress.last_name,
                    address_line1: selectedAddress.address_line1,
                    address_line2: selectedAddress.address_line2 || '',
                    city: selectedAddress.city,
                    state: selectedAddress.state,
                    zipcode: selectedAddress.zipcode,
                    phone: selectedAddress.phone,
                    zone: req.body.zone || 'Central' // Default to Central if no zone provided
                };
            }
        } else {
            // Use new address from form
            deliveryAddress = {
                first_name: req.body.first_name || req.session.user.first_name,
                last_name: req.body.last_name || req.session.user.last_name,
                address_line1: req.body.address_line1 || req.session.user.company_address,
                address_line2: req.body.address_line2 || '',
                city: req.body.city || req.session.user.city,
                state: req.body.state || req.session.user.state,
                zipcode: req.body.zipcode || req.session.user.zipcode,
                phone: req.body.phone || req.session.user.phone,
                zone: req.body.zone || 'Central' // Default to Central if no zone provided
            };
            
            // Save new address to user account if requested
            if (req.body.save_address === 'on' && req.session.user) {
                // Import user controller to use its address functions
                const userController = require('./userController');
                
                // Create address object
                const newAddressData = {
                    address_name: "Address " + (new Date().toLocaleDateString()),
                    first_name: deliveryAddress.first_name,
                    last_name: deliveryAddress.last_name,
                    address_line1: deliveryAddress.address_line1,
                    address_line2: deliveryAddress.address_line2,
                    city: deliveryAddress.city,
                    state: deliveryAddress.state,
                    zipcode: deliveryAddress.zipcode,
                    phone: deliveryAddress.phone,
                    is_default: false // Set to false since it's not explicitly set as default
                };
                
                // Save address to user account
                req.body = newAddressData;
                await userController.addUserAddress(req, {
                    status: () => { return { json: () => {} }; }, // Mock response object
                    redirect: () => {} // Mock redirect function
                });
            }
        }
        
        // Create order from cart
        const orderData = {
            user_id: req.session.user.id,
            items: req.session.cart.items,
            delivery_address: deliveryAddress,
            delivery_option: delivery_option,
            payment: {
                method: payment_method,
                status: 'pending'
            },
            status: 'pending',
            order_date: new Date().toISOString()
        };        const order = await checkoutService.createOrder(orderData);
        
        // Clear cart after successful order
        req.session.cart = { items: [], user_id: req.session.user.id };
        
        // Clear draft order from database (important!)
        try {
            const orderService = require('../services/orderService');
            await orderService.clearDraftOrder(req.session.user.id);
        } catch (draftError) {
            console.error('Failed to clear draft order (non-critical):', draftError);
        }
        
        // Store order in session for confirmation page
        req.session.lastOrder = order;
        
        // Explicitly save the session before redirect
        req.session.save((err) => {
            if (err) {
                console.error('Session save error after order creation:', err);
                return res.redirect('/checkout?error=Order created but session save failed');
            }
            
            res.redirect('/confirmation');
        });
    } catch (error) {
        next(error);
    }
};
