const Message = require('../models/Message');
const Connection = require('../models/Connection');
const socketHandle = require('../config/socket');
const AppError = require('../utils/appError');

/**
 * Send a moving message to another user or group
 */
exports.sendMessage = async (senderId, body) => {
    const { receiverId, groupId, text } = body;

    // 1. Validation: 1-on-1 or Group
    if (!receiverId && !groupId) {
        throw new AppError('Message must have a recipient or a group', 400);
    }

    // 2. If 1-on-1, check if they are friends
    if (receiverId) {
        const isConnected = await Connection.findOne({
            status: 'accepted',
            $or: [
                { requester: senderId, receiver: receiverId },
                { requester: receiverId, receiver: senderId }
            ]
        });

        if (!isConnected) {
            throw new AppError('You can only message users you are connected with', 403);
        }
    }

    // 2.5 If Group, check if they are a member
    if (groupId) {
        const Group = require('../models/Group');
        const group = await Group.findOne({
            _id: groupId,
            'members.user': senderId
        });

        if (!group) {
            throw new AppError('You must be a member of the group to send messages', 403);
        }
    }

    // 3. Create message
    const messageData = {
        sender: senderId,
        receiver: receiverId,
        group: groupId,
        text
    };
    const message = await Message.create(messageData);

    // Emit via Socket.io for Real-time delivery
    try {
        const io = socketHandle.getIO();
        if (groupId) {
            // Group message - populate sender info before emitting
            const populatedMsg = await Message.findById(message._id).populate('sender', 'name avatar');
            io.to(`group_${groupId}`).emit('new_group_message', populatedMsg || message);
        } else {
            // Private message - emit to private room
            io.to(receiverId.toString()).emit('new_message', message);
        }
    } catch (err) {
        console.warn('Socket emission failed:', err.message);
    }

    return message;
};

/**
 * Get 1-on-1 messages between two users
 */
exports.getChatMessages = async (user1, user2) => {
    return await Message.find({
        $or: [
            { sender: user1, receiver: user2 },
            { sender: user2, receiver: user1 }
        ],
        group: null
    })
        .sort('createdAt')
        .limit(100);
};

/**
 * Get group messages
 */
exports.getGroupMessages = async (groupId) => {
    return await Message.find({ group: groupId })
        .populate('sender', 'name avatar')
        .populate('reactions.user', 'name')
        .sort('createdAt')
        .limit(100);
};

/**
 * Toggle a reaction on a message (idempotent: add if not present, remove if already reacted)
 */
exports.toggleReaction = async (messageId, userId, emoji) => {
    const message = await Message.findById(messageId);
    if (!message) throw new AppError('Message not found', 404);

    const existingIdx = message.reactions.findIndex(
        r => r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingIdx > -1) {
        // Remove the reaction (toggle off)
        message.reactions.splice(existingIdx, 1);
    } else {
        // Add the reaction
        message.reactions.push({ user: userId, emoji });
    }

    await message.save();

    // Emit to group members in real-time
    try {
        const io = socketHandle.getIO();
        if (message.group) {
            io.to(`group_${message.group}`).emit('message_reaction_update', {
                messageId: message._id,
                reactions: message.reactions
            });
        }
    } catch (err) {
        console.warn('Socket reaction emission failed:', err.message);
    }

    return message;
};

/**
 * Mark a message as delivered to a specific user
 */
exports.markMessageAsDelivered = async (messageId, userId) => {
    const message = await Message.findById(messageId);
    if (!message) throw new AppError('Message not found', 404);

    // Prevent adding if already there
    const alreadyDelivered = message.deliveredTo?.some(d => d.user?.toString() === userId?.toString());

    if (!alreadyDelivered) {
        message.deliveredTo.push({ user: userId });
        await message.save();

        // Emit socket event
        try {
            const io = socketHandle.getIO();
            if (message.group) {
                io.to(`group_${message.group}`).emit('message_delivered', { messageId, userId });
            } else if (message.sender) {
                io.to(message.sender.toString()).emit('message_delivered', { messageId, userId });
            }
        } catch (err) {
            console.warn('Socket delivered emission failed:', err.message);
        }
    }

    return message;
};

/**
 * Mark a message as read by a specific user
 */
exports.markMessageAsRead = async (messageId, userId) => {
    const message = await Message.findById(messageId);
    if (!message) throw new AppError('Message not found', 404);

    // Prevent adding if already there
    const alreadyRead = message.readBy?.some(r => r.user?.toString() === userId?.toString());

    if (!alreadyRead) {
        message.readBy.push({ user: userId });
        // Standardize legacy isRead for 1-on-1s
        if (!message.group) message.isRead = true;

        await message.save();

        // Emit socket event
        try {
            const io = socketHandle.getIO();
            if (message.group) {
                io.to(`group_${message.group}`).emit('message_read', { messageId, userId });
            } else if (message.sender) {
                io.to(message.sender.toString()).emit('message_read', { messageId, userId });
            }
        } catch (err) {
            console.warn('Socket read emission failed:', err.message);
        }
    }

    return message;
};
