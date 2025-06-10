const dbService = require('./dbService');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

exports.registerUser = async (userData) => {
    // Check if email already exists
    const existingUserByEmail = await dbService.findOneByField('USERS', 'email', userData.email);
    if (existingUserByEmail) {
        throw new Error('Email is already registered');
    }
    
    // Check if phone number already exists
    if (userData.phone) {
        const existingUserByPhone = await dbService.findOneByField('USERS', 'phone', userData.phone);
        if (existingUserByPhone) {
            throw new Error('Phone number is already registered');
        }
    }      // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@#$%^&*!]{7,16}$/;
    if (!passwordRegex.test(userData.password)) {
       throw new Error('Password must be 7-16 characters with at least one uppercase letter, one lowercase letter, and one number. Special characters @#$%^&*! allowed.');
    }
    
    // Hash password and create user
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = { 
        ...userData, 
        id: uuidv4(), 
        password: hashedPassword,
        created_at: new Date().toISOString()
    };
    
    // Remove password confirmation field
    delete newUser.confirm_password;
    
    // Create the user in the database
    await dbService.create('USERS', newUser);
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};

exports.loginUser = async (identifier, password) => {
    let user;
      // Check if identifier is an email (contains @ symbol)
    if (identifier.includes('@')) {
        // Find user by email with login delay
        user = await dbService.findOneByFieldForLogin('USERS', 'email', identifier);
    } else {
        // Find user by phone number with login delay
        user = await dbService.findOneByFieldForLogin('USERS', 'phone', identifier);
    }
      if (!user) {
        throw new Error('Invalid email/phone or password');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid email/phone or password');
    }
    
    // Return user without password
    const { password: userPassword, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

exports.requestPasswordReset = async (email) => {
    // Find the user by email
    const user = await dbService.findOneByField('USERS', 'email', email);
    
    if (!user) {
        throw new Error('No account found with that email address');
    }
    
    // Create a reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // Token valid for 1 hour
    
    // Delete any existing tokens for this user
    await dbService.deleteByField('RESET_TOKENS', 'userId', user.id);
    
    // Create new token
    const tokenData = {
        id: uuidv4(),
        userId: user.id,
        token,
        expiry: expiry.toISOString()
    };
    
    // Save to database
    await dbService.create('RESET_TOKENS', tokenData);
    
    // In a real application, send email with reset link
    return `${process.env.APP_URL || 'http://localhost:3001'}/auth/reset-password/${token}`;
};

exports.resetPassword = async (token, newPassword) => {
    // Find the token record
    const tokenRecords = await dbService.findByField('RESET_TOKENS', 'token', token);
    const tokenRecord = tokenRecords.length > 0 ? tokenRecords[0] : null;
    
    if (!tokenRecord) {
        throw new Error('Invalid or expired reset link');
    }
    
    // Check if token is expired
    const expiry = new Date(tokenRecord.expiry);
    if (expiry < new Date()) {
        throw new Error('Reset link has expired');
    }
      // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{7,16}$/;
    if (!passwordRegex.test(newPassword)) {
       throw new Error('Password must be 7-16 characters with at least one uppercase letter, one lowercase letter, and one number');
    }
    
    // Find the user
    const user = await dbService.findById('USERS', tokenRecord.userId);
    
    if (!user) {
        throw new Error('User not found');
    }
    
    // Update user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbService.updateById('USERS', user.id, { password: hashedPassword });
    
    // Delete the used token
    await dbService.deleteById('RESET_TOKENS', tokenRecord.id);
    
    return true;
};

exports.verifyOtp = async (otp) => {
    // OTP functionality is marked as in-progress
    // Will be implemented in future with proper database integration
    console.log('[INFO] OTP verification is currently in progress. Allowing all OTP values for development.');
    return true; // Always return true for now until OTP feature is fully implemented
};
