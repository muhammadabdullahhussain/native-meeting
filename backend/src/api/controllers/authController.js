const authService = require('../../services/authService');
const User = require('../../models/User'); // Still need for checkEmail (simple query)
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
exports.register = catchAsync(async (req, res, next) => {
    // Check if user already exists
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
        return next(new AppError('User already exists', 400));
    }

    const { user, token } = await authService.registerUser(req.body);

    res.status(201).json({
        success: true,
        status: 'success',
        token,
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                banner: user.banner,
                photos: user.photos || [],
                username: user.username,
                bio: user.bio,
                city: user.city,
                jobTitle: user.jobTitle,
                company: user.company,
                interests: user.interests,
                interestCategories: user.interestCategories || [],
                lookingFor: user.lookingFor,
                gender: user.gender,
                birthday: user.birthday,
                age: user.age,
                isPremium: user.isPremium,
                isVerified: user.isVerified,
                isOnline: user.onlineStatus,
                connectionCount: user.connectionCount || 0,
                referralCode: user.referralCode,
                referralCount: user.referralCount || 0,
                unlockedGroupPasses: user.unlockedGroupPasses || 0,
                lastSeen: user.lastSeen,
                responseRate: user.responseRate || null,
                location: user.location,
                settings: user.settings,
            }
        }
    });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    const result = await authService.loginUser(email, password);

    if (!result) {
        return next(new AppError('Incorrect email or password', 401));
    }

    const { user, token } = result;

    res.status(200).json({
        success: true,
        status: 'success',
        token,
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                banner: user.banner,
                photos: user.photos || [],
                username: user.username,
                bio: user.bio,
                city: user.city,
                jobTitle: user.jobTitle,
                company: user.company,
                interests: user.interests,
                interestCategories: user.interestCategories || [],
                lookingFor: user.lookingFor,
                gender: user.gender,
                birthday: user.birthday,
                age: user.age,
                isPremium: user.isPremium,
                isVerified: user.isVerified,
                isOnline: user.onlineStatus,
                connectionCount: user.connectionCount || 0,
                referralCode: user.referralCode,
                referralCount: user.referralCount || 0,
                unlockedGroupPasses: user.unlockedGroupPasses || 0,
                lastSeen: user.lastSeen,
                responseRate: user.responseRate || null,
                location: user.location,
                settings: user.settings,
            }
        }
    });
});

/**
 * @desc    Get current user profile (Fresh data)
 * @route   GET /api/auth/me
 */
exports.getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new AppError('User no longer exists', 404));
    }

    res.status(200).json({
        success: true,
        status: 'success',
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                banner: user.banner,
                photos: user.photos || [],
                bio: user.bio,
                city: user.city,
                jobTitle: user.jobTitle,
                company: user.company,
                interests: user.interests,
                interestCategories: user.interestCategories || [],
                lookingFor: user.lookingFor,
                availability: user.availability,
                gender: user.gender,
                birthday: user.birthday,
                age: user.age,
                isPremium: user.isPremium,
                isVerified: user.isVerified,
                isOnline: user.onlineStatus,
                referralCode: user.referralCode,
                referralCount: user.referralCount || 0,
                unlockedGroupPasses: user.unlockedGroupPasses || 0,
                connectionCount: user.connectionCount || 0,
                lastSeen: user.lastSeen,
                responseRate: user.responseRate || null,
                location: user.location,
                settings: user.settings,
            }
        }
    });
});

/**
 * @desc    Check if email is already registered
 */
exports.checkEmail = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    if (!email) return next(new AppError('Please provide an email', 400));

    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new AppError('Email already registered. Please log in instead.', 400));
    }
    res.status(200).json({ success: true, status: 'success', message: 'Email is available' });
});

/**
  * @desc    Validate referral code
 */
