const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Group = require('./src/models/Group');
const Connection = require('./src/models/Connection');

dotenv.config();

const DUMMY_AVATARS = [
    'https://i.pravatar.cc/150?img=11',
    'https://i.pravatar.cc/150?img=12',
    'https://i.pravatar.cc/150?img=13',
    'https://i.pravatar.cc/150?img=14',
    'https://i.pravatar.cc/150?img=15',
    'https://i.pravatar.cc/150?img=33',
    'https://i.pravatar.cc/150?img=34',
    'https://i.pravatar.cc/150?img=35',
    'https://i.pravatar.cc/150?img=36',
    'https://i.pravatar.cc/150?img=38',
    'https://i.pravatar.cc/150?img=41',
    'https://i.pravatar.cc/150?img=42',
    'https://i.pravatar.cc/150?img=43',
    'https://i.pravatar.cc/150?img=44',
    'https://i.pravatar.cc/150?img=45',
    'https://i.pravatar.cc/150?img=47',
    'https://i.pravatar.cc/150?img=48',
    'https://i.pravatar.cc/150?img=49',
    'https://i.pravatar.cc/150?img=50',
    'https://i.pravatar.cc/150?img=51'
];

const NAMES = [
    'Ahmed Ali', 'Sara Khan', 'Bilal Hassan', 'Ayesha Noor',
    'Usman Tariq', 'Fatima Rehman', 'Omer Saeed', 'Hira Shah',
    'Zain Yasin', 'Maryum Gul', 'Ali Raza', 'Nida Kamal',
    'Kashif Mubin', 'Sana Riaz', 'Fahad R', 'Mehwish P',
    'Tariq Aziz', 'Zohra S', 'Saad N', 'Rubina M'
];

const INTERESTS = ['Software Dev', 'Coffee', 'Design', 'AI & ML', 'Photography', 'Gaming', 'Cooking', 'Marketing', 'Yoga', 'Plant-Based', 'Thrifting'];

const seedDummyData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB. Generating mass dummy data...');

        // 1. Get existing primary users
        const primaryUsers = await User.find().limit(3);
        if (primaryUsers.length === 0) {
            console.log('No primary users found to seed requests to.');
            process.exit(1);
        }

        const generatedUsers = [];

        // 2. Generate 20 new random users
        for (let i = 0; i < 20; i++) {
            const lat = 31.4 + Math.random() * 0.2; // roughly Lahore
            const lng = 74.2 + Math.random() * 0.2; // roughly Lahore

            // Randomly select 3-5 interests
            const shuffledInterests = [...INTERESTS].sort(() => 0.5 - Math.random());
            const selectedInterests = shuffledInterests.slice(0, Math.floor(Math.random() * 3) + 3);

            const newUser = new User({
                name: NAMES[i % NAMES.length],
                email: `dummy${i}_${Date.now()}@example.com`,
                password: 'password123',
                city: 'Lahore, PK',
                bio: `Hi I'm ${NAMES[i % NAMES.length]}! Huge fan of ${selectedInterests[0]} and ${selectedInterests[1]}. Let's connect! 🚀`,
                interests: selectedInterests,
                interestCategories: ['Lifestyle', 'Tech', 'Networking'],
                availability: ['Weekends', 'Evenings'],
                gender: Math.random() > 0.5 ? 'Male' : 'Female',
                age: Math.floor(Math.random() * 15) + 20, // 20-35
                languages: ['English', 'Urdu'],
                avatar: DUMMY_AVATARS[i % DUMMY_AVATARS.length],
                photos: [DUMMY_AVATARS[i % DUMMY_AVATARS.length]],
                onlineStatus: Math.random() > 0.3,
                isVerified: Math.random() > 0.5,
                location: { type: 'Point', coordinates: [lng, lat] },
                referralCode: `DUMMY${i}_REF`
            });

            await newUser.save({ validateBeforeSave: false });
            generatedUsers.push(newUser);
        }

        console.log(`Created ${generatedUsers.length} dummy users.`);

        // 3. Send Fake Requests to the Primary Users
        const messages = [
            "Hey! Saw your profile and thought we'd get along well!",
            "Love your interests! Let's chat.",
            "Would love to connect and talk about tech!",
            "Fellow coffee enthusiast here ☕",
            "Hey, looking to expand my network in Lahore!"
        ];

        let connectionsCreated = 0;

        for (const targetUser of primaryUsers) {
            // Assign 6-8 random incoming requests per primary user
            const numRequests = Math.floor(Math.random() * 3) + 6;

            // Shuffle the generated users
            const shuffledGenerators = [...generatedUsers].sort(() => 0.5 - Math.random());

            for (let j = 0; j < numRequests; j++) {
                const requester = shuffledGenerators[j];

                try {
                    await Connection.create({
                        requester: requester._id,
                        receiver: targetUser._id,
                        status: 'pending',
                        message: messages[Math.floor(Math.random() * messages.length)],
                        isPriority: Math.random() > 0.8
                    });
                    connectionsCreated++;
                } catch (e) {
                    // Ignore duplicates
                }
            }

            // Also create 2-3 Accepted connections (Chats)
            for (let j = numRequests; j < numRequests + 3; j++) {
                if (j >= shuffledGenerators.length) break;
                const buddy = shuffledGenerators[j];

                try {
                    await Connection.create({
                        requester: buddy._id,
                        receiver: targetUser._id,
                        status: 'accepted',
                        message: "Let's connect!",
                    });
                } catch (e) { }
            }
        }

        console.log(`Sent ${connectionsCreated} fake connection requests to primary accounts.`);

        // 4. Create 10 more random Groups 
        const groupTopics = [
            { name: "Lahore Coders 🤓", emoji: "🤓", topic: "Software Dev" },
            { name: "Padel Masters", emoji: "🎾", topic: "Padel" },
            { name: "Startup Connect LHR", emoji: "🚀", topic: "AI & ML" },
            { name: "Coffee Cult", emoji: "☕", topic: "Coffee" },
            { name: "Design Thinkers", emoji: "🎨", topic: "Design" },
            { name: "Gamers Unite", emoji: "🎮", topic: "Gaming" },
            { name: "Foodies of Lahore", emoji: "🍔", topic: "Cooking" },
            { name: "Growth Hackers", emoji: "📈", topic: "Marketing" },
            { name: "Yoga & Mindfulness", emoji: "🧘", topic: "Yoga" },
            { name: "Thrifting & Vintage", emoji: "🧥", topic: "Thrifting" },
        ];

        for (let i = 0; i < groupTopics.length; i++) {
            const g = groupTopics[i];

            // Add some random fake members
            const groupMembers = [];
            const numMembers = Math.floor(Math.random() * 15) + 3;
            for (let m = 0; m < numMembers; m++) {
                groupMembers.push({
                    user: generatedUsers[Math.floor(Math.random() * generatedUsers.length)]._id,
                    role: m === 0 ? 'admin' : 'member'
                });
            }

            await Group.create({
                name: g.name,
                description: `A community for everyone interested in ${g.topic}.`,
                interest: g.topic,
                emoji: g.emoji,
                color: ['#3b82f6', '#8b5cf6'],
                isPublic: true,
                maxMembers: 50,
                creator: groupMembers[0].user,
                members: groupMembers
            });
        }

        console.log('Created 10 new random Groups.');

        console.log('Success! Data seeded.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding fake data:', error);
        process.exit(1);
    }
};

seedDummyData();
