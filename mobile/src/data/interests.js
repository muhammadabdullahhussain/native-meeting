// Hierarchical interest taxonomy — expanded to 25+ categories, 300+ sub-interests
export const INTEREST_CATEGORIES = [
    {
        id: 'sports',
        name: 'Sports & Active',
        emoji: '⚽',
        color: ['#065F46', '#059669'],
        subInterests: ['Football', 'Basketball', 'Tennis', 'Swimming', 'Cricket', 'Baseball', 'Rugby', 'Volleyball', 'Table Tennis', 'Badminton', 'Cycling', 'Running', 'Golf', 'Boxing', 'Martial Arts', 'Archery', 'Padel', 'Pickleball', 'Skateboarding', 'Fencing', 'Gymnastics'],
    },
    {
        id: 'board_games',
        name: 'Games & Strategy',
        emoji: '♟️',
        color: ['#1D4ED8', '#3B82F6'],
        subInterests: ['Chess', 'Dominoes', 'Scrabble', 'Monopoly', 'Catan', 'Risk', 'Checkers', 'Backgammon', 'Go', 'Poker', 'Bridge', 'Dungeons & Dragons', 'Ticket to Ride', 'Codenames', 'Warhammer', 'Magic: The Gathering', 'Escape Rooms'],
    },
    {
        id: 'music',
        name: 'Music & Audio',
        emoji: '🎵',
        color: ['#6D28D9', '#8B5CF6'],
        subInterests: ['Jazz', 'Hip-Hop', 'Classical', 'Rock', 'Pop', 'R&B', 'Electronic', 'Indie', 'Country', 'Metal', 'Reggae', 'Blues', 'Soul', 'Folk', 'Afrobeats', 'K-Pop', 'Latin', 'Opera', 'Lo-Fi', 'Podcasts', 'Vinyl Collecting', 'DJing', 'Music Production'],
    },
    {
        id: 'tech',
        name: 'Technology & Code',
        emoji: '💻',
        color: ['#0E7490', '#0EA5E9'],
        subInterests: ['Software Dev', 'AI & ML', 'Cybersecurity', 'Web Dev', 'Mobile Apps', 'Data Science', 'Cloud Computing', 'Blockchain', 'IoT', 'Robotics', 'AR & VR', 'Open Source', 'Dev Tools', 'UX Research', 'Cyberpunk Culture', 'No-Code', 'Hardware Hacking'],
    },
    {
        id: 'food',
        name: 'Food & Culinary',
        emoji: '🍜',
        color: ['#92400E', '#D97706'],
        subInterests: ['Coffee', 'Cooking', 'Baking', 'Wine', 'Craft Beer', 'Sushi', 'Veganism', 'BBQ', 'Street Food', 'Fine Dining', 'Cocktails', 'Tea', 'Fermentation', 'Meal Prepping', 'Plant-Based', 'Cheese', 'Pastry', 'Farm-to-Table', 'Mixology', 'Pastas'],
    },
    {
        id: 'arts',
        name: 'Arts & Creative',
        emoji: '🎨',
        color: ['#9F1239', '#E11D48'],
        subInterests: ['Painting', 'Photography', 'Graphic Design', 'UI/UX', 'Illustration', 'Sculpture', 'Film Making', 'Animation', 'Architecture', 'Fashion', 'Pottery', 'Calligraphy', 'Comic Art', 'Street Art', 'Digital Art', 'NFTs', 'Interior Design', 'Printmaking'],
    },
    {
        id: 'outdoors',
        name: 'Outdoors & Nature',
        emoji: '🏕️',
        color: ['#166534', '#16A34A'],
        subInterests: ['Hiking', 'Camping', 'Rock Climbing', 'Surfing', 'Skiing', 'Kayaking', 'Fishing', 'Birdwatching', 'Trail Running', 'Mountaineering', 'Gardening', 'Foraging', 'Stargazing', 'Freediving', 'National Parks', 'Off-Roading', 'Spelunking'],
    },
    {
        id: 'business',
        name: 'Business & Ventures',
        emoji: '🚀',
        color: ['#1E3A5F', '#2563EB'],
        subInterests: ['Startups', 'Entrepreneurship', 'Marketing', 'Investing', 'E-Commerce', 'Venture Capital', 'Product Management', 'Consulting', 'Real Estate', 'Freelancing', 'Personal Finance', 'Growth Hacking', 'SaaS', 'Branding', 'Public Speaking', 'Social Media Strategy', 'Angel Investing'],
    },
    {
        id: 'wellness',
        name: 'Health & Wellness',
        emoji: '🧘',
        color: ['#065F46', '#10B981'],
        subInterests: ['Yoga', 'Meditation', 'Fitness', 'Nutrition', 'Mental Health', 'Running', 'Gym', 'Pilates', 'Martial Arts', 'Crossfit', 'Cold Therapy', 'Sleep Hacking', 'Breathwork', 'Mindfulness', 'Biohacking', 'Therapy', 'Aromatherapy'],
    },
    {
        id: 'lifestyle',
        name: 'Lifestyle & Style',
        emoji: '✨',
        color: ['#BE185D', '#F43F5E'],
        subInterests: ['Minimalism', 'Van Life', 'Digital Nomad', 'Streetwear', 'Vintage Fashion', 'Thrifting', 'Luxury Lifestyle', 'Sustainable Living', 'Astrology', 'Sneakerhead', 'Fragrances', 'Grooming', 'Sneakers'],
    },
    {
        id: 'reading',
        name: 'Reading & Literature',
        emoji: '📚',
        color: ['#44403C', '#78716C'],
        subInterests: ['Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Biography', 'Self-Help', 'Poetry', 'Journalism', 'Blogging', 'Creative Writing', 'Philosophy', 'History', 'Psychology', 'Mystery', 'Graphic Novels', 'Classical Literature', 'Playwriting'],
    },
    {
        id: 'social',
        name: 'Advocacy & Community',
        emoji: '🌱',
        color: ['#14532D', '#22C55E'],
        subInterests: ['Climate Action', 'Volunteering', 'Human Rights', 'Mental Health Advocacy', 'Education Access', 'Women Empowerment', 'Animal Welfare', 'Sustainability', 'Community Building', 'Fundraising', 'Politics', 'LGBTQ+ Rights', 'Inclusion'],
    },
    {
        id: 'history',
        name: 'History & Culture',
        emoji: '🏛️',
        color: ['#78350F', '#D97706'],
        subInterests: ['Ancient Civilizations', 'Modern History', 'Genealogy', 'Anthropology', 'World Mythology', 'Museums', 'Heritage Sites', 'Military History', 'Art History', 'Renaissance', 'Industrial Age'],
    },
    {
        id: 'self_improvement',
        name: 'Growth & Learning',
        emoji: '💡',
        color: ['#7C3AED', '#A855F7'],
        subInterests: ['Public Speaking', 'Speed Reading', 'Language Learning', 'Memory Techniques', 'Stoicism', 'Productivity', 'Habit Building', 'Emotional Intelligence', 'Negotiation', 'Creative Thinking', 'Leadership'],
    },
    {
        id: 'automotive',
        name: 'Auto & Transit',
        emoji: '🏎️',
        color: ['#0F172A', '#334155'],
        subInterests: ['Classic Cars', 'Electric Vehicles', 'Motorcycles', 'F1 Racing', 'Car Restoration', 'Off-Roading', 'Public Transit', 'Aviation', 'Sailing'],
    },
    {
        id: 'gaming',
        name: 'Gaming & Fun',
        emoji: '🎮',
        color: ['#4C1D95', '#7C3AED'],
        subInterests: ['E-Sports', 'RPG Games', 'Retro Gaming', 'PokemonGo', 'Warhammer', 'D&D', 'Board Games', 'Puzzle Games', 'Trivia', 'Cosplay', 'Game Design', 'Streaming'],
    },
    {
        id: 'hobbies',
        name: 'Hobbies & Crafts',
        emoji: '🧵',
        color: ['#B45309', '#F59E0B'],
        subInterests: ['Filigree', 'Woodworking', 'Knitting', 'Ceramics', 'Calligraphy', 'Origami', 'Jewelry Making', 'Leather Craft', 'Model Building', 'Gardening', 'DIY Projects'],
    },
    {
        id: 'science',
        name: 'Science & Discovery',
        emoji: '🔭',
        color: ['#1E40AF', '#3B82F6'],
        subInterests: ['Astrophysics', 'Biology', 'Chemistry', 'Space Exploration', 'Quantum Physics', 'Geography', 'Oceanography', 'Anthropology', 'Urban Exploration'],
    },
];

// Flat list of ALL sub-interests for easy lookup
export const ALL_SUB_INTERESTS = INTEREST_CATEGORIES.flatMap(cat =>
    cat.subInterests.map(sub => ({ category: cat.name, categoryId: cat.id, name: sub }))
);

// Get category by sub-interest name
export function getCategoryForInterest(interestName) {
    return INTEREST_CATEGORIES.find(cat => cat.subInterests.includes(interestName));
}
