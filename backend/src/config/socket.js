const socketIO = require('socket.io');

let io;

const init = (server) => {
    io = socketIO(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        let currentUserId = null;
        console.log(`🔌 New client connected: ${socket.id}`);

        // Join a private room and set online
        socket.on('join', (userId) => {
            if (userId) {
                currentUserId = userId;
                socket.join(userId);
                console.log(`👤 User ${userId} joined their private room.`);

                // Set user online globally
                const User = require('../models/User');
                User.findByIdAndUpdate(userId, { onlineStatus: true }).catch(e => console.error(e));

                // Broadcast presence to all (simple) or friends (advanced)
                io.emit('user_presence', { userId, status: 'online' });
            }
        });

        // Query user status
        socket.on('get_user_status', async (userId, callback) => {
            if (!userId) return;
            try {
                const User = require('../models/User');
                const user = await User.findById(userId);
                if (callback) callback(user?.onlineStatus ? 'online' : 'offline');
            } catch (err) {
                if (callback) callback('offline');
            }
        });

        // Join group rooms
        socket.on('join_group', (groupId) => {
            if (groupId) {
                socket.join(`group_${groupId}`);
                console.log(`👥 Joined group room: group_${groupId}`);
            }
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
            // data: { receiverId, isTyping, groupId, senderId }
            if (data.groupId) {
                socket.to(`group_${data.groupId}`).emit('typing', data);
            } else if (data.receiverId) {
                io.to(data.receiverId).emit('typing', data);
            }
        });

        // Handle read receipts
        socket.on('message_read', async (data) => {
            // data: { messageIds, senderId, readerId }
            try {
                const Message = require('../models/Message');
                await Message.updateMany(
                    { _id: { $in: data.messageIds } },
                    { isRead: true, readAt: new Date() }
                );
                // Notify the sender that their messages were read
                io.to(data.senderId).emit('messages_marked_read', {
                    messageIds: data.messageIds,
                    readerId: data.readerId
                });
            } catch (err) {
                console.error('Error marking messages as read:', err);
            }
        });

        socket.on('disconnect', () => {
            if (currentUserId) {
                const User = require('../models/User');
                User.findByIdAndUpdate(currentUserId, { onlineStatus: false, lastSeen: new Date() }).catch(e => console.error(e));
                io.emit('user_presence', { userId: currentUserId, status: 'offline' });
            }
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { init, getIO };
