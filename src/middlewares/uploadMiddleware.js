const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define storage settings for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../public/uploads');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with date prefix
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        
        cb(null, 'banner-' + uniqueSuffix + extension);
    }
});

// File filter to allow only image files
const fileFilter = function (req, file, cb) {
    // Accept only jpg and png files
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
};

// Error handling wrapper for multer
const uploadWithErrorHandling = (req, res, next) => {
    const uploader = multer({ 
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB limit
        }
    }).single('banner');

    uploader(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer error (e.g., file too large)
            return res.status(400).json({
                success: false,
                error: err.code === 'LIMIT_FILE_SIZE' 
                    ? 'File size is too large. Maximum size is 5MB.'
                    : `Upload error: ${err.message}`
            });
        } else if (err) {
            // Other errors (e.g., wrong file type)
            return res.status(400).json({
                success: false,
                error: err.message || 'Error uploading file'
            });
        }
        next();
    });
};

module.exports = uploadWithErrorHandling;
