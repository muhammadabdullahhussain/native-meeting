const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a group name'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a group description']
    },
    emoji: {
        type: String,
        default: '👥'
    },
    interest: {
        type: String,
        required: [true, 'Group must be associated with an interest']
    },
    tags: [String],
    color: [String], // For UI gradients
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    pendingRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    maxMembers: {
        type: Number,
        default: 50
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    isPremium: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for interest-based searching
groupSchema.index({ interest: 1 });
groupSchema.index({ tags: 1 });

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
