const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Requester ID is required']
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Receiver ID is required']
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'blocked'],
        default: 'pending'
    },
    isPriority: {
        type: Boolean,
        default: false // Set to true if requester is a Premium user
    },
    message: {
        type: String,
        trim: true,
        maxlength: [200, 'Request message cannot exceed 200 characters']
    }
}, {
    timestamps: true
});

// Ensure a user cannot send multiple requests to the same person
connectionSchema.index({ requester: 1, receiver: 1 }, { unique: true });

// Prevent self-connection at the schema level if possible (handled in controller usually)
// Adding a virtual to check if it's mutual
connectionSchema.virtual('isMutual').get(function () {
    return this.status === 'accepted';
});

const Connection = mongoose.model('Connection', connectionSchema);

module.exports = Connection;
