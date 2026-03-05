const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./src/models/User");
const Group = require("./src/models/Group");
const Connection = require("./src/models/Connection");
const Notification = require("./src/models/Notification");
const Message = require("./src/models/Message");

dotenv.config({ path: __dirname + "/.env" });

const interestsList = [
    "Software Dev", "AI & ML", "Data Science", "Design", "Marketing",
    "Coffee", "Padel", "Gaming", "Cooking", "Yoga",
    "Photography", "Travel", "Fitness", "Music", "Reading",
    "Startup", "Crypto", "Web3", "Cricket", "Movies"
];

const neighborhoods = [
    { name: "Gulberg", coords: [74.3587, 31.5204] },
    { name: "DHA Phase 5", coords: [74.45, 31.47] },
    { name: "Model Town", coords: [74.3293, 31.4697] },
    { name: "Johar Town", coords: [74.269, 31.4195] },
    { name: "Bahria Town", coords: [74.18, 31.37] },
    { name: "Liberty Market", coords: [74.33, 31.51] }
];

const names = [
    "Zainab Ahmed", "Hamza Khan", "Amna Shah", "Sara Khan", "Usman Tariq",
    "Ali Raza", "Fatima Batool", "Bilal Ahmed", "Ayesha Malik", "Omar Farooq",
    "Marium Bibi", "Hassan Ali", "Sana Javed", "Ahmed Raza", "Zoya Khan",
    "Mustafa Kamal", "Hina Pervez", "Faizan Sheikh", "Rimsha Ali", "Kamran Akmal",
    "Nadia Hussain", "Saad Bin Zafar", "Mahnoor Baloch", "Fahad Mustafa", "Sajal Aly",
    "Babar Azam", "Shaheen Afridi", "Rizwan Ahmed", "Shadab Khan", "Haris Rauf",
    "Ishaq Dar", "Maryam Nawaz", "Bilawal Bhutto", "Imran Khan", "Arif Alvi",
    "Mehwish Hayat", "Humayun Saeed", "Maya Ali", "Ahsan Khan", "Saba Qamar",
    "Atif Aslam", "Rahat Fateh", "Ali Zafar", "Asim Azhar", "Momina Mustehsan"
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB Atlas");

        await User.deleteMany({});
        await Group.deleteMany({});
        await Connection.deleteMany({});
        await Notification.deleteMany({});
        await Message.deleteMany({});
        // Wait a bit to ensure Atlas catches up
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log("Cleared existing data.");

        // 1. Create Users
        const users = [];
        const timestamp = Date.now();
        for (let i = 0; i < 100; i++) {
            const neighborhood = getRandom(neighborhoods);
            const userInterests = [];
            const interestCount = getRandomInt(3, 6);
            while (userInterests.length < interestCount) {
                const interest = getRandom(interestsList);
                if (!userInterests.includes(interest)) userInterests.push(interest);
            }

            const name = names[i % names.length] + (i >= names.length ? ` ${i}` : "");
            const email = name.toLowerCase().split(' ').join('.') + "@example.com";

            const user = await User.create({
                name,
                email,
                password: "password123",
                city: "Lahore, PK",
                bio: `I love ${userInterests.slice(0, 2).join(" and ")}. Living in ${neighborhood.name}.`,
                interests: userInterests,
                interestCategories: ["Professional", "Lifestyle"],
                gender: i % 2 === 0 ? "Male" : "Female",
                age: getRandomInt(18, 45),
                languages: ["English", "Urdu"],
                avatar: `https://i.pravatar.cc/150?u=${i}`,
                onlineStatus: Math.random() > 0.5,
                isVerified: Math.random() > 0.7,
                location: {
                    type: "Point",
                    coordinates: [
                        neighborhood.coords[0] + (Math.random() - 0.5) * 0.02,
                        neighborhood.coords[1] + (Math.random() - 0.5) * 0.02
                    ]
                },
                referralCode: `REF${i}${Math.random().toString(36).substring(7).toUpperCase()}`
            });
            users.push(user);
            console.log(`Created User: ${user.name}`);
        }

        // 2. Create Groups
        const groups = [];
        for (let i = 0; i < 10; i++) {
            const interest = getRandom(interestsList);
            const admin = getRandom(users);
            const group = await Group.create({
                name: `${interest} Lovers LHR`,
                description: `Connect with people interested in ${interest} in Lahore.`,
                interest: interest,
                emoji: "✨",
                isPublic: true,
                maxMembers: 100,
                creator: admin._id,
                members: [{ user: admin._id, role: "admin" }]
            });

            // Add random members
            const memberCount = getRandomInt(5, 15);
            for (let j = 0; j < memberCount; j++) {
                const potentialMember = getRandom(users);
                if (potentialMember._id.toString() !== admin._id.toString()) {
                    await Group.updateOne(
                        { _id: group._id },
                        { $addToSet: { members: { user: potentialMember._id, role: "member" } } }
                    );
                }
            }
            groups.push(group);
            console.log(`Created Group: ${group.name}`);
        }

        // 3. Create Connections, Messages & Notifications
        const existingConns = new Set();
        for (let i = 0; i < users.length; i++) {
            const user = users[i];

            // Each user has 3-7 connections
            const connCount = getRandomInt(3, 7);
            for (let j = 0; j < connCount; j++) {
                const otherUser = getRandom(users);
                const connKey = [user._id.toString(), otherUser._id.toString()].sort().join("-");

                if (user._id.toString() === otherUser._id.toString() || existingConns.has(connKey)) continue;

                existingConns.add(connKey);
                const status = Math.random() > 0.3 ? "accepted" : "pending";
                try {
                    const conn = await Connection.create({
                        requester: user._id,
                        receiver: otherUser._id,
                        status,
                        message: "Hey, would love to connect!"
                    });

                    // Add Notification for connection
                    await Notification.create({
                        recipient: otherUser._id,
                        sender: user._id,
                        type: status === "accepted" ? "connected" : "connect_request",
                        message: status === "accepted" ? `You're now connected with ${user.name}` : `${user.name} sent you a connection request`,
                        data: { connectionId: conn._id }
                    });

                    // If accepted, add some messages
                    if (status === "accepted") {
                        const msgCount = getRandomInt(2, 5);
                        for (let k = 0; k < msgCount; k++) {
                            const sender = k % 2 === 0 ? user : otherUser;
                            const receiver = k % 2 === 0 ? otherUser : user;
                            const msg = await Message.create({
                                sender: sender._id,
                                receiver: receiver._id,
                                text: getRandom(["Hey!", "How are you?", "Let's meet up!", "Great profile!", "Doing what today?", "See you soon!"])
                            });

                            // Add notification for message
                            if (k === msgCount - 1) { // Only notify for the last message
                                await Notification.create({
                                    recipient: receiver._id,
                                    sender: sender._id,
                                    type: "message",
                                    message: `New message from ${sender.name}`,
                                    data: { messageId: msg._id, senderId: sender._id }
                                });
                            }
                        }
                    }
                } catch (e) {
                    if (e.code !== 11000) console.error("Error creating connection:", e);
                }
            }

            // Random "nearby" and "interest_match" notifications
            for (let n = 0; n < 3; n++) {
                const sender = getRandom(users);
                if (sender._id.toString() === user._id.toString()) continue;

                const type = Math.random() > 0.5 ? "nearby" : "interest_match";
                await Notification.create({
                    recipient: user._id,
                    sender: sender._id,
                    type,
                    message: type === "nearby" ? `${sender.name} is nearby` : `You and ${sender.name} share interests`,
                    data: type === "nearby" ? { coordinates: sender.location.coordinates } : { sharedInterests: [getRandom(interestsList)] }
                });
            }
        }

        console.log("Massive DB seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error in massive seeding:", error);
        process.exit(1);
    }
};

seedDB();
