const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/appError");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Register a new user
 */
exports.registerUser = async (userData) => {
  const {
    name,
    email,
    password,
    bio,
    city,
    jobTitle,
    interests,
    interestCategories,
    lookingFor,
    avatar,
    banner,
    referralCode: usedReferralCode,
    gender,
    birthday,
  } = userData;

  // Handle referral link
  let referrerId = null;
  let referrer = null;
  if (usedReferralCode) {
    referrer = await User.findOne({ referralCode: usedReferralCode });
    if (referrer) {
      referrerId = referrer._id;
    }
  }

  // Generate unique username if not provided
  let username = userData.username;
  if (!username) {
    username = email.split("@")[0];
  }

  // Ensure username is unique
  let uniqueUsername = username;
  let counter = 1;
  while (await User.findOne({ username: uniqueUsername })) {
    uniqueUsername = `${username}${counter}`;
    counter++;
  }

  const user = await User.create({
    name,
    email,
    password,
    bio,
    city,
    jobTitle,
    company: userData.company,
    username: uniqueUsername,
    interests,
    interestCategories,
    lookingFor,
    avatar,
    banner,
    gender,
    birthday,
    referralCode: generateReferralCode(),
    referredBy: referrerId,
  });

  // Update Referrer after successful user creation
  if (referrer) {
    referrer.referralCount += 1;
    referrer.referralLog.push({ user: user._id });

    // Grant 1 Group Pass for every 3 referrals
    if (referrer.referralCount % 3 === 0) {
      referrer.unlockedGroupPasses = (referrer.unlockedGroupPasses || 0) + 1;
    }

    await referrer.save();

    // Notify Referrer
    try {
      const notificationService = require("./notificationService");
      const invitesNeeded = 3 - (referrer.referralCount % 3);
      const passMsg =
        invitesNeeded === 0
          ? "You've earned a new Group Pass! 🎟️"
          : `${invitesNeeded} more invites for your next Group Pass! 🚀`;

      await notificationService.createNotification(
        referrer._id,
        "referral_joined",
        `Your friend ${user.name} joined! ${passMsg}`,
        { referredUserId: user._id },
        user._id,
        { screen: "Invite" }, // Example metadata
      );
    } catch (err) {
      console.error("Referral notification failed:", err.message);
    }
  }

  const token = signToken(user._id);
  return { user, token };
};

/**
 * Login user
 */
exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password, user.password))) {
    return null;
  }

  // Auto-generate referral code for legacy users who didn't get one during registration
  if (!user.referralCode) {
    user.referralCode = generateReferralCode();
    await user.save();
  }

  const token = signToken(user._id);
  return { user, token };
};

/**
 * Update user profile
 */
exports.updateUserProfile = async (userId, updates) => {
  const user = await User.findById(userId).select("isPremium");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const allowedFields = new Set([
    "name",
    "username",
    "avatar",
    "banner",
    "bio",
    "city",
    "jobTitle",
    "company",
    "interests",
    "interestCategories",
    "lookingFor",
    "availability",
    "gender",
    "birthday",
    "languages",
    "location",
    "expoPushToken",
  ]);

  const sanitizedUpdates = {};
  Object.keys(updates || {}).forEach((key) => {
    if (allowedFields.has(key)) {
      sanitizedUpdates[key] = updates[key];
    }
  });

  if (
    Array.isArray(sanitizedUpdates.interests) &&
    !user.isPremium &&
    sanitizedUpdates.interests.length > 30
  ) {
    throw new AppError(
      "Free users can only select up to 30 interests. Upgrade to Premium for unlimited interests!",
      400,
    );
  }

  if (typeof sanitizedUpdates.username === "string") {
    sanitizedUpdates.username = sanitizedUpdates.username.trim().toLowerCase();
  }

  if (typeof sanitizedUpdates.name === "string") {
    sanitizedUpdates.name = sanitizedUpdates.name.trim();
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: sanitizedUpdates },
    { new: true, runValidators: true },
  );

  return updatedUser;
};
