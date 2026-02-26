const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/users/discover
 * @desc    Find users nearby with interest matching
 * @access  Private
 */
router.get('/discover', protect, async (req, res) => {
    try {
        const { maxDistance = 50, interests, lookingFor } = req.query;
        const currentUser = req.user;

        // 1. Find users nearby using MongoDB 2dsphere index
        // Coordinates: [lng, lat]
        const nearbyUsers = await User.find({
            _id: { $ne: currentUser._id }, // Exclude self
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: currentUser.location.coordinates,
                    },
                    $maxDistance: parseInt(maxDistance) * 1000, // Distance in meters
                }
            }
        }).limit(20);

        // 2. Calculate Match Score and Distance for each user
        const discoveryList = nearbyUsers.map(u => {
            const userObj = u.toObject();

            // Calculate distance (rough estimate since $near sorts by distance but doesn't return it directly without $geoNear)
            // For simplicity in Phase 3, we'll return the users and assume the FE calculates precise distance if needed,
            // or we could use aggregation $geoNear. Let's use $geoNear for better data.
            return userObj;
        });

        // Better approach: Use Aggregation for $geoNear to get distanceKm
        const aggregatedUsers = await User.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: currentUser.location.coordinates,
                    },
                    distanceField: 'distanceMeters',
                    maxDistance: parseInt(maxDistance) * 1000,
                    query: { _id: { $ne: currentUser._id } },
                    spherical: true,
                }
            },
            { $limit: 20 }
        ]);

        const finalUsers = aggregatedUsers.map(u => {
            const shared = (u.interests || []).filter(i => (currentUser.interests || []).includes(i));
            const matchScore = Math.min(100, Math.round((shared.length / Math.max(currentUser.interests.length, 1)) * 100) + 40);

            return {
                ...u,
                id: u._id,
                distanceKm: parseFloat((u.distanceMeters / 1000).toFixed(1)),
                matchScore,
                sharedInterests: shared,
            };
        });

        res.json(finalUsers);
    } catch (error) {
        console.error('Discovery error:', error);
        res.status(500).json({ message: 'Server error during discovery' });
    }
});

module.exports = router;
