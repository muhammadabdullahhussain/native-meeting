const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const LOG_FILE = 'migration_log.txt';
fs.writeFileSync(LOG_FILE, 'Migration started...\n');

const generateReferralCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        fs.appendFileSync(LOG_FILE, 'Connected to DB\n');
        
        const User = require('./src/models/User');
        const users = await User.find({ referralCode: { $in: [null, undefined, '', 'INVITE'] } });
        fs.appendFileSync(LOG_FILE, `Found ${users.length} users to update\n`);

        for (const user of users) {
             const code = generateReferralCode();
             user.referralCode = code;
             await user.save();
             fs.appendFileSync(LOG_FILE, `Updated ${user.email} -> ${code}\n`);
        }

        fs.appendFileSync(LOG_FILE, 'Migration completed successfully\n');
    } catch (err) {
        fs.appendFileSync(LOG_FILE, `ERROR: ${err.message}\n`);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
