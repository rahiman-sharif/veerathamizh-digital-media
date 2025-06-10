const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protectUser } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Apply protection middleware to all routes
router.use(protectUser);

// Order Page Routes
router.get('/', orderController.renderOrderPage);
router.get('/cart', orderController.renderCartPage);

// Banner API Routes
router.post('/upload-banner', upload, async (req, res, next) => {
    try {
        // Now handle the upload after our middleware has processed it
        await orderController.uploadBanner(req, res);
    } catch (error) {
        next(error);
    }
});
router.post('/add-banner', orderController.addBannerItem);
router.delete('/remove-banner/:id', orderController.removeBannerItem);
router.get('/list-orders', orderController.listOrderItems);
router.post('/update-quantity/:id', orderController.updateQuantity);
router.post('/clear-cart', orderController.clearCart);

module.exports = router;
