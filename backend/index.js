const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
const authRoutes = require('./src/api/routes/auth');
const uploadRoutes = require('./src/api/routes/upload');
const userRoutes = require('./src/api/routes/users');
const errorMiddleware = require('./src/api/middleware/errorMiddleware');

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Weezy Backend API is running! 🚀' });
});

// 404 Handle
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use(errorMiddleware);

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is missing from .env file');
} else {
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log('✅ Connected to MongoDB');
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        })
        .catch(err => {
            console.error('❌ MongoDB Connection Error:', err);
        });
}
