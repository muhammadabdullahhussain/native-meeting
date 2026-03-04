const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./src/models/User");
const Group = require("./src/models/Group");
const Connection = require("./src/models/Connection");
const Notification = require("./src/models/Notification");
const Message = require("./src/models/Message");

dotenv.config({ path: __dirname + "/.env" });

const users = [
  {
    name: "Alice Cooper",
    email: "alice@example.com",
    password: "password123",
    city: "San Francisco, CA",
    bio: "Software Engineer by day. Padel enthusiast and filter coffee addict by night. ☕",
    interests: ["Software Dev", "Coffee", "Padel", "AI & ML", "Minimalism"],
    avatar: "https://i.pravatar.cc/150?img=1",
    onlineStatus: true,
    location: { type: "Point", coordinates: [-122.4194, 37.7749] },
  },
  {
    name: "Fatima Malik",
    email: "fatima@example.com",
    password: "password123",
    city: "San Francisco, CA",
    bio: "Data scientist. Heavy into AI & ML. Looking for Padel partners! 🎾",
    interests: ["AI & ML", "Data Science", "Padel", "Cooking", "Biohacking"],
    avatar: "https://i.pravatar.cc/150?img=25",
    onlineStatus: true,
    location: { type: "Point", coordinates: [-122.425, 37.772] },
  },
  {
    name: "Hannah Abbott",
    email: "hannah@example.com",
    password: "password123",
    city: "San Francisco, CA",
    bio: "Digital Nomad & Sustainable Living advocate. Into Thrifting & Yoga. ✨",
    interests: [
      "Digital Nomad",
      "Sustainable Living",
      "Thrifting",
      "Yoga",
      "Plant-Based",
    ],
    avatar: "https://i.pravatar.cc/150?img=32",
    onlineStatus: true,
    location: { type: "Point", coordinates: [-122.41, 37.78] },
  },
];

