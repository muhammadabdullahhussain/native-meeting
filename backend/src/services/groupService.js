const Group = require('../models/Group');
const notificationService = require('./notificationService');
const AppError = require('../utils/appError');

/**
 * Create a new group
 */
exports.createGroup = async (groupData, userId) => {
    // 1. Guard: Only Premium users can create groups
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user.isPremium) {
        throw new AppError('Only Premium users can create groups. Upgrade now!', 403);
    }

    // Validate members if provided
    const memberItems = [{ user: userId, role: 'admin' }];
    if (groupData.members && Array.isArray(groupData.members)) {
        groupData.members.forEach(memberId => {
            if (memberId !== userId) {
                memberItems.push({ user: memberId, role: 'member' });
            }
        });
    }

    const group = await Group.create({
        ...groupData,
        creator: userId,
        members: memberItems
    });
    return group;
};

/**
 * Get all public groups
 */
exports.getAllGroups = async (limit = 20) => {
    const groups = await Group.find({ isPrivate: false })
        .populate('creator', 'name avatar isPremium photos')
        .limit(limit);

    return groups;
};

/**
 * Join a group
 */
exports.joinGroup = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new AppError('Group not found', 404);
    }

    // Check if user is already a member
    const isMember = group.members.some(m => m.user?.toString() === userId?.toString());
    if (isMember) {
        throw new AppError('You are already a member of this group', 400);
    }

    // 2. Guard: Free users need a Group Pass to join
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user.isPremium) {
        const myGroups = await Group.countDocuments({ 'members.user': userId });
        if (myGroups >= 7) {
            if (!user.unlockedGroupPasses || user.unlockedGroupPasses <= 0) {
                throw new AppError('Invite 3 friends to unlock more Group Passes to join!', 403);
            }

            // Consume 1 Group Pass
            user.unlockedGroupPasses -= 1;
            await user.save();
        }
    }

    // Check capacity
    if (group.members.length >= group.maxMembers) {
        throw new AppError('Group is full', 400);
    }

    // Check if already requested
    const hasRequested = group.pendingRequests?.some(id => id?.toString() === userId?.toString());
    if (hasRequested) {
        throw new AppError('You have already requested to join this group', 400);
    }

    group.pendingRequests.push(userId);
    await group.save();

    // 4. Notify Creator (Admin)
    await notificationService.createNotification(
        group.creator,
        'group_request',
        `wants to join your group "${group.name}"`,
        { groupId: group._id },
        userId,
        { groupId: group._id, screen: 'GroupDetails' }
    );

    return group;
};

/**
 * Get groups user is a member of
 */
exports.getMyGroups = async (userId) => {
    const groups = await Group.find({ 'members.user': userId })
        .populate('creator', 'name avatar')
        .populate('members.user', 'name avatar');
    return groups;
};

/**
 * Update group metadata (admin only)
 */
exports.updateGroupInfo = async (groupId, updateData, requesterId) => {
    const group = await Group.findById(groupId);
    if (!group) throw new AppError('Group not found', 404);

    const requester = group.members.find(m => m.user.toString() === requesterId.toString());
    if (!requester || requester.role !== 'admin') {
        throw new AppError('Only admins can update group info', 403);
    }

    const allowed = ['name', 'description', 'emoji'];
    allowed.forEach(field => {
        if (updateData[field] !== undefined) group[field] = updateData[field];
    });

    await group.save();

    // Emit real-time update to all members
    try {
        const io = require('../config/socket').getIO();
        io.to(`group_${groupId}`).emit('group_updated', {
            groupId,
            name: group.name,
            description: group.description,
            emoji: group.emoji
        });
    } catch (err) {
        console.warn('Socket group_updated emission failed:', err.message);
    }

    return group.populate('members.user', 'name avatar');
};

/**
 * Add members to a group (admin only)
 */
