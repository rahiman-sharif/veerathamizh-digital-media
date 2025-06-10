const authService = require('../services/authService');

// Render pages
exports.renderLoginPage = (req, res) => {
    res.render('pages/auth/login', {
        title: 'Login - Veerathamizh Digital Media',
        error: req.query.error || null,
        success: req.query.success || null
    });
};

exports.renderRegisterPage = (req, res) => {
    res.render('pages/auth/register', {
        title: 'Sign Up - Veerathamizh Digital Media',
        error: req.query.error || null
    });
};

exports.renderForgotPasswordPage = (req, res) => {
    res.render('pages/auth/forgot-password', {
        title: 'Forgot Password - Veerathamizh Digital Media',
        error: req.query.error || null,
        success: req.query.success || null
    });
};

exports.renderOtpPage = (req, res) => {
    res.render('pages/auth/verify-otp', {
        title: 'Verify OTP - Veerathamizh Digital Media',
        error: req.query.error || null
    });
};

exports.renderResetPasswordPage = (req, res) => {
    const { token } = req.params;
    res.render('pages/auth/reset-password', {
        title: 'Reset Password - Veerathamizh Digital Media',
        token,
        error: req.query.error || null
    });
};

// API endpoints
exports.loginUser = async (req, res, next) => {
    try {
        const { identifier, password, rememberMe } = req.body;
        const user = await authService.loginUser(identifier, password);
          // Set user in session
        req.session.user = user;
        
        // Configure session duration based on "Remember me" checkbox
        if (rememberMe === 'on') {
            // Extend session to 30 days when "Remember me" is checked
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            // Set absolute expiry date (won't reset with activity)
            req.session.absoluteExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
            console.log('[AUTH] Remember me enabled - session extended to 30 days');
        } else {
            // Default session duration (7 days)
            req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            // Set absolute expiry date (won't reset with activity)
            req.session.absoluteExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
            console.log('[AUTH] Standard session duration - 7 days');
        }
        
        // Explicitly save the session before redirect
        req.session.save((err) => {
            if (err) {
                console.error('Session save error during login:', err);
                return res.redirect('/auth/login?error=Login successful but session save failed');
            }
            
            // Redirect based on user type
            if (user.user_type === 'Super User' || user.user_type === 'Admin') {
                res.redirect('/admin');
            } else {
                res.redirect('/');
            }
        });
    } catch (error) {
        res.redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
    }
};

exports.registerUser = async (req, res, next) => {
    try {
        const userData = req.body;
        const newUser = await authService.registerUser(userData);
        res.redirect('/auth/login?success=Registration successful! Please login.');
    } catch (error) {
        res.redirect(`/auth/register?error=${encodeURIComponent(error.message)}`);
    }
};

exports.requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        const resetLink = await authService.requestPasswordReset(email);
        res.redirect('/auth/forgot-password?success=Reset link sent to your email');
    } catch (error) {
        res.redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`);
    }
};

exports.verifyOtp = async (req, res, next) => {
    try {
        // NOTE: OTP functionality is marked as in-progress
        // Currently all OTPs will be accepted for development purposes
        
        // Once implemented, this will use OTP service to validate the OTP
        // For now, we'll just redirect to the home page
        console.log('[INFO] OTP verification is currently in progress. Allowing all OTP values for development.');
        res.redirect('/?message=OTP+verification+successful+%28development+mode%29');
    } catch (error) {
        res.redirect(`/auth/verify-otp?error=${encodeURIComponent(error.message)}`);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { token, password, confirm_password } = req.body;
        
        if (password !== confirm_password) {
            return res.redirect(`/auth/reset-password/${token}?error=Passwords do not match`);
        }
        
        await authService.resetPassword(token, password);
        res.redirect('/auth/login?success=Password has been reset successfully');
    } catch (error) {
        res.redirect(`/auth/reset-password/${token}?error=${encodeURIComponent(error.message)}`);
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error during logout:', err);
            return res.redirect('/?error=Logout failed');
        }
        res.redirect('/auth/login?success=You have been successfully logged out');
    });
};
