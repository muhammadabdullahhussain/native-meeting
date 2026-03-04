const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: [
            'connect_request',
            'connected',
            'message',
            'interest_match',
            'nearby',
            'group_request',
            'group_accepted',
            'referral_joined',
            'mention'
        ],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: Object // Flexible field for IDs or extra info
    },
    metadata: {
        type: Object,
        default: {} // Structured metadata for deep linking
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indices
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
