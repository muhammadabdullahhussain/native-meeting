const User = require("../models/User");
const Connection = require("../models/Connection");

/**
 * Business logic for discovering users nearby
 * @param {Object} currentUser The requesting user object
 * @param {Number} maxDistance Maximum search radius in km
 * @returns {Array} List of processed user objects
 */
/**
 * Business logic for discovering users nearby
 * @param {Object} currentUser The requesting user object
 * @param {Number} maxDistance Maximum search radius in km
 * @returns {Array} List of processed user objects
 */
exports.discoverNearbyUsers = async (
  currentUser,
  maxDistance = 50,
  filters = {},
) => {
  // 1. Fetch ALL existing relations (pending, accepted, blocked) to exclude them
  const existingRelations = await Connection.find({
    $or: [{ requester: currentUser._id }, { receiver: currentUser._id }],
  });

  const excludedIds = existingRelations.map((rel) =>
    rel.requester.toString() === currentUser._id.toString()
      ? rel.receiver
      : rel.requester,
  );
  excludedIds.push(currentUser._id);

  // 2. Build filter query
  const query = {
    _id: { $nin: excludedIds },
    "settings.discovery.showMe": { $ne: false }, // Respect privacy toggle
  };
  if (filters.isOnline) query.onlineStatus = true;
  if (filters.isVerified) query.isVerified = true;
  if (filters.interest) query.interests = filters.interest;
  // Multi-interest filter from modal (overrides single interest tab if both present)
  if (filters.interests && filters.interests.length > 0) {
    query.interests = { $in: filters.interests };
  }
  if (filters.gender && filters.gender !== "Anyone") {
    if (filters.gender === "Men") query.gender = "Male";
    else if (filters.gender === "Women") query.gender = "Female";
    else if (filters.gender === "Non-binary") query.gender = "Non-binary";
  }

  if (filters.lookingFor && filters.lookingFor !== "Anyone") {
    query.lookingFor = filters.lookingFor;
  }

  if (filters.availability && filters.availability.length > 0) {
    query.availability = { $in: filters.availability };
  }

  if (filters.languages && filters.languages.length > 0) {
    query.languages = { $in: filters.languages };
  }

  // Age Filter
  if (filters.minAge || filters.maxAge) {
    const min = Number(filters.minAge) || 18;
    const max = Number(filters.maxAge) || 100;

    if (min <= 18 && max >= 60) {
      query.$or = [
        { age: { $gte: min, $lte: max } },
        { age: { $exists: false } },
        { age: null },
      ];
    } else {
      query.age = { $gte: min, $lte: max };
    }
  }

  // 3. Check if location is usable (not default [0,0])
  const coords = currentUser.location?.coordinates;
  const hasRealLocation =
    coords &&
    Array.isArray(coords) &&
    coords.length === 2 &&
    !(coords[0] === 0 && coords[1] === 0);

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  let aggregatedUsers;

  if (hasRealLocation) {
    // Geo-based query: show users within maxDistance km
    aggregatedUsers = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: coords,
          },
          distanceField: "distanceMeters",
          maxDistance: (Number(maxDistance) || 50) * 1000,
          query: query,
          spherical: true,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Fallback if no one found nearby: show anyone (useful for testing or remote locations)
    if (aggregatedUsers.length === 0 && page === 1) {
      const fallbackUsers = await User.find(query)
        .skip(skip)
        .limit(limit)
        .lean();
      aggregatedUsers = fallbackUsers.map(u => ({ ...u, distanceMeters: null }));
    }
  } else {
    // Fallback: no location yet — show users by match score (ignore distance)
    const users = await User.find(query).skip(skip).limit(limit).lean();
    aggregatedUsers = users.map((u) => ({ ...u, distanceMeters: null }));
  }

  // 4. Process matches (Business logic)
  const processedUsers = aggregatedUsers.map((u) => {
    const shared = (u.interests || []).filter((i) =>
      (currentUser.interests || []).includes(i),
    );
    const interestScore = Math.min(
      60,
      Math.round(
        (shared.length / Math.max((currentUser.interests || []).length, 1)) *
        60,
      ),
    );
    const matchScore = interestScore + 40;

    // Ensure distance is consistent: if null or undefined, backend should handle it gracefully
    // For consistent UI, we might default to a small value if it's missing but expected?
    // No, let's just ensure the calculation is correct.
    // The issue is likely that 'distanceMeters' comes from $geoNear which is only in the aggregate pipeline.
    // The 'Active Now' and 'Connections' endpoints might be using simple .find() which lacks this field.
    // We need to inject distance calculation for those too if possible, OR standardise the response.

    // Check for blur setting
    const isBlurred = u.settings?.discovery?.blurLocation;

    return {
      ...u,
      id: u._id,
      isOnline: u.onlineStatus,
      latitude: isBlurred ? null : u.location?.coordinates?.[1],
      longitude: isBlurred ? null : u.location?.coordinates?.[0],
      distanceKm:
        u.distanceMeters != null
          ? parseFloat((u.distanceMeters / 1000).toFixed(1))
          : null, // Keep null if not calculated, frontend handles fallback
      matchScore,
      sharedInterests: shared,
    };
  });

  // Sort based on requested sortBy parameter
  return processedUsers.sort((a, b) => {
    if (filters.sortBy === "newest") {
      // Assuming _id creation timestamp for newest users
      return b._id.getTimestamp() - a._id.getTimestamp();
    } else if (filters.sortBy === "online") {
      if (b.isOnline !== a.isOnline) return b.isOnline ? 1 : -1;
      return 0;
    } else if (filters.sortBy === "match") {
      return b.matchScore - a.matchScore;
    } else {
      // Default: 'distance' (already sorted by $geoNear if location exists)
      // If no location, maybe fallback to match score
      if (hasRealLocation) {
        return (a.distanceKm || 0) - (b.distanceKm || 0);
      }
      return b.matchScore - a.matchScore;
    }
  });
};

/**
 * Fetch a single user profile (Public view)
 */
exports.getUserById = async (userId) => {
  return await User.findById(userId).select(
    "name avatar banner photos username bio city jobTitle company interests interestCategories lookingFor isVerified isPremium onlineStatus lastSeen connectionCount gender birthday age",
  );
};

/**
 * Upgrade user to Premium (Mock)
 */
exports.upgradeToPremium = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  user.isPremium = true;
  await user.save();
  return user;
};
