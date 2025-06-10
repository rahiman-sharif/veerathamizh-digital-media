const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login Routes
router.get('/login', authController.renderLoginPage);
router.post('/login', authController.loginUser);

// Register Routes
router.get('/register', authController.renderRegisterPage);
router.post('/register', authController.registerUser);

// Forgot Password Routes
router.get('/forgot-password', authController.renderForgotPasswordPage);
router.post('/forgot-password', authController.requestPasswordReset);

// OTP Verification Routes
router.get('/verify-otp', authController.renderOtpPage);
router.post('/verify-otp', authController.verifyOtp);

// Reset Password Routes
router.get('/reset-password/:token', authController.renderResetPasswordPage);
router.post('/reset-password', authController.resetPassword);

// Logout Route
router.get('/logout', authController.logout);

module.exports = router;
