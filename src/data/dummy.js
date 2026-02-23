export const DUMMY_USERS = [
    {
        id: 'u1',
        name: 'Alice Cooper',
        username: '@alice_c',
        city: 'San Francisco, CA',
        bio: 'Software Engineer by day. Coffee addict by night.',
        interests: ['Tech', 'Coffee', 'Hiking'],
        avatar: 'https://i.pravatar.cc/150?img=1',
        isOnline: true,
    },
    {
        id: 'u2',
        name: 'Bob Marley',
        username: '@bob_m',
        city: 'Seattle, WA',
        bio: 'Music producer, traveler, always looking for a good time!',
        interests: ['Music', 'Travel', 'Food'],
        avatar: 'https://i.pravatar.cc/150?img=11',
        isOnline: false,
    },
    {
        id: 'u3',
        name: 'Charlie Brown',
        username: '@charlie_b',
        city: 'Austin, TX',
        bio: 'Startup founder building the next big thing.',
        interests: ['Startups', 'Networking', 'Books'],
        avatar: 'https://i.pravatar.cc/150?img=15',
        isOnline: true,
    },
    {
        id: 'u4',
        name: 'Diana Prince',
        username: '@diana_p',
        city: 'New York, NY',
        bio: 'Art enthusiast and museum curator. Love exploring the city.',
        interests: ['Art', 'Museums', 'Photography'],
        avatar: 'https://i.pravatar.cc/150?img=16',
        isOnline: false,
    },
    {
        id: 'u5',
        name: 'Evan Davis',
        username: '@evan_d',
        city: 'Chicago, IL',
        bio: 'Fitness coach. Let us work out together!',
        interests: ['Fitness', 'Health', 'Sports'],
        avatar: 'https://i.pravatar.cc/150?img=12',
        isOnline: true,
    }
];

export const DUMMY_FEED = [
    {
        id: 'p1',
        user: DUMMY_USERS[2],
        image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        location: 'SXSW Tech Conference',
        details: 'Just arrived at SXSW! Who else is around here? Let\'s grab a coffee and chat about startups.',
        likes: 124,
        comments: 18,
        time: '2h ago'
    },
    {
        id: 'p2',
        user: DUMMY_USERS[3],
        image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        location: 'Metropolitan Museum of Art',
        details: 'Exploring the new contemporary exhibit. It is absolutely breathtaking. Highly recommend visiting if you are in NYC this weekend!',
        likes: 89,
        comments: 5,
        time: '5h ago'
    },
    {
        id: 'p3',
        user: DUMMY_USERS[0],
        image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        location: 'Blue Bottle Coffee',
        details: 'Coding session fueled by the best cortado in town. ☕️ Building something exciting!',
        likes: 245,
        comments: 32,
        time: '1d ago'
    }
];

export const DUMMY_CHATS = [
    {
        id: 'c1',
        user: DUMMY_USERS[0],
        lastMessage: 'Sounds great! See you at 5.',
        timestamp: '10:30 AM',
        unreadCount: 0,
        messages: [
            { id: 'm1', text: 'Hey, are we still meeting for coffee later?', sender: 'them', time: '10:15 AM' },
            { id: 'm2', text: 'Yes! Does 5 PM work for you?', sender: 'me', time: '10:20 AM' },
            { id: 'm3', text: 'Sounds great! See you at 5.', sender: 'them', time: '10:30 AM' },
        ]
    },
    {
        id: 'c2',
        user: DUMMY_USERS[1],
        lastMessage: 'Bro, you have to check out this new track I produced!',
        timestamp: 'Yesterday',
        unreadCount: 2,
        messages: [
            { id: 'm1', text: 'Yo man!', sender: 'them', time: 'Yesterday 2:00 PM' },
            { id: 'm2', text: 'Bro, you have to check out this new track I produced!', sender: 'them', time: 'Yesterday 2:05 PM' },
        ]
    },
    {
        id: 'c3',
        user: DUMMY_USERS[4],
        lastMessage: 'Don\'t skip leg day!',
        timestamp: 'Monday',
        unreadCount: 0,
        messages: [
            { id: 'm1', text: 'Don\'t skip leg day!', sender: 'them', time: 'Monday' },
        ]
    }
];

export const DUMMY_NOTIFICATIONS = [
    {
        id: 'n1',
        user: DUMMY_USERS[3],
        type: 'like',
        content: 'liked your post from Blue Bottle Coffee.',
        time: '10m ago',
        read: false,
    },
    {
        id: 'n2',
        user: DUMMY_USERS[2],
        type: 'match',
        content: 'wants to connect with you.',
        time: '1h ago',
        read: false,
    },
    {
        id: 'n3',
        user: DUMMY_USERS[1],
        type: 'comment',
        content: 'commented: "That looks amazing!"',
        time: '3h ago',
        read: true,
    }
];
