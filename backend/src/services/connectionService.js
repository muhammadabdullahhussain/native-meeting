const Connection = require('../models/Connection');
const User = require('../models/User');
const notificationService = require('./notificationService');
const AppError = require('../utils/appError');
const Report = require('../models/Report');

/**
 * Service to handle connection request logic
 */
exports.createConnectionRequest = async (requesterId, receiverId, message) => {
    // 1. Basic Validations
    if (receiverId === requesterId) {
        throw new AppError('You cannot send a connection request to yourself', 400);
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
        throw new AppError('User not found', 404);
    }

    // 2. Check if already connected or request pending
    const existingConnection = await Connection.findOne({
        $or: [
            { requester: requesterId, receiver: receiverId },
            { requester: receiverId, receiver: requesterId }
        ]
    });

    if (existingConnection) {
        throw new AppError('A connection request already exists or you are already connected', 400);
    }

    // 3. Handle Daily Limits for Free Users
    const requester = await User.findById(requesterId);

    // Reset limit if 24 hours have passed
    const now = new Date();
    const lastReset = new Date(requester.lastConnectionRequestReset || 0);
    const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
        requester.dailyConnectionRequestsSent = 0;
        requester.lastConnectionRequestReset = now;
    }

    // Check limit
    if (!requester.isPremium && requester.dailyConnectionRequestsSent >= 10) {
        throw new AppError('Daily connection limit reached. Upgrade to Premium for unlimited requests!', 403);
    }

    // 4. Create the connection
    const connection = await Connection.create({
        requester: requesterId,
        receiver: receiverId,
        isPriority: requester.isPremium,
        message: message || ''
    });

    // 5. Update requester limit
    requester.dailyConnectionRequestsSent += 1;
    await requester.save({ validateBeforeSave: false });

    // 6. Notify Receiver
    await notificationService.createNotification(
        receiverId,
        'connect_request',
        `${requester.name} sent you a connection request`,
        { connectionId: connection._id },
        requesterId,
        { connectionId: connection._id, screen: 'Connections' }
    );

    return connection;
};

/**
 * Service to fetch pending requests
 */
exports.getPendingRequestsForUser = async (userId) => {
    return await Connection.find({
        $or: [
            { receiver: userId },
            { requester: userId }
        ],
        status: 'pending'
    })
        .populate('requester', 'name avatar jobTitle company interests interestCategories photos isVerified isPremium')
        .populate('receiver', 'name avatar jobTitle company interests interestCategories photos isVerified isPremium')
        .sort('-isPriority -createdAt');
};

/**
 * Service to accept or decline a request
 */
exports.resolveConnectionRequest = async (requestId, userId, status) => {
    if (!['accepted', 'rejected'].includes(status)) {
        throw new AppError('Invalid status update', 400);
    }

    const connection = await Connection.findOne({
        _id: requestId,
        receiver: userId,
        status: 'pending'
    });

    if (!connection) {
        throw new AppError('Connection request not found or already resolved', 404);
    }

    connection.status = status;
    await connection.save();

    if (status === 'accepted') {
        // Increment connection count for both users
        await Promise.all([
            User.findByIdAndUpdate(connection.requester, { $inc: { connectionCount: 1 } }),
            User.findByIdAndUpdate(connection.receiver, { $inc: { connectionCount: 1 } })
        ]);

        // Notify Requester that their request was accepted
        await notificationService.createNotification(
            connection.requester,
            'connected',
            'Your connection request has been accepted!',
            { connectionId: connection._id },
            userId,
            { connectionId: connection._id, screen: 'Connections' }
        );
    }

    return connection;
};

/**
 * Service to fetch all accepted connections (Friends list)
 */
exports.getAcceptedConnections = async (userId) => {
    const Message = require('../models/Message');

    const connections = await Connection.find({
        $or: [
            { requester: userId, status: 'accepted' },
            { receiver: userId, status: 'accepted' }
        ]
    })
        .populate('requester', 'name avatar jobTitle company interests onlineStatus lastSeen')
        .populate('receiver', 'name avatar jobTitle company interests onlineStatus lastSeen')
        .sort('-updatedAt');

    // Process to return the "other" user only + lastMessage
    const results = await Promise.all(connections.map(async (conn) => {
        const otherUser = conn.requester._id.toString() === userId.toString()
            ? conn.receiver
            : conn.requester;

        // Fetch last message for this conversation
        const lastMsg = await Message.findOne({
            $or: [
                { sender: userId, receiver: otherUser._id },
                { sender: otherUser._id, receiver: userId }
            ],
            group: null
        }).sort('-createdAt').select('text createdAt isRead sender');

        // Count unread messages sent TO the current user
        const unreadCount = await Message.countDocuments({
            sender: otherUser._id,
            receiver: userId,
            isRead: false,
            group: null
        });

        return {
            connectionId: conn._id,
            user: otherUser,
            status: conn.status,
            connectedAt: conn.updatedAt,
            lastMessage: lastMsg || null,
            unreadCount
        };
    }));

    // Re-sort by lastMessage time (most recent conversation first)
    return results.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.connectedAt;
        const bTime = b.lastMessage?.createdAt || b.connectedAt;
        return new Date(bTime) - new Date(aTime);
    });
};

/**
 * Service to check connection status between two users
 */
exports.getConnectionStatus = async (userA, userB) => {
    const connection = await Connection.findOne({
        $or: [
            { requester: userA, receiver: userB },
            { requester: userB, receiver: userA }
        ]
    });

    if (!connection) return { status: 'none' };

    // Determine if the current user (userA) is the requester or receiver
    const isRequester = connection.requester.toString() === userA.toString();

    return {
        status: connection.status,
        isRequester,
        requestId: connection._id
    };
};

/**
 * Service to block a user
 */
exports.blockUser = async (blockerId, blockedId) => {
    if (blockerId.toString() === blockedId.toString()) {
        throw new AppError('You cannot block yourself', 400);
    }

    // Upsert a connection with 'blocked' status
    // We update any existing connection to 'blocked'
    let connection = await Connection.findOne({
        $or: [
            { requester: blockerId, receiver: blockedId },
            { requester: blockedId, receiver: blockerId }
        ]
    });

    if (connection) {
        connection.status = 'blocked';
        // Ensure the person doing the blocking is set as requester for clarity if needed, 
        // but status 'blocked' generally applies both ways in our discover logic.
        await connection.save();
    } else {
        connection = await Connection.create({
            requester: blockerId,
            receiver: blockedId,
            status: 'blocked'
        });
    }

    return connection;
};

/**
 * Service to report a user
 */
exports.reportUser = async (reporterId, reportedId, reason) => {
    const report = await Report.create({
        reporter: reporterId,
        reportedUser: reportedId,
        reason
    });

    // Also block the user automatically when reported (best practice)
    await exports.blockUser(reporterId, reportedId);

    return report;
};

/**
 * Service to unblock a user
 */
exports.unblockUser = async (blockerId, blockedId) => {
    const connection = await Connection.findOneAndDelete({
        requester: blockerId,
        receiver: blockedId,
        status: 'blocked'
    });

    if (!connection) {
        throw new AppError('Block relation not found', 404);
    }

    return { success: true, message: 'User unblocked' };
};

/**
 * Service to get IDs of users current user has blocked
 */
exports.getBlockedUserIds = async (userId) => {
    const connections = await Connection.find({
        requester: userId,
        status: 'blocked'
    }).select('receiver');

    return connections.map(c => c.receiver.toString());
};
