const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'weezy_profiles',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }],
    },
});

const fileFilter = (req, file, cb) => {
    const mimeType = (file?.mimetype || '').toLowerCase();
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!mimeType.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
    }

    if (!allowed.includes(mimeType)) {
        return cb(new Error('Unsupported image format. Use JPG, PNG, or WEBP.'));
    }

    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter
});

module.exports = { cloudinary, upload };
