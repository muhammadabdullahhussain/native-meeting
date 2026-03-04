const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema({
    category: {
        type: String,
        required: [true, 'Interest category is required'],
        trim: true,
        unique: true
    },
    subcategories: [{
        name: {
            type: String,
            required: [true, 'Subcategory name is required'],
            trim: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Null means it's an official system-provided subcategory
            default: null
        },
        isApproved: {
            type: Boolean,
            default: true // Custom tags from Premium users can be auto-approved or require moderation later
        }
    }]
}, {
    timestamps: true
});

// Ensure a subcategory is unique within its category
interestSchema.index({ category: 1, 'subcategories.name': 1 }, { unique: true });

const Interest = mongoose.model('Interest', interestSchema);

module.exports = Interest;
