const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Interest = require('../models/Interest');

// Load env vars
dotenv.config({ path: __dirname + '/../../.env' });

// Define initial interest tree
const interestsData = [
    {
        category: 'Sports',
        subcategories: [
            { name: 'Football' },
            { name: 'Basketball' },
            { name: 'Tennis' },
            { name: 'Cricket' },
            { name: 'Swimming' },
            { name: 'Running' }
        ]
    },
    {
        category: 'Board Games',
        subcategories: [
            { name: 'Chess' },
            { name: 'Monopoly' },
            { name: 'Scrabble' },
            { name: 'Catan' },
            { name: 'Dominoes' }
        ]
    },
    {
        category: 'Technology',
        subcategories: [
            { name: 'Coding' },
            { name: 'AI & Machine Learning' },
            { name: 'Web Development' },
            { name: 'Gadgets' },
            { name: 'Blockchain' }
        ]
    },
    {
        category: 'Arts & Culture',
        subcategories: [
            { name: 'Photography' },
            { name: 'Painting' },
            { name: 'Theater' },
            { name: 'Literature' },
            { name: 'Museums' }
        ]
    },
    {
        category: 'Music',
        subcategories: [
            { name: 'Rock' },
            { name: 'Jazz' },
            { name: 'Classical' },
            { name: 'Hip Hop' },
            { name: 'Electronic' },
            { name: 'Playing Instruments' }
        ]
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Clear existing interests
        await Interest.deleteMany();
        console.log('Cleared existing interests collection');

        // Insert new ones
        await Interest.insertMany(interestsData);
        console.log('Successfully seeded hierarchical interests tree');

        process.exit();
    } catch (err) {
        console.error('Failed to seed DB:', err);
        process.exit(1);
    }
};

seedDB();
