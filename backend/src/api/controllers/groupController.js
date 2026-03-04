const groupService = require('../../services/groupService');
const catchAsync = require('../../utils/catchAsync');

/**
 * @desc    Get all public groups
 * @route   GET /api/groups
 */
exports.getAllGroups = catchAsync(async (req, res, next) => {
    const groups = await groupService.getAllGroups();

    res.status(200).json({
        success: true,
        status: 'success',
        results: groups.length,
        data: groups
    });
});

/**
 * @desc    Join a group
 * @route   POST /api/groups/:id/join
 */
exports.joinGroup = catchAsync(async (req, res, next) => {
    const group = await groupService.joinGroup(req.params.id, req.user.id);

    res.status(200).json({
        success: true,
        status: 'success',
        data: group,
        message: 'Joined group successfully'
    });
});

/**
 * @desc    Create a new group
 * @route   POST /api/groups
 */
exports.createGroup = catchAsync(async (req, res, next) => {
    const group = await groupService.createGroup(req.body, req.user.id);

    res.status(201).json({
        success: true,
        status: 'success',
        data: group
    });
});

exports.getMyGroups = catchAsync(async (req, res, next) => {
    const groups = await groupService.getMyGroups(req.user.id);

    res.status(200).json({
        success: true,
        status: 'success',
        data: groups
    });
});

/**
 * @desc    Update group info (admin only)
 * @route   PUT /api/groups/:id
 */
exports.updateGroup = catchAsync(async (req, res, next) => {
    const group = await groupService.updateGroupInfo(req.params.id, req.body, req.user.id);
    res.status(200).json({ success: true, status: 'success', data: group });
});

/**
 * @desc    Add members to a group (admin only)
 * @route   POST /api/groups/:id/members
 */
exports.addMembers = catchAsync(async (req, res, next) => {
    const { memberIds } = req.body;
    const group = await groupService.addMembers(req.params.id, memberIds, req.user.id);
    res.status(200).json({ success: true, status: 'success', data: group });
});

/**
 * @desc    Remove a member from a group (admin only)
 * @route   DELETE /api/groups/:id/members/:userId
 */
exports.removeMember = catchAsync(async (req, res, next) => {
    const group = await groupService.removeMember(req.params.id, req.params.userId, req.user.id);
    res.status(200).json({ success: true, status: 'success', data: group, message: 'Member removed' });
});

/**
 * @desc    Promote or demote a member (admin only)
 * @route   PATCH /api/groups/:id/members/:userId/role
 */
exports.updateMemberRole = catchAsync(async (req, res, next) => {
    const group = await groupService.updateMemberRole(req.params.id, req.params.userId, req.body.role, req.user.id);
    res.status(200).json({ success: true, status: 'success', data: group });
});

/**
 * @desc    Handle a pending join request (accept/decline)
 * @route   POST /api/groups/:id/requests/:userId
 */
exports.handleJoinRequest = catchAsync(async (req, res, next) => {
    const group = await groupService.handleJoinRequest(req.params.id, req.params.userId, req.body.action, req.user.id);
    res.status(200).json({ success: true, status: 'success', data: group });
});