exports.validateReferral = catchAsync(async (req, res, next) => {
    const { code } = req.params;
    if (!code) return next(new AppError('Please provide a referral code', 400));

    const referrer = await User.findOne({ referralCode: code.toUpperCase() }).select(
        'name username avatar city jobTitle company referralCode referralCount unlockedGroupPasses isVerified'
    );
    if (!referrer) {
        return next(new AppError('Invalid referral code', 404));
    }

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'Referral code is valid',
        data: {
            referrerName: referrer.name,
            referrerUsername: referrer.username,
            referrerAvatar: referrer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(referrer.name)}&background=6366F1&color=fff`,
            referrerCity: referrer.city || null,
            referrerHeadline: [referrer.jobTitle, referrer.company].filter(Boolean).join(' at ') || null,
            referralCode: referrer.referralCode,
            referralCount: referrer.referralCount || 0,
            unlockedGroupPasses: referrer.unlockedGroupPasses || 0,
            isVerified: !!referrer.isVerified
        }
    });
});

/**
 * @desc    Update current user profile
 */
exports.updateMe = catchAsync(async (req, res, next) => {
    const updatedUser = await authService.updateUserProfile(req.user.id, req.body);

    if (!updatedUser) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        success: true,
        status: 'success',
        data: {
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                username: updatedUser.username,
                avatar: updatedUser.avatar,
                banner: updatedUser.banner,
                photos: updatedUser.photos || [],
                bio: updatedUser.bio,
                city: updatedUser.city,
                jobTitle: updatedUser.jobTitle,
                company: updatedUser.company,
                interests: updatedUser.interests,
                interestCategories: updatedUser.interestCategories || [],
                lookingFor: updatedUser.lookingFor,
                availability: updatedUser.availability,
                gender: updatedUser.gender,
                birthday: updatedUser.birthday,
                age: updatedUser.age,
                isPremium: updatedUser.isPremium,
                isVerified: updatedUser.isVerified,
                isOnline: updatedUser.onlineStatus,
                referralCode: updatedUser.referralCode,
                referralCount: updatedUser.referralCount,
                unlockedPerks: updatedUser.unlockedPerks,
                conversationCount: updatedUser.conversationCount || 0,
                responseRate: updatedUser.responseRate || null,
                dailyConnectionRequestsSent: updatedUser.dailyConnectionRequestsSent || 0,
                lastConnectionRequestReset: updatedUser.lastConnectionRequestReset,
                unlockedGroupPasses: updatedUser.unlockedGroupPasses || 0,
                connectionCount: updatedUser.connectionCount || 0,
                settings: updatedUser.settings,
            }
        }
    });
});

/**
 * @desc    Update user settings (discovery prefs / notification prefs)
 * @route   PATCH /api/auth/settings
 */
exports.updateSettings = catchAsync(async (req, res, next) => {
    const { discovery, notifications } = req.body;

    // Build a dot-notation update to avoid overwriting sibling fields
    const updateObj = {};
    if (discovery) {
        Object.keys(discovery).forEach(k => {
            updateObj[`settings.discovery.${k}`] = discovery[k];
        });
    }
    if (notifications) {
        Object.keys(notifications).forEach(k => {
            updateObj[`settings.notifications.${k}`] = notifications[k];
        });
    }
    if (req.body.privacy) {
        Object.keys(req.body.privacy).forEach(k => {
            updateObj[`settings.privacy.${k}`] = req.body.privacy[k];
        });
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateObj },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Settings updated',
        data: { settings: user.settings }
    });
});

/**
 * @desc    Change password (in-app, requires current password)
 * @route   PATCH /api/auth/change-password
 */
exports.changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return next(new AppError('Please provide current and new password', 400));
    }
    if (newPassword.length < 6) {
        return next(new AppError('New password must be at least 6 characters', 400));
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword, user.password);
    if (!isMatch) {
        return next(new AppError('Incorrect current password', 401));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
});

/**
 * @desc    Delete current user account permanently
 * @route   DELETE /api/auth/me
 */
exports.deleteMe = catchAsync(async (req, res, next) => {
    const userId = req.user.id;

    // Delete all associated data in parallel
    const Connection = require('../../models/Connection');
    const Message = require('../../models/Message');
    const Notification = require('../../models/Notification');

    await Promise.all([
        Connection.deleteMany({
            $or: [{ requester: userId }, { receiver: userId }]
        }),
        Message.deleteMany({
            $or: [{ sender: userId }, { receiver: userId }]
        }),
        Notification.deleteMany({
            $or: [{ recipient: userId }, { sender: userId }]
        }),
        User.findByIdAndDelete(userId),
    ]);

    res.status(204).json({ success: true, data: null });
});
