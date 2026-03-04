const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

/**
 * @desc    Uploads an image to Cloudinary and returns the URL
 * @route   POST /api/upload
 */
exports.uploadImage = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('No file uploaded', 400));
    }

    // req.file.path contains the secure Cloudinary URL
    res.status(200).json({
        success: true,
        status: 'success',
        url: req.file.path,
        public_id: req.file.filename
    });
});
