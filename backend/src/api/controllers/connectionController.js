const connectionService = require('../../services/connectionService');
const catchAsync = require('../../utils/catchAsync');

/**
 * @desc    Send a connection request
 * @route   POST /api/connections/request/:userId
 */
exports.sendRequest = catchAsync(async (req, res, next) => {
    const connection = await connectionService.createConnectionRequest(
        req.user.id,
        req.params.userId,
        req.body.message
    );

    res.status(201).json({
        success: true,
        status: 'success',
        data: connection
    });
});

/**
 * @desc    Get pending requests for current user
 * @route   GET /api/connections/pending
 */
exports.getPendingRequests = catchAsync(async (req, res, next) => {
    const requests = await connectionService.getPendingRequestsForUser(req.user.id);

    res.status(200).json({
        success: true,
        status: 'success',
        results: requests.length,
        data: requests
    });
});

/**
 * @desc    Accept or Decline a connection request
 * @route   PATCH /api/connections/resolve/:requestId
 */
exports.resolveRequest = catchAsync(async (req, res, next) => {
    const { status } = req.body;

    const connection = await connectionService.resolveConnectionRequest(
        req.params.requestId,
        req.user.id,
        status
    );

    res.status(200).json({
        success: true,
        status: 'success',
        data: connection,
        message: `Request ${status} successfully`
    });
});

/**
 * @desc    Get all accepted connections
 * @route   GET /api/connections/my-friends
 */
exports.getMyFriends = catchAsync(async (req, res, next) => {
    const friends = await connectionService.getAcceptedConnections(req.user.id);

    res.status(200).json({
        success: true,
        status: 'success',
        results: friends.length,
        data: friends
    });
});

/**
 * @desc    Get connection status between current user and another
 * @route   GET /api/connections/status/:userId
 */
exports.getStatus = catchAsync(async (req, res, next) => {
    const status = await connectionService.getConnectionStatus(req.user.id, req.params.userId);

    res.status(200).json({
        success: true,
        status: 'success',
        data: status
    });
});

/**
 * @desc    Block a user
 * @route   POST /api/connections/block/:userId
 */
exports.blockUser = catchAsync(async (req, res, next) => {
    const connection = await connectionService.blockUser(req.user.id, req.params.userId);

    res.status(200).json({
        success: true,
        status: 'success',
        data: connection,
        message: 'User blocked successfully'
    });
});

/**
 * @desc    Unblock a user
 * @route   POST /api/connections/unblock/:userId
 */
exports.unblockUser = catchAsync(async (req, res, next) => {
    await connectionService.unblockUser(req.user.id, req.params.userId);

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'User unblocked successfully'
    });
});

/**
 * @desc    Report a user
 * @route   POST /api/connections/report/:userId
 */
exports.reportUser = catchAsync(async (req, res, next) => {
    const { reason } = req.body;
    const report = await connectionService.reportUser(req.user.id, req.params.userId, reason);

    res.status(201).json({
        success: true,
        status: 'success',
        data: report,
        message: 'User reported and blocked successfully'
    });
});

/**
 * @desc    Get all blocked user IDs
 * @route   GET /api/connections/blocked
 */
exports.getBlockedUsers = catchAsync(async (req, res, next) => {
    const blockedIds = await connectionService.getBlockedUserIds(req.user.id);

    res.status(200).json({
        success: true,
        status: 'success',
        data: blockedIds
    });
});
