const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protectUser } = require('../middlewares/authMiddleware');

// Apply protection middleware to all user routes
router.use(protectUser);

// Define user-related routes
router.get('/details', userController.getUserDetails);
router.get('/orders', userController.getUserOrders);
router.get('/orders/:orderId', userController.getUserOrderDetail);
router.get('/profile', userController.getUserProfile);
router.post('/profile/update', userController.updateUserProfile);

// Password management routes
router.get('/change-password', userController.changePasswordForm);
router.post('/change-password', userController.changePassword);

// Address management routes
router.get('/addresses', userController.getUserAddresses);
router.post('/addresses/add', userController.addUserAddress);
router.post('/addresses/update/:addressId', userController.updateUserAddress);
router.post('/addresses/delete/:addressId', userController.deleteUserAddress);
router.post('/addresses/set-default/:addressId', userController.setDefaultAddress);

module.exports = router;