exports.addMembers = async (groupId, memberIds, requesterId) => {
    const group = await Group.findById(groupId);
    if (!group) throw new AppError('Group not found', 404);

    const requester = group.members.find(m => m.user?.toString() === requesterId?.toString());
    if (!requester || requester.role !== 'admin') {
        throw new AppError('Only admins can add members', 403);
    }

    if (group.members.length + memberIds.length > group.maxMembers) {
        throw new AppError(`Cannot add members. Maximum limit is ${group.maxMembers}`, 400);
    }

    const existingIds = group.members.map(m => m.user?.toString());
    const toAdd = memberIds.filter(id => !existingIds.includes(id?.toString()));

    if (toAdd.length === 0) throw new AppError('All selected users are already members', 400);

    toAdd.forEach(uid => group.members.push({ user: uid, role: 'member' }));
    await group.save();

    const populated = await Group.findById(groupId)
        .populate('creator', 'name avatar')
        .populate('members.user', 'name avatar');

    try {
        const io = require('../config/socket').getIO();
        io.to(`group_${groupId}`).emit('group_members_updated', { groupId, members: populated.members });
    } catch (err) {
        console.warn('Socket members update failed:', err.message);
    }

    return populated;
};

/**
 * Remove a member from a group (admin only)
 */
exports.removeMember = async (groupId, targetUserId, requesterId) => {
    const group = await Group.findById(groupId);
    if (!group) throw new AppError('Group not found', 404);

    const requester = group.members.find(m => m.user?.toString() === requesterId?.toString());
    if (!requester || requester.role !== 'admin') {
        throw new AppError('Only admins can remove members', 403);
    }

    if (targetUserId?.toString() === group.creator?.toString()) {
        throw new AppError('Cannot remove the group creator', 400);
    }

    group.members = group.members.filter(m => m.user?.toString() !== targetUserId?.toString());
    await group.save();

    try {
        const io = require('../config/socket').getIO();
        io.to(`group_${groupId}`).emit('group_member_removed', { groupId, userId: targetUserId });
    } catch (err) {
        console.warn('Socket member removal failed:', err.message);
    }

    return group;
};

/**
 * Update a member's role (promote to admin or demote to member)
 */
exports.updateMemberRole = async (groupId, targetUserId, role, requesterId) => {
    if (!['admin', 'member'].includes(role)) throw new AppError('Invalid role', 400);

    const group = await Group.findById(groupId);
    if (!group) throw new AppError('Group not found', 404);

    const requester = group.members.find(m => m.user?.toString() === requesterId?.toString());
    if (!requester || requester.role !== 'admin') {
        throw new AppError('Only admins can change roles', 403);
    }

    const target = group.members.find(m => m.user?.toString() === targetUserId?.toString());
    if (!target) throw new AppError('User is not a member of this group', 404);

    target.role = role;
    await group.save();

    try {
        const io = require('../config/socket').getIO();
        io.to(`group_${groupId}`).emit('group_role_changed', { groupId, userId: targetUserId, role });
    } catch (err) {
        console.warn('Socket role change failed:', err.message);
    }

    return group;
    return group;
};

/**
 * Handle a pending join request (accept or decline)
 */
exports.handleJoinRequest = async (groupId, targetUserId, action, requesterId) => {
    if (!['accept', 'decline'].includes(action)) throw new AppError('Invalid action', 400);

    const group = await Group.findById(groupId);
    if (!group) throw new AppError('Group not found', 404);

    const requester = group.members.find(m => m.user?.toString() === requesterId?.toString());
    if (!requester || requester.role !== 'admin') {
        throw new AppError('Only admins can handle join requests', 403);
    }

    const pendingIndex = group.pendingRequests.findIndex(id => id?.toString() === targetUserId?.toString());
    if (pendingIndex === -1) throw new AppError('User has no pending request', 404);

    // Remove from pending list
    group.pendingRequests.splice(pendingIndex, 1);

    if (action === 'accept') {
        if (group.members.length >= group.maxMembers) throw new AppError('Group is full', 400);
        // Ensure not already a member
        if (!group.members.some(m => m.user?.toString() === targetUserId?.toString())) {
            group.members.push({ user: targetUserId, role: 'member' });
        }
    }

    await group.save();

    const populatedGroup = await group.populate('members.user pendingRequests', 'name email avatar isOnline socketId');

    if (action === 'accept') {
        try {
            const io = require('../config/socket').getIO();
            io.to(`group_${groupId}`).emit('group_members_updated', {
                groupId,
                members: populatedGroup.members
            });
        } catch (err) {
            console.warn('Socket member add failed:', err.message);
        }
    }

    return populatedGroup;
};
