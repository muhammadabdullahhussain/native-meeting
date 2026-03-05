const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

/**
 * @desc    Search for cities via Photon (OpenStreetMap)
 * @route   GET /api/location/search
 */
exports.search = catchAsync(async (req, res, next) => {
    const { q } = req.query;
    if (!q) return next(new AppError('Search query is required', 400));

    try {
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}`);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Photon search proxy error:', error);
        return next(new AppError('Failed to fetch from location service', 503));
    }
});

/**
 * @desc    Reverse geocode via Photon
 * @route   GET /api/location/reverse
 */
exports.reverse = catchAsync(async (req, res, next) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return next(new AppError('Latitude and longitude are required', 400));

    try {
        const response = await fetch(`https://photon.komoot.io/reverse/?lon=${lon}&lat=${lat}`);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Photon reverse proxy error:', error);
        return next(new AppError('Failed to fetch from location service', 503));
    }
});
