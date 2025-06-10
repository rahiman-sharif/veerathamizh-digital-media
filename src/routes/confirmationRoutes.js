const express = require('express');
const router = express.Router();
const confirmationController = require('../controllers/confirmationController');
const { protectUser } = require('../middlewares/authMiddleware');

// Apply protection middleware
router.use(protectUser);

// Confirmation Page Route
router.get('/', confirmationController.renderConfirmationPage);

// Confirmation API Routes
router.get('/details/:orderId', confirmationController.getConfirmationDetails);
router.post('/finalize/:orderId', confirmationController.finalizeOrder);

module.exports = router;
