const Notification = require('../models/Notification');
const socketHandle = require('../config/socket');

/**
 * Create a new notification for a user
 */
exports.createNotification = async (recipientId, type, message, data = {}, senderId = null, metadata = {}) => {
    const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        message,
        data,
        metadata
    });

    // Emit via Socket.io for Real-time delivery
    try {
        const io = socketHandle.getIO();
        io.to(recipientId.toString()).emit('notification', notification);
    } catch (err) {
        console.warn('Socket emission failed:', err.message);
    }

    // Send Push Notification
    try {
        const pushService = require('./pushService');
        const title = getPushTitle(type);
        await pushService.sendPushNotification(recipientId, title, message, { ...data, ...metadata, type });
    } catch (err) {
        console.warn('Push notification delivery failed:', err.message);
    }

    return notification;
};

/**
 * Helper to get clean push titles based on type
 */
const getPushTitle = (type) => {
    switch (type) {
        case 'connect_request': return 'New Connection Request 🤝';
        case 'connected': return 'New Connection! ✨';
        case 'message': return 'New Message 💬';
        case 'interest_match': return 'It\'s a Match! 🔥';
        case 'nearby': return 'Someone Nearby! 📍';
        case 'group_request': return 'Group Join Request 👥';
        case 'group_accepted': return 'Group Request Accepted ✅';
        case 'referral_joined': return 'Referral Success! 🎁';
        case 'mention': return 'You were mentioned! 🏷️';
        default: return 'New Notification';
    }
};

/**
 * Get all notifications for a user (Paginated)
 */
exports.getNotificationsForUser = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
        Notification.find({ recipient: userId })
            .populate('sender', 'name avatar')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit),
        Notification.countDocuments({ recipient: userId })
    ]);

    return {
        notifications,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
    };
};

/**
 * Mark notifications as read
 */
exports.markAsRead = async (userId, notificationId = null) => {
    const query = { recipient: userId };
    if (notificationId) {
        query._id = notificationId;
    }

    return await Notification.updateMany(query, { isRead: true });
};

/**
 * Delete a specific notification
 */
exports.deleteNotification = async (userId, notificationId) => {
    return await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
};

/**
 * Clear all notifications for a user
 */
exports.clearAllNotifications = async (userId) => {
    return await Notification.deleteMany({ recipient: userId });
};

/**
 * Get count of unread notifications (for badge)
 */
exports.getUnreadCount = async (userId) => {
    return await Notification.countDocuments({ recipient: userId, isRead: false });
};
