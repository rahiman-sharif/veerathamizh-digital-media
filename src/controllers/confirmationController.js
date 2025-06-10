const confirmationService = require('../services/confirmationService');

// Render page controller
exports.renderConfirmationPage = (req, res, next) => {
    try {
        // Check if order exists in session
        if (!req.session.lastOrder) {
            return res.redirect('/');
        }
          res.render('pages/confirmation/index', {
            title: 'Order Confirmation - Veerathamizh Digital Media',
            order: req.session.lastOrder,
            user: req.session.user || null
        });
        
        // Send confirmation email/SMS (simulated)
        confirmationService.sendConfirmationNotification(req.session.lastOrder, req.session.user.email);
        
    } catch (error) {
        next(error);
    }
};

// API controllers
exports.getConfirmationDetails = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const confirmationDetails = await confirmationService.getConfirmationDetails(orderId);
        res.status(200).json(confirmationDetails);
    } catch (error) {
        next(error);
    }
};

exports.finalizeOrder = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const finalizedOrder = await confirmationService.finalizeOrder(orderId);
        res.status(200).json(finalizedOrder);
    } catch (error) {
        next(error);
    }
};
