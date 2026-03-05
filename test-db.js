const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const uri = process.env.MONGO_URI;
console.log('Testing URI:', uri ? (uri.substring(0, 20) + '...') : 'MISSING');

mongoose.connect(uri)
    .then(() => {
        console.log('✅ Successfully connected to MongoDB');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });
