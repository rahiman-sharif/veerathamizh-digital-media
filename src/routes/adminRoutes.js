const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protectSuperUser } = require('../middlewares/authMiddleware');

// Apply super user protection to all admin routes
router.use(protectSuperUser);

// Admin dashboard
router.get('/', adminController.renderDashboard);

// User management
router.get('/users', adminController.renderUsersList);
router.get('/users/:id', adminController.renderUserDetail);
router.post('/users/:id/update-type', adminController.updateUserType);
router.post('/users/:id/update-details', adminController.updateUserDetails);
router.post('/users/:id/reset-password', adminController.resetUserPassword);

// Order management
router.get('/orders', adminController.renderOrdersList);
router.get('/orders/:id', adminController.renderOrderDetail);
router.get('/orders/:id/api', adminController.getOrderDetails); // API endpoint
router.post('/orders/:id/status', adminController.updateOrderStatus);
router.post('/orders/:id/notes', adminController.updateOrderNotes);

module.exports = router;
