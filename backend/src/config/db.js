const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('❌ MONGO_URI is missing from .env file');
        return;
    }
    const maxRetries = 5;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const conn = await mongoose.connect(uri);
            console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
            return conn;
        } catch (err) {
            attempt += 1;
            console.error('❌ MongoDB Connection Error:', err.message);
            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
            }
        }
    }
    console.error('❌ Failed to connect to MongoDB after retries');
};

module.exports = connectDB;
