const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../../models/User');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

const googleClient = new OAuth2Client();

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * @desc    Google Login/Signup
 * @route   POST /api/auth/google
 */
exports.googleLogin = catchAsync(async (req, res, next) => {
    const { idToken, accessToken } = req.body;

    if (!idToken && !accessToken) {
        return next(new AppError('Please provide a Google ID token or Access token', 400));
    }

    try {
        let payload;

        if (idToken) {
            const audience = [
                process.env.GOOGLE_CLIENT_ID_IOS,
                process.env.GOOGLE_CLIENT_ID_ANDROID,
                process.env.GOOGLE_CLIENT_ID_WEB
            ].filter(Boolean);

            console.log("=== Google Auth Debug ===");
            console.log("Received ID Token Length:", idToken?.length);
            console.log("Configured Audiences:", audience);

            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience
            });
            payload = ticket.getPayload();
        } else if (accessToken) {
            console.log("=== Google Auth Debug ===");
            console.log("Received Access Token Length:", accessToken?.length);

            // Verify access token using Google UserInfo API
            const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            payload = {
                sub: data.sub,
                email: data.email,
                name: data.name,
                picture: data.picture
            };
        }

        const { sub: googleId, email, name, picture: avatar } = payload;

        let isNewUser = false;
        // 1. Check if user exists with this googleId
        let user = await User.findOne({ googleId });

        if (!user) {
            // 2. Check if user exists with this email (might have registered via email/pass)
            user = await User.findOne({ email });

            if (user) {
                // Link account
                user.googleId = googleId;
                if (!user.avatar || user.avatar.includes('ui-avatars.com')) {
                    user.avatar = avatar;
                }
                await user.save();
            } else {
                // 3. Create new user
                isNewUser = true;
                const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
                user = await User.create({
                    name,
                    email,
                    googleId,
                    avatar,
                    username,
                    referralCode: generateReferralCode(),
                    isVerified: true // Social users are usually verified
                });
            }
        }

        const token = signToken(user._id);

        res.status(200).json({
            success: true,
            token,
            data: { user, isNewUser }
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        return next(new AppError('Invalid Google token', 401));
    }
});

/**
 * @desc    Facebook Login/Signup
 * @route   POST /api/auth/facebook
 */
exports.facebookLogin = catchAsync(async (req, res, next) => {
    const { accessToken } = req.body;

    if (!accessToken) {
        return next(new AppError('Please provide a Facebook access token', 400));
    }

    try {
        // Fetch user data from Facebook Graph API
        const { data } = await axios.get(
            `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
        );

        if (!data || !data.id) {
            return next(new AppError('Failed to fetch Facebook profile', 401));
        }

        const facebookId = data.id;
        const name = data.name;
        const email = data.email;
        const avatar = data.picture?.data?.url || null;

        let isNewUser = false;

        // 1. Check if user exists with this facebookId
        let user = await User.findOne({ facebookId });

        if (!user) {
            // 2. Try email match
            if (email) {
                user = await User.findOne({ email });
            }

            if (user) {
                // Link account
                user.facebookId = facebookId;
                if (!user.avatar || user.avatar.includes('ui-avatars.com')) {
                    if (avatar) user.avatar = avatar;
                }
                await user.save();
            } else {
                // 3. Create new user
                isNewUser = true;
                const finalEmail = email || `${facebookId}@facebook-placeholder.bondus.com`;
                const finalName = name || 'User';
                const username = (email ? email.split('@')[0] : `fbuser${facebookId.substring(0, 5)}`) + Math.floor(Math.random() * 1000);

                user = await User.create({
                    name: finalName,
                    email: finalEmail,
                    facebookId,
                    avatar,
                    username,
                    referralCode: generateReferralCode(),
                    isVerified: true
                });
            }
        }

        const token = signToken(user._id);

        res.status(200).json({
            success: true,
            token,
            data: { user, isNewUser }
        });
    } catch (error) {
        console.error('Facebook Auth Error:', error.response?.data || error.message);
        return next(new AppError('Invalid Facebook token', 401));
    }
});