const groups = [
  {
    name: "SF Coffee Lovers ☕",
    description: "Meet fellow coffee lovers in SF every Saturday!",
    interest: "Coffee",
    emoji: "☕",
    isPublic: true,
    maxMembers: 50,
    members: [],
  },
  {
    name: "Tech Builders 💻",
    description: "Build, ship, and network with fellow engineers.",
    interest: "Software Dev",
    emoji: "💻",
    isPublic: true,
    maxMembers: 200,
    members: [],
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing test data to ensure clean slate with new coordinates
    await User.deleteMany({});
    await Group.deleteMany({});
    await Connection.deleteMany({});
    await Notification.deleteMany({});
    await Message.deleteMany({});
    console.log("Cleared existing data.");

    // RELOCATE USERS TO LAHORE (User's current vicinity)
    const lahoreUsers = [
      {
        name: "Zainab Ahmed",
        email: "zainab@example.com",
        password: "password123",
        city: "Lahore, PK",
        bio: "UI/UX Designer. Coffee lover and local explorer. ☕",
        interests: [
          "Software Dev",
          "Coffee",
          "Design",
          "AI & ML",
          "Photography",
        ],
        interestCategories: ["Professional", "Lifestyle", "Tech"],
        availability: ["Weekdays", "Evenings"],
        gender: "Female",
        age: 24,
        languages: ["English", "Urdu", "Punjabi"],
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400",
        photos: [
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400",
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400",
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400",
        ],
        onlineStatus: true,
        isVerified: true,
        location: { type: "Point", coordinates: [74.3587, 31.5204] }, // Gulberg, Lahore
        referralCode: "ZAINAB786",
      },
      {
        name: "Hamza Khan",
        email: "hamza@example.com",
        password: "password123",
        city: "Lahore, PK",
        bio: "Full Stack Dev. Tech enthusiast. Let's build something cool! 💻",
        interests: ["Software Dev", "AI & ML", "Gaming", "Cooking"],
        interestCategories: ["Tech", "Gaming", "Lifestyle"],
        gender: "Male",
        age: 27,
        languages: ["English", "Urdu"],
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400",
        photos: [
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400",
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400",
        ],
        isPremium: true,
        onlineStatus: true,
        location: { type: "Point", coordinates: [74.269, 31.4195] }, // Close to user
        referralCode: "HAMZA920",
      },
      {
        name: "Amna Shah",
        email: "amna@example.com",
        password: "password123",
        city: "Lahore, PK",
        bio: "Digital Marketer. Into Yoga and healthy lifestyle. ✨",
        interests: ["Marketing", "Yoga", "Plant-Based", "Thrifting"],
        interestCategories: ["Lifestyle", "Wellness"],
        gender: "Female",
        age: 22,
        languages: ["English", "Urdu"],
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
        photos: [
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400",
        ],
        onlineStatus: true,
        location: { type: "Point", coordinates: [74.3293, 31.4697] }, // Model Town, Lahore
        referralCode: "AMNA9911",
      },
    ];

    for (const u of lahoreUsers) {
      await User.create(u);
      console.log(`Created user: ${u.name}`);
    }

    const admin = await User.findOne();

    // Update groups to be local too
    const localGroups = [
      {
        name: "Lahore Techies 💻",
        description: "Local meetup for devs and tech enthusiasts in Lahore.",
        interest: "Software Dev",
        emoji: "💻",
        color: ["#6366f1", "#a855f7"], // Indigo to Purple gradient
        isPublic: true,
        maxMembers: 200,
        creator: admin._id,
        members: [{ user: admin._id, role: "admin" }],
      },
      {
        name: "Coffee & Code LHR ☕",
        description: "Weekend coffee meetups for builders.",
        interest: "Coffee",
        emoji: "☕",
        color: ["#f59e0b", "#ef4444"], // Amber to Red gradient
        isPublic: true,
        maxMembers: 50,
        creator: admin._id,
        members: [{ user: admin._id, role: "admin" }],
        pendingRequests: [],
      },
    ];

    for (const g of localGroups) {
      await Group.create(g);
      console.log(`Created group: ${g.name}`);
    }

    const zainab = await User.findOne({ email: "zainab@example.com" });
    const hamza = await User.findOne({ email: "hamza@example.com" });
    const amna = await User.findOne({ email: "amna@example.com" });

    const pendingConn = await Connection.create({
      requester: hamza._id,
      receiver: zainab._id,
      status: "pending",
      message: "Let's connect!",
    });

    await Notification.create({
      recipient: zainab._id,
      sender: hamza._id,
      type: "connect_request",
      message: `${hamza.name} sent you a connection request`,
      data: { connectionId: pendingConn._id },
    });

    const acceptedConn = await Connection.create({
      requester: amna._id,
      receiver: zainab._id,
      status: "accepted",
      message: "Excited to connect!",
    });

    await Notification.create({
      recipient: zainab._id,
      sender: amna._id,
      type: "connected",
      message: `You're now connected with ${amna.name}`,
      data: { connectionId: acceptedConn._id },
    });

    const coffeeGroup = await Group.findOne({ name: "Coffee & Code LHR ☕" });
    await Group.updateOne(
      { _id: coffeeGroup._id },
      { $addToSet: { pendingRequests: hamza._id } },
    );

    await Notification.create({
      recipient: coffeeGroup.creator,
      sender: hamza._id,
      type: "group_request",
      message: `${hamza.name} requested to join ${coffeeGroup.name}`,
      data: { groupId: coffeeGroup._id, userId: hamza._id },
    });

    await User.updateOne(
      { _id: hamza._id },
      { $set: { referredBy: zainab._id } },
    );
    await User.updateOne(
      { _id: zainab._id },
      {
        $inc: { referralCount: 1 },
        $push: { referralLog: { user: hamza._id, joinedAt: new Date() } },
      },
    );
    await Notification.create({
      recipient: zainab._id,
      sender: hamza._id,
      type: "referral_joined",
      message: `${hamza.name} joined using your referral`,
      data: { userId: hamza._id },
    });

    const referredUsers = [
      {
        name: "Sara Khan",
        email: `sara.ref1@example.com`,
        password: "password123",
        city: "Lahore, PK",
        interests: ["Coffee", "Design", "Photography"],
        avatar: "https://i.pravatar.cc/150?img=12",
        onlineStatus: true,
        isVerified: true,
        location: { type: "Point", coordinates: [74.35, 31.51] },
        referredBy: zainab._id,
        referralCode: "SARA1881",
      },
      {
        name: "Usman Tariq",
        email: `usman.ref2@example.com`,
        password: "password123",
        city: "Lahore, PK",
        interests: ["Software Dev", "AI & ML", "Gaming"],
        avatar: "https://i.pravatar.cc/150?img=41",
        onlineStatus: true,
        location: { type: "Point", coordinates: [74.3, 31.49] },
        referredBy: zainab._id,
        referralCode: "USMAN2250",
      },
    ];

    for (const r of referredUsers) {
      const created = await User.create(r);
      await User.updateOne(
        { _id: zainab._id },
        {
          $inc: { referralCount: 1 },
          $push: { referralLog: { user: created._id, joinedAt: new Date() } },
        },
      );
      await Notification.create({
        recipient: zainab._id,
        sender: created._id,
        type: "referral_joined",
        message: `${r.name} joined using your referral`,
        data: { userId: created._id },
      });
    }

    const zainabToAmna = await Connection.create({
      requester: zainab._id,
      receiver: amna._id,
      status: "pending",
      message: "Hi Amna, let's connect!",
    });
    await Notification.create({
      recipient: amna._id,
      sender: zainab._id,
      type: "connect_request",
      message: `${zainab.name} sent you a connection request`,
      data: { connectionId: zainabToAmna._id },
    });

    await Group.updateOne(
      { _id: coffeeGroup._id },
      {
        $pull: { pendingRequests: hamza._id },
        $addToSet: { members: { user: hamza._id, role: "member" } },
      },
    );
    await Notification.create({
      recipient: hamza._id,
      sender: coffeeGroup.creator,
      type: "group_accepted",
      message: `Your request to join ${coffeeGroup.name} was accepted`,
      data: { groupId: coffeeGroup._id },
    });

    const m1 = await Message.create({
      sender: amna._id,
      receiver: zainab._id,
      text: "Hey Zainab! Loved your portfolio. Coffee sometime?",
    });
    await Notification.create({
      recipient: zainab._id,
      sender: amna._id,
      type: "message",
      message: `New message from ${amna.name}`,
      data: { messageId: m1._id, senderId: amna._id },
    });

    await Notification.create({
      recipient: zainab._id,
      sender: hamza._id,
      type: "interest_match",
      message: `You and ${hamza.name} share interests`,
      data: { sharedInterests: ["Software Dev", "Cooking"] },
    });

    await Notification.create({
      recipient: zainab._id,
      sender: hamza._id,
      type: "nearby",
      message: `${hamza.name} is nearby`,
      data: { coordinates: [74.269, 31.4195] },
    });

    await Notification.create({
      recipient: hamza._id,
      sender: zainab._id,
      type: "mention",
      message: `${zainab.name} mentioned you`,
      data: { context: "Coffee & Code LHR" },
    });

    console.log("Database seeded successfully with local data!");
    process.exit();
  } catch (error) {
    console.error("Error seeding DB:", error);
    process.exit(1);
  }
};

seedDB();
