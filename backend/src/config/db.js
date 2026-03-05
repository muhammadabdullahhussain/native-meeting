const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('❌ MONGO_URI is missing from .env file');
        return;
    }

    // Mask URI for logging
    const maskedUri = uri.replace(/\/\/.*@/, '//****:****@');
    console.log(`📡 Attempting to connect to MongoDB: ${maskedUri}`);

    const options = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };

    const maxRetries = 5;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const conn = await mongoose.connect(uri, options);
            console.log(`✅ Connected to MongoDB: ${conn.connection.host} / DB: ${conn.connection.name}`);
            return conn;
        } catch (err) {
            attempt += 1;
            console.error(`❌ MongoDB Connection Attempt ${attempt} failed!`);
            console.error(`Message: ${err.message}`);
            console.error(`Code: ${err.code || 'N/A'}`);
            if (attempt < maxRetries) {
                const wait = 2000 * attempt;
                console.log(`⏳ Retrying in ${wait / 1000}s...`);
                await new Promise((resolve) => setTimeout(resolve, wait));
            }
        }
    }
    console.error('❌ Failed to connect to MongoDB after all retries. App may be unstable.');
};

module.exports = connectDB;
