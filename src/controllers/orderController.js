const orderService = require('../services/orderService');

// Render page controllers
exports.renderOrderPage = async (req, res, next) => {
    try {
        // Get banner sizes from service layer
        const bannerSizes = await orderService.getBannerSizes();
        
        res.render('pages/order/create', {
            title: 'Order Banner - Veerathamizh Digital Media',
            bannerSizes: bannerSizes,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (error) {
        next(error);
    }
};

exports.renderCartPage = async (req, res, next) => {
    try {
        // Initialize cart in session if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = { items: [], user_id: req.session.user.id };
        }
        
        // If cart is empty in session, try to load from draft order
        if (req.session.cart.items.length === 0 && req.session.user) {
            try {
                const draftItems = await orderService.loadCartFromDraft(req.session.user.id);
                if (draftItems.length > 0) {
                    req.session.cart.items = draftItems;
                    // Save the restored cart to session
                    req.session.save(() => {});
                }
            } catch (loadError) {
                console.error('Failed to load cart from draft (non-critical):', loadError);
            }
        }
        
        // Calculate total
        let subtotal = 0;
        req.session.cart.items.forEach(item => {
            subtotal += item.price * item.quantity;
        });
        
        res.render('pages/order/cart', {
            title: 'Shopping Cart - Veerathamizh Digital Media',
            cart: req.session.cart,
            subtotal: subtotal,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (error) {
        next(error);
    }
};

// API controllers
exports.uploadBanner = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Generate relative URL for the image
        const imageUrl = `/uploads/${req.file.filename}`;
        
        // Return the image URL to client
        res.status(200).json({ 
            success: true, 
            imageUrl: imageUrl,
            message: 'Banner uploaded successfully',
            filename: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addBannerItem = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const { image_url, banner_size, quantity } = req.body;
        
        // Validate required fields
        if (!image_url || !banner_size || !quantity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Get banner sizes for price lookup
        const bannerSizes = await orderService.getBannerSizes();
        const selectedSize = bannerSizes.find(size => size.id === banner_size);
        
        if (!selectedSize) {
            return res.status(400).json({ error: 'Invalid banner size' });
        }
        
        // Initialize cart in session if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = { items: [], user_id: req.session.user.id };
        }
        
        // Create banner item for session cart
        const newItem = {
            id: Date.now().toString(),
            image_url,
            banner_size,
            quantity: parseInt(quantity, 10),
            price: selectedSize.price,
            added_at: new Date().toISOString()
        };        // Add to session cart
        req.session.cart.items.push(newItem);
        
        // Save cart to database as draft (for persistence)
        try {
            await orderService.saveCartAsDraft(req.session.user.id, req.session.cart.items);
        } catch (draftError) {
            console.error('Draft save error (non-critical):', draftError);
            // Continue with session save even if draft fails
        }
        
        // Explicitly save the session
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to save session' });
            }
            
            // Return success
            res.status(201).json({
                success: true,
                item: newItem,
                message: 'Banner added to cart'
            });
        });
    } catch (error) {
        next(error);
    }
};

exports.removeBannerItem = async (req, res, next) => {
    try {
        const bannerId = req.params.id;
        
        // Check if cart exists
        if (!req.session.cart || !req.session.cart.items) {
            return res.status(404).json({ error: 'Cart not found' });
        }        // Remove item from cart
        req.session.cart.items = req.session.cart.items.filter(item => item.id !== bannerId);
        
        // Update draft order (for persistence)
        try {
            await orderService.saveCartAsDraft(req.session.user.id, req.session.cart.items);
        } catch (draftError) {
            console.error('Draft update error (non-critical):', draftError);
        }
        
        // Explicitly save the session
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to save session' });
            }
            
            res.status(200).json({ 
                success: true,
                message: 'Banner removed from cart' 
            });
        });
    } catch (error) {
        next(error);
    }
};

exports.listOrderItems = async (req, res, next) => {
    try {
        // Get cart from session
        const cart = req.session.cart || { items: [] };
        
        res.status(200).json({ 
            success: true,
            items: cart.items 
        });
    } catch (error) {
        next(error);
    }
};

exports.updateQuantity = async (req, res, next) => {
    try {
        const bannerId = req.params.id;
        const { quantity } = req.body;
        
        // Check if cart exists
        if (!req.session.cart || !req.session.cart.items) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        
        // Update quantity
        const itemIndex = req.session.cart.items.findIndex(item => item.id === bannerId);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }        // Update quantity
        req.session.cart.items[itemIndex].quantity = parseInt(quantity, 10);
        
        // Update draft order (for persistence)
        try {
            await orderService.saveCartAsDraft(req.session.user.id, req.session.cart.items);
        } catch (draftError) {
            console.error('Draft update error (non-critical):', draftError);
        }
        
        // Explicitly save the session
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to save session' });
            }
            
            res.status(200).json({
                success: true,
                item: req.session.cart.items[itemIndex],
                message: 'Quantity updated'
            });
        });
    } catch (error) {
        next(error);
    }
};

exports.clearCart = async (req, res, next) => {
    try {        // Clear cart
        req.session.cart = { items: [], user_id: req.session.user.id };
        
        // Clear draft order (for persistence)
        try {
            await orderService.clearDraftOrder(req.session.user.id);
        } catch (draftError) {
            console.error('Draft clear error (non-critical):', draftError);
        }
        
        // Explicitly save the session
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to save session' });
            }
            
            res.status(200).json({
                success: true,
                message: 'Cart cleared successfully'
            });
        });
    } catch (error) {
        next(error);
    }
};
