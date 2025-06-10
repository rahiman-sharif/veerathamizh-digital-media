const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { protectUser } = require('../middlewares/authMiddleware');

// Apply protection middleware to all routes
router.use(protectUser);

// Checkout Page Routes
router.get('/', checkoutController.renderCheckoutPage);

// Checkout API Routes
router.post('/save-address', checkoutController.saveAddress);
router.post('/select-delivery', checkoutController.selectDelivery);
router.post('/choose-payment', checkoutController.choosePayment);
router.post('/process', checkoutController.processCheckout);

module.exports = router;
