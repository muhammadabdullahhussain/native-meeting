const express = require('express');
const router = express.Router();
const { upload } = require('../cloudinaryConfig');

// POST /api/upload
// Uploads an image to Cloudinary and returns the URL
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // req.file.path contains the secure Cloudinary URL
        res.json({
            success: true,
            url: req.file.path,
            public_id: req.file.filename
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Internal server error during upload' });
    }
});

module.exports = router;
