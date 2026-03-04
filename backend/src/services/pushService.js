const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

const expo = new Expo();

/**
 * Send a push notification to a specific user
 * @param {string} userId - Recipient User ID
 * @param {string} title - Notification Title
 * @param {string} body - Notification Body
 * @param {object} data - Extra data for deep linking
 */
exports.sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        const user = await User.findById(userId).select('expoPushToken');

        if (!user || !user.expoPushToken) {
            return; // User doesn't have a push token
        }

        if (!Expo.isExpoPushToken(user.expoPushToken)) {
            console.error(`Push token ${user.expoPushToken} is not a valid Expo push token`);
            return;
        }

        const message = {
            to: user.expoPushToken,
            sound: 'default',
            title,
            body,
            data,
            priority: 'high',
            channelId: 'default',
        };

        const chunks = expo.chunkPushNotifications([message]);
        const tickets = [];

        for (let chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending push chunk:', error);
            }
        }

        // tickets contain receipt IDs if we wanted to verify delivery later
        return tickets;
    } catch (err) {
        console.error('Push Service Error:', err.message);
    }
};
