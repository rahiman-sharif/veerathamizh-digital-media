const dbService = require('./dbService');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generate a random OTP
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - Generated OTP
 */
function generateRandomOtp(length = 6) {
    // In a production environment, use a proper crypto library for this
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate OTP for a user
 * This method uses the database abstraction layer
 * 
 * @param {string} userId - User ID
 * @param {string} phone - Phone number
 * @param {number} expiryMinutes - OTP expiry time in minutes (default: 10)
 * @returns {Promise<object>} - OTP details
 */
exports.generateOtp = async (userId, phone, expiryMinutes = 10) => {
    try {
        // Delete existing OTPs for this user/phone
        await dbService.deleteByField('OTPS', 'userId', userId);
        
        // Generate new OTP
        const otp = generateRandomOtp();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
        
        // Create OTP record
        const otpRecord = {
            id: uuidv4(),
            userId,
            phone,
            otp,
            expiresAt: expiresAt.toISOString(),
            createdAt: new Date().toISOString(),
            isVerified: false,
            attempts: 0
        };
        
        // Save to database
        await dbService.create('OTPS', otpRecord);
        
        // Return OTP info (without the actual OTP)
        const { otp: actualOtp, ...otpInfo } = otpRecord;
        return {
            ...otpInfo,
            message: `OTP sent to ${phone}`,
            // In production, remove this line
            otp: actualOtp // Only for demo purposes
        };
    } catch (error) {
        throw new Error(`Failed to generate OTP: ${error.message}`);
    }
};

/**
 * Validate OTP for a user
 * This method uses the database abstraction layer
 * 
 * @param {string} userId - User ID
 * @param {string} phone - Phone number 
 * @param {string} otp - OTP to validate
 * @returns {Promise<boolean>} - True if OTP is valid
 */
exports.validateOtp = async (userId, phone, otp) => {
    try {
        // Find the OTP records for this user
        const otpRecords = await dbService.findByField('OTPS', 'userId', userId);
        
        // Find the specific OTP record for this user/phone
        const otpRecord = otpRecords.find(o => o.phone === phone);
        
        // If no OTP record found, return false
        if (!otpRecord) {
            throw new Error('No OTP found for this user');
        }
        
        // Check if OTP is verified already
        if (otpRecord.isVerified) {
            throw new Error('OTP already used');
        }
        
        // Check if OTP is expired
        const expiresAt = new Date(otpRecord.expiresAt);
        if (expiresAt < new Date()) {
            throw new Error('OTP has expired');
        }
        
        // Update attempts
        otpRecord.attempts += 1;
        
        // Check max attempts (3)
        if (otpRecord.attempts > 3) {
            // Update the record with max attempts reached
            await dbService.updateById('OTPS', otpRecord.id, { attempts: otpRecord.attempts });
            throw new Error('Maximum attempts exceeded');
        }
        
        // Validate OTP
        if (otpRecord.otp !== otp) {
            // Update attempts count in the database
            await dbService.updateById('OTPS', otpRecord.id, { attempts: otpRecord.attempts });
            throw new Error('Invalid OTP');
        }
        
        // Mark OTP as verified
        const updatedData = {
            isVerified: true,
            verifiedAt: new Date().toISOString(),
            attempts: otpRecord.attempts
        };
        
        // Update in database
        await dbService.updateById('OTPS', otpRecord.id, updatedData);
        
        return true;
    } catch (error) {
        throw new Error(`OTP validation failed: ${error.message}`);
    }
};

/**
 * Resend OTP to a user
 * This method uses the database abstraction layer
 * 
 * @param {string} userId - User ID
 * @param {string} phone - Phone number
 * @returns {Promise<object>} - New OTP details
 */
exports.resendOtp = async (userId, phone) => {
    try {
        // Find any existing OTP for this user/phone
        const otpRecords = await dbService.findByField('OTPS', 'userId', userId);
        const otpRecord = otpRecords.find(o => o.phone === phone);
        
        // Check if an OTP was generated in the last minute
        if (otpRecord) {
            const createdAt = new Date(otpRecord.createdAt);
            const oneMinuteAgo = new Date();
            oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
            
            if (createdAt > oneMinuteAgo) {
                throw new Error('Please wait at least 1 minute before requesting another OTP');
            }
        }
        
        // Generate new OTP
        return await this.generateOtp(userId, phone);
    } catch (error) {
        throw new Error(`Failed to resend OTP: ${error.message}`);
    }
};
