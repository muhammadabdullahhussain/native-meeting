const User = require('../../models/User');
const catchAsync = require('../../utils/catchAsync');

/**
 * @desc    Render a premium referral landing page
 * @route   GET /join?code=XYZ
 */
exports.renderJoinPage = catchAsync(async (req, res, next) => {
    const { code } = req.query;

    // Find the inviter
    const inviter = await User.findOne({ referralCode: code });
    const inviterName = inviter ? inviter.name : 'A friend';
    const inviterAvatar = inviter?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(inviterName) + '&background=6366F1&color=fff';

    res.render('join', {
        title: `Join ${inviterName} on Interesta!`,
        inviterName,
        inviterAvatar,
        code: code || 'INVITE'
    });
});
