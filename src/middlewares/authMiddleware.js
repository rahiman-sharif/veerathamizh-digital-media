exports.protectUser = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login?error=Please login to continue');
    }
    next();
};

exports.protectSuperUser = (req, res, next) => {
    if (!req.session.user || (req.session.user.user_type !== 'Super User' && req.session.user.user_type !== 'Admin')) {
        return res.redirect('/auth/login?error=You do not have permission to access this page');
    }
    next();
};

exports.setUserLocals = (req, res, next) => {
    // Make user information available in templates
    res.locals.user = req.session.user || null;
    next();
};
