
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const Interest = require('./src/models/Interest');
const User = require('./src/models/User');
const Group = require('./src/models/Group');

const normalize = (value) => {
    if (!value) return value;
    return value.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, ' ');
};

async function runMigration() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Normalize Interest model
        const interests = await Interest.find();
        for (const interest of interests) {
            let changed = false;
            if (interest.category !== normalize(interest.category)) {
                interest.category = normalize(interest.category);
                changed = true;
            }

            interest.subcategories.forEach(sub => {
                const normName = normalize(sub.name);
                if (sub.name !== normName) {
                    console.log(`Normalizing subcategory: ${sub.name} -> ${normName}`);
                    sub.name = normName;
                    changed = true;
                }
            });

            if (changed) {
                // Must mark modified for subcategories array if it's an array of objects
                interest.markModified('subcategories');
                await interest.save();
                console.log(`Saved normalization for category: ${interest.category}`);
            }
        }

        // 2. Normalize User interests
        const users = await User.find({ interests: { $exists: true, $ne: [] } });
        for (const user of users) {
            let changed = false;
            const newInterests = user.interests.map(i => {
                const norm = normalize(i);
                if (norm !== i) changed = true;
                return norm;
            });

            if (changed) {
                user.interests = [...new Set(newInterests)];
                await user.save();
                console.log(`Normalized interests for user: ${user.email}`);
            }
        }

        // 3. Normalize Group interest field
        const groups = await Group.find({ interest: { $exists: true } });
        for (const group of groups) {
            const norm = normalize(group.interest);
            if (norm !== group.interest) {
                group.interest = norm;
                await group.save();
                console.log(`Normalized group: ${group.name}`);
            }
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
