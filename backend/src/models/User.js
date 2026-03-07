const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: function () {
            // Password is only required if no social login is provided
            return !this.googleId && !this.facebookId;
        },
        minlength: 6,
        select: false // Don't return password by default
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    facebookId: {
        type: String,
        unique: true,
        sparse: true
    },
    avatar: {
        type: String,
        default: 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&rounded=true&bold=true'
    },
    banner: {
        type: String,
        default: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1200' // Beautiful abstract gradient
    },
    photos: [String],
    username: {
        type: String,
        unique: true,
        sparse: true, // Allow multiple nulls initially
        trim: true,
        lowercase: true
    },
    bio: String,
    city: String,
    jobTitle: String,
    company: String,
    interests: {
        type: [String],
        validate: {
            validator: function (v) {
                // If not premium, they can only have up to 30 interests
                if (!this.isPremium && v.length > 30) {
                    return false;
                }
                return true;
            },
            message: 'Free users can only select up to 30 interests. Upgrade to Premium for unlimited interests!'
        }
    },
    interestCategories: [String],
    lookingFor: [String],
    availability: [String],
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'],
        default: 'Prefer not to say'
    },
    birthday: Date,
    age: Number,
    languages: [String],
    isPremium: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    onlineStatus: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    referralCode: {
        type: String,
        unique: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    referralCount: {
        type: Number,
        default: 0
    },
    referralLog: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now }
    }],
    unlockedPerks: {
        extraGroups: { type: Number, default: 0 },
        customTags: { type: Boolean, default: false }
    },
    conversationCount: {
        type: Number,
        default: 0
    },
    activeChatsCount: {
        type: Number,
        default: 0
    },
    unlockedGroupPasses: {
        type: Number,
        default: 0
    },
    responseRate: {
        type: Number,
        default: null
    },
    dailyConnectionRequestsSent: {
        type: Number,
        default: 0
    },
    lastConnectionRequestReset: {
        type: Date,
        default: Date.now
    },
    connectionCount: {
        type: Number,
        default: 0
    },
    expoPushToken: {
        type: String,
        default: null
    },
    settings: {
        discovery: {
            maxDistance: { type: Number, default: 25 },
            showMe: { type: Boolean, default: true },
            blurLocation: { type: Boolean, default: false },
            minAge: { type: Number, default: 18 },
            maxAge: { type: Number, default: 60 },
        },
        notifications: {
            push: { type: Boolean, default: true },
            email: { type: Boolean, default: false },
            messages: { type: Boolean, default: true },
            connections: { type: Boolean, default: true },
        },
        privacy: {
            showOnlineStatus: { type: Boolean, default: true },
        }
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            ret.isOnline = ret.onlineStatus;
            delete ret._id;
            delete ret.__v;
            delete ret.password;
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            ret.isOnline = ret.onlineStatus;
            return ret;
        }
    }
});

// Index for proximity searching
userSchema.index({ location: '2dsphere' });

// Hash password and calculate age before saving
userSchema.pre('save', async function () {
    // 1. Hash password if modified
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }

    // 2. Calculate age if birthday is modified
    if (this.isModified('birthday') && this.birthday) {
        const today = new Date();
        const birthDate = new Date(this.birthday);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        this.age = age;
    }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
