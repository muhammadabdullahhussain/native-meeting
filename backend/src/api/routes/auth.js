const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password, bio, city, jobTitle, interests, lookingFor, avatar, banner, referralCode: usedReferralCode } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Handle referral link
        let referrerId = null;
        if (usedReferralCode) {
            const referrer = await User.findOne({ referralCode: usedReferralCode });
            if (referrer) {
                referrerId = referrer._id;
                // Increment referrer's count
                referrer.referralCount += 1;
                // Logic for "3 friends = unlock"
                if (referrer.referralCount >= 3) {
                    referrer.unlockedPerks.customTags = true;
                }
                await referrer.save();
            }
        }

        const user = await User.create({
            name,
            email,
            password,
            bio,
            city,
            jobTitle,
            interests,
            lookingFor,
            avatar,
            banner,
            referralCode: generateReferralCode(),
            referredBy: referrerId
        });

        const token = signToken(user._id);

        res.status(201).json({
            status: 'success',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                banner: user.banner,
                referralCode: user.referralCode,
                referralCount: user.referralCount,
                unlockedPerks: user.unlockedPerks
            }
        });
    } catch (err) {
        next(err);
    }
});

// @route   POST api/auth/login
// @desc    Login user
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password, user.password))) {
            return res.status(401).json({ message: 'Incorrect email or password' });
        }

        const token = signToken(user._id);

        res.status(200).json({
            status: 'success',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                banner: user.banner,
                referralCode: user.referralCode,
                referralCount: user.referralCount,
                unlockedPerks: user.unlockedPerks
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST api/auth/check-email
// @desc    Check if email is already registered
router.post('/check-email', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Please provide an email' });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email already registered. Please log in instead.' });
        }
        res.status(200).json({ status: 'success', message: 'Email is available' });
    } catch (err) {
        next(err);
    }
});

const { protect } = require('../middleware/authMiddleware');

// ... (previous routes)

// @route   PATCH api/auth/me
// @desc    Update current user profile
router.patch('/me', protect, async (req, res, next) => {
    try {
        const updates = req.body;

        // Prevent password updates via this route
        delete updates.password;
        delete updates.email;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                banner: updatedUser.banner,
                referralCode: updatedUser.referralCode,
                referralCount: updatedUser.referralCount,
                unlockedPerks: updatedUser.unlockedPerks,
                bio: updatedUser.bio,
                city: updatedUser.city,
                jobTitle: updatedUser.jobTitle,
                interests: updatedUser.interests,
                lookingFor: updatedUser.lookingFor,
                isPremium: updatedUser.isPremium
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
