const userService = require("../../services/userService");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");

/**
 * @desc    Find users nearby with interest matching
 * @route   GET /api/users/discover
 */
exports.getDiscover = catchAsync(async (req, res, next) => {
  let {
    maxDistance,
    isOnline,
    interest,
    interests,
    gender,
    lookingFor,
    minAge,
    maxAge,
    isVerified,
    availability,
    languages,
    isWorldwide,
  } = req.query;
  const currentUser = req.user;

  // If not provided in query, fallback to user's saved reference, or default to 50
  if (!maxDistance) {
    maxDistance = currentUser.settings?.discovery?.maxDistance || 50;
  }

  const finalUsers = await userService.discoverNearbyUsers(
    currentUser,
    maxDistance,
    {
      isOnline: isOnline === "true",
      isVerified: isVerified === "true",
      interest,
      interests: interests ? interests.split(",") : undefined,
      gender,
      lookingFor,
      minAge,
      maxAge,
      availability: availability ? availability.split(",") : undefined,
      languages: languages ? languages.split(",") : undefined,
      isWorldwide: isWorldwide === "true",
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      sortBy: req.query.sortBy || "distance",
    },
  );

  res.status(200).json({
    success: true,
    status: "success",
    results: finalUsers.length,
    data: finalUsers,
    message:
      finalUsers.length === 0 &&
        (!currentUser.location || !currentUser.location.coordinates)
        ? "Please set your location to discover people nearby"
        : undefined,
  });
});

/**
 * @desc    Get a specific user profile
 * @route   GET /api/users/:id
 */
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.params.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    status: "success",
    data: user,
  });
});

/**
 * @desc    Get public profile by username for web sharing
 * @route   GET /api/users/profile/:username
 * @access  Public
 */
exports.getPublicProfileByUsername = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const mongoose = require('mongoose');

  let query = { username: username.toLowerCase() };
  if (mongoose.Types.ObjectId.isValid(username)) {
    query = { $or: [{ username: username.toLowerCase() }, { _id: username }] };
  }

  const user = await require('../../models/User').findOne(query)
    .select('name username avatar banner bio city jobTitle company interests isPremium lookingFor isVerified onlineStatus');

  if (!user) {
    return next(new AppError("User not found", 404));
  }


  res.status(200).json({
    success: true,
    status: "success",
    data: user,
  });
});

/**
 * @desc    Upgrade user to premium (Mock)

 * @route   POST /api/users/upgrade
 */
exports.upgradeToPremium = catchAsync(async (req, res, next) => {
  const user = await userService.upgradeToPremium(req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    message: "Welcome to Premium! 👑",
    data: {
      isPremium: true,
      user: {
        id: user._id,
        isPremium: true,
      },
    },
  });
});
