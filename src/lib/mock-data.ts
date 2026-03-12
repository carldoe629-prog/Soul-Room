// Mock data for Soul Room application — 10x VP denomination
// Exchange rate: 1 USD ≈ 1,000 VP

export interface User {
  id: string;
  displayName: string;
  age: number;
  gender: string;
  bio: string;
  city: string;
  country: string;
  languages: string[];
  interests: string[];
  photos: string[];
  isVerified: boolean;
  vibeRating: number;
  vibeRatingCount: number;
  subscriptionTier: 'free' | 'plus' | 'premium' | 'vip';
  lookingFor: string;
  isOnline: boolean;
  lastSeen?: string;
  lastOnlineMinutes?: number; // 0 = online now, >0 = minutes since
  homeWorld: string;
  height?: string;
  education?: string;
  occupation?: string;
  vibePoints: number;
  trustScore: number;
  profileCompleteness: number;
  matchScore?: number;
  isNew?: boolean; // joined < 7 days
  vipLevel: number; // 0-8 (Newcomer to Mythic)
  totalXp: number;
  album: string[];
}

export interface World {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  description: string;
  memberCount: number;
  activeRoomCount: number;
  colorPrimary: string;
  colorSecondary: string;
  topics: string[];
}

export interface VoiceRoom {
  id: string;
  worldId: string;
  title: string;
  hostName: string;
  hostAvatar: string;
  hostRating: number;
  speakerCount: number;
  listenerCount: number;
  isLive: boolean;
  isTrending?: boolean;
  topics: string[];
  startedMinutesAgo: number;
}

export interface SparkMatch {
  id: string;
  user: User;
  matchScore: number;
  sharedInterests: string[];
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'voice_note' | 'vault_image' | 'gift' | 'system';
  timestamp: string;
  isRead: boolean;
  giftEmoji?: string;
  giftName?: string;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface GiftType {
  id: string;
  name: string;
  emoji: string;
  vpCost: number;
  usdEquivalent: number;
  description: string;
  tier: 1 | 2 | 3 | 4;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  vpReward: number;
  progress: number;
  target: number;
  isCompleted: boolean;
}

export interface InterestTag {
  id: string;
  tag: string;
  emoji: string;
  category: string;
}

export interface WorldEvent {
  id: string;
  title: string;
  worldName: string;
  worldEmoji: string;
  hostName: string;
  dateTime: string;
  goingCount: number;
}

// ===== MOCK USERS (12 for feed variety) =====
export const MOCK_USERS: User[] = [
  {
    id: 'u1', displayName: 'Grace', age: 22, gender: 'Female',
    bio: 'Life is too short to be boring 💃 Laughing is my cardio. Feed me jollof rice and I\'m yours forever 🍚',
    city: 'Lagos', country: 'Nigeria', languages: ['English', 'Yoruba', 'Pidgin'],
    interests: ['Afrobeats', 'Travel', 'Cooking', 'Photography', 'Dance', 'Wellness'],
    photos: ['/avatars/grace.jpg'], isVerified: true, vibeRating: 4.6, vibeRatingCount: 43,
    subscriptionTier: 'free', lookingFor: 'Both', isOnline: true, lastOnlineMinutes: 0,
    homeWorld: 'Music World', height: '5\'6" (168 cm)', education: 'University of Lagos',
    occupation: 'Content Creator', vibePoints: 24500, trustScore: 92, profileCompleteness: 95,
    matchScore: 85, vipLevel: 5, totalXp: 120000, album: ['/avatars/grace.jpg'],
  },
  {
    id: 'u2', displayName: 'Emmanuel', age: 25, gender: 'Male',
    bio: 'Musician by night, coder by day 🎵💻 Finding beats in everything',
    city: 'Lagos', country: 'Nigeria', languages: ['English', 'Igbo'],
    interests: ['Music', 'Technology', 'Gaming', 'Fitness', 'Afrobeats', 'Comedy'],
    photos: ['/avatars/emmanuel.jpg'], isVerified: true, vibeRating: 4.8, vibeRatingCount: 87,
    subscriptionTier: 'plus', lookingFor: 'Dating', isOnline: true, lastOnlineMinutes: 0,
    homeWorld: 'Music World', height: '5\'11" (180 cm)', education: 'UNILAG',
    occupation: 'Software Developer', vibePoints: 18000, trustScore: 88, profileCompleteness: 100,
    matchScore: 92, vipLevel: 4, totalXp: 48000, album: ['/avatars/emmanuel.jpg'],
  },
  {
    id: 'u3', displayName: 'Fatima', age: 24, gender: 'Female',
    bio: 'Books, tea, deep conversations ☕📚 Looking for someone who values substance over surface',
    city: 'Cairo', country: 'Egypt', languages: ['Arabic', 'English'],
    interests: ['Books', 'Art', 'Faith', 'Photography', 'Travel', 'Writing'],
    photos: ['/avatars/fatima.jpg'], isVerified: false, vibeRating: 4.3, vibeRatingCount: 21,
    subscriptionTier: 'free', lookingFor: 'Dating', isOnline: false, lastOnlineMinutes: 15,
    lastSeen: '15 min ago', homeWorld: 'Books & Learning',
    occupation: 'Student', vibePoints: 4500, trustScore: 65, profileCompleteness: 75,
    matchScore: 76, vipLevel: 1, totalXp: 2200, album: ['/avatars/fatima.jpg'],
  },
  {
    id: 'u4', displayName: 'David', age: 26, gender: 'Male',
    bio: 'Numbers don\'t lie but people do. Looking for authenticity in a filtered world 📊',
    city: 'Nairobi', country: 'Kenya', languages: ['English', 'Swahili'],
    interests: ['Business', 'Fitness', 'Travel', 'Wine/Food', 'Technology', 'Sports'],
    photos: ['/avatars/david.jpg'], isVerified: true, vibeRating: 4.6, vibeRatingCount: 112,
    subscriptionTier: 'vip', lookingFor: 'Dating', isOnline: true, lastOnlineMinutes: 0,
    homeWorld: 'Business & Money', height: '6\'1" (185 cm)', education: 'University of Nairobi',
    occupation: 'Financial Analyst', vibePoints: 52000, trustScore: 95, profileCompleteness: 100,
    matchScore: 82, vipLevel: 6, totalXp: 312000, album: ['/avatars/david.jpg'],
  },
  {
    id: 'u5', displayName: 'Amina', age: 21, gender: 'Female',
    bio: 'Fashion is art, and I\'m the canvas 💄 Embracing every shade of beautiful',
    city: 'Accra', country: 'Ghana', languages: ['English', 'French', 'Twi'],
    interests: ['Fashion', 'Art', 'Photography', 'Travel', 'Cooking', 'Dance'],
    photos: ['/avatars/amina.jpg'], isVerified: true, vibeRating: 4.9, vibeRatingCount: 203,
    subscriptionTier: 'premium', lookingFor: 'Both', isOnline: false, lastOnlineMinutes: 30,
    lastSeen: '30 min ago', homeWorld: 'Lifestyle & Fashion',
    height: '5\'7" (170 cm)', occupation: 'Fashion Designer',
    vibePoints: 31000, trustScore: 90, profileCompleteness: 90,
    matchScore: 79, vipLevel: 4, totalXp: 52000, album: ['/avatars/amina.jpg'],
  },
  {
    id: 'u6', displayName: 'Kwame', age: 28, gender: 'Male',
    bio: 'Beats in my head, bass in my chest. DJ by night, dreamer by day 🎧',
    city: 'Accra', country: 'Ghana', languages: ['English', 'Twi'],
    interests: ['Music', 'DJing', 'Nightlife', 'Gaming', 'Fitness', 'Comedy'],
    photos: ['/avatars/kwame.jpg'], isVerified: true, vibeRating: 4.7, vibeRatingCount: 178,
    subscriptionTier: 'plus', lookingFor: 'Both', isOnline: true, lastOnlineMinutes: 0,
    homeWorld: 'Music World', occupation: 'DJ / Producer',
    vibePoints: 19000, trustScore: 85, profileCompleteness: 85,
    matchScore: 88, vipLevel: 3, totalXp: 21000, album: ['/avatars/kwame.jpg'],
  },
  {
    id: 'u7', displayName: 'Priya', age: 23, gender: 'Female',
    bio: 'Wanderlust soul 🌍 Music keeps me alive, chai keeps me awake ✨',
    city: 'Mumbai', country: 'India', languages: ['Hindi', 'English', 'Marathi'],
    interests: ['Music', 'Travel', 'Photography', 'Cooking', 'Yoga', 'Wellness'],
    photos: ['/avatars/priya.jpg'], isVerified: false, vibeRating: 4.2, vibeRatingCount: 34,
    subscriptionTier: 'free', lookingFor: 'Friends', isOnline: true, lastOnlineMinutes: 0,
    homeWorld: 'Travel World', occupation: 'Student',
    vibePoints: 6500, trustScore: 70, profileCompleteness: 80,
    matchScore: 73, vipLevel: 1, totalXp: 1500, album: ['/avatars/priya.jpg'],
  },
  {
    id: 'u8', displayName: 'Sarah', age: 23, gender: 'Female',
    bio: 'Singing in the shower counts as practice, right? 🎤 Dog mom 🐶',
    city: 'Lagos', country: 'Nigeria', languages: ['English', 'Yoruba'],
    interests: ['Singing', 'Dogs', 'Cooking', 'Faith', 'Comedy', 'Movies'],
    photos: ['/avatars/sarah.jpg'], isVerified: true, vibeRating: 4.5, vibeRatingCount: 67,
    subscriptionTier: 'plus', lookingFor: 'Dating', isOnline: true, lastOnlineMinutes: 0,
    homeWorld: 'Music World', occupation: 'Nurse',
    vibePoints: 12000, trustScore: 82, profileCompleteness: 90,
    matchScore: 87, vipLevel: 2, totalXp: 8500, album: ['/avatars/sarah.jpg'],
  },
  {
    id: 'u9', displayName: 'John', age: 28, gender: 'Male',
    bio: 'Exploring the intersection of tech and art. Cyberpunk enthusiast 🤖',
    city: 'Accra', country: 'Ghana', languages: ['English', 'Ga'],
    interests: ['Technology', 'Art', 'Gaming', 'Movies', 'Photography', 'Fitness'],
    photos: ['/avatars/john.jpg'], isVerified: false, vibeRating: 4.1, vibeRatingCount: 19,
    subscriptionTier: 'free', lookingFor: 'Both', isOnline: false, lastOnlineMinutes: 45,
    lastSeen: '45 min ago', homeWorld: 'Tech & Innovation',
    occupation: 'Graphic Designer', vibePoints: 3200, trustScore: 60, profileCompleteness: 70,
    matchScore: 75, vipLevel: 0, totalXp: 600, album: ['/avatars/john.jpg'],
  },
  // New members
  {
    id: 'u10', displayName: 'Zara', age: 20, gender: 'Female',
    bio: 'Just joined! Looking to meet cool people ✨',
    city: 'Abuja', country: 'Nigeria', languages: ['English', 'Hausa'],
    interests: ['Music', 'Fashion', 'Dance', 'Travel'],
    photos: ['/avatars/zara.jpg'], isVerified: false, vibeRating: 0, vibeRatingCount: 0,
    subscriptionTier: 'free', lookingFor: 'Friends', isOnline: true, lastOnlineMinutes: 0,
    homeWorld: 'Music World', occupation: 'Student',
    vibePoints: 1000, trustScore: 50, profileCompleteness: 60,
    matchScore: 68, isNew: true, vipLevel: 0, totalXp: 100, album: ['/avatars/zara.jpg'],
  },
  {
    id: 'u11', displayName: 'Kofi', age: 24, gender: 'Male',
    bio: 'New here 🙋🏾‍♂️ Love football, food, and good vibes',
    city: 'Accra', country: 'Ghana', languages: ['English', 'Twi'],
    interests: ['Sports', 'Cooking', 'Music', 'Fitness'],
    photos: ['/avatars/kofi.jpg'], isVerified: false, vibeRating: 0, vibeRatingCount: 0,
    subscriptionTier: 'free', lookingFor: 'Both', isOnline: true, lastOnlineMinutes: 0,
    homeWorld: 'Fitness & Wellness', occupation: 'Chef',
    vibePoints: 1000, trustScore: 50, profileCompleteness: 55,
    matchScore: 71, isNew: true, vipLevel: 0, totalXp: 150, album: ['/avatars/kofi.jpg'],
  },
  {
    id: 'u12', displayName: 'Nadia', age: 22, gender: 'Female',
    bio: 'Dubai girl looking for real conversations 💬',
    city: 'Dubai', country: 'UAE', languages: ['Arabic', 'English'],
    interests: ['Travel', 'Fashion', 'Art', 'Photography'],
    photos: ['/avatars/nadia.jpg'], isVerified: false, vibeRating: 0, vibeRatingCount: 0,
    subscriptionTier: 'free', lookingFor: 'Friends', isOnline: false, lastOnlineMinutes: 5,
    lastSeen: '5 min ago', homeWorld: 'Travel World', occupation: 'Student',
    vibePoints: 1000, trustScore: 50, profileCompleteness: 65,
    matchScore: 74, isNew: true, vipLevel: 0, totalXp: 80, album: ['/avatars/nadia.jpg'],
  },
];

export const CURRENT_USER: User = {
  id: 'me', displayName: 'You', age: 24, gender: 'Female',
  bio: 'Explorer of souls and collector of moments 💜',
  city: 'Lagos', country: 'Nigeria', languages: ['English', 'Yoruba'],
  interests: ['Music', 'Travel', 'Photography', 'Cooking', 'Books', 'Fitness'],
  photos: ['/avatars/me.jpg'], isVerified: true, vibeRating: 4.3, vibeRatingCount: 45,
  subscriptionTier: 'free', lookingFor: 'Both', isOnline: true, lastOnlineMinutes: 0,
  homeWorld: 'Music World', occupation: 'Designer',
  vibePoints: 12500, trustScore: 80, profileCompleteness: 85,
  vipLevel: 3, totalXp: 15420, album: ['/avatars/me.jpg']
};

// ===== WORLDS =====
export const MOCK_WORLDS: World[] = [
  { id: 'w1', name: 'Music World', slug: 'music', emoji: '🎵', description: 'Where every conversation has a soundtrack', memberCount: 23456, activeRoomCount: 12, colorPrimary: '#FF4B6E', colorSecondary: '#FF8D5C', topics: ['Afrobeats', 'R&B', 'Hip Hop', 'Gospel', 'Pop', 'Jazz', 'K-Pop'] },
  { id: 'w2', name: 'Books & Learning', slug: 'books', emoji: '📚', description: 'Feed your mind, find your people', memberCount: 15234, activeRoomCount: 5, colorPrimary: '#4B9FFF', colorSecondary: '#6BB5FF', topics: ['Fiction', 'Non-fiction', 'Self-help', 'Poetry', 'Book Clubs'] },
  { id: 'w3', name: 'Gaming World', slug: 'gaming', emoji: '🎮', description: 'Squad up, level up', memberCount: 18901, activeRoomCount: 8, colorPrimary: '#00E5A0', colorSecondary: '#00FFB8', topics: ['Mobile Gaming', 'Console', 'PC', 'Esports'] },
  { id: 'w4', name: 'Travel World', slug: 'travel', emoji: '✈️', description: 'Explore the world through conversation', memberCount: 12567, activeRoomCount: 4, colorPrimary: '#FFB84B', colorSecondary: '#FFD280', topics: ['Budget Travel', 'Adventure', 'Cultural Exchange', 'Foodie Travel'] },
  { id: 'w5', name: 'Faith & Spirituality', slug: 'faith', emoji: '🙏', description: 'Connect with kindred spirits', memberCount: 9876, activeRoomCount: 6, colorPrimary: '#C4B5FD', colorSecondary: '#DDD6FE', topics: ['Christianity', 'Islam', 'Hinduism', 'Meditation'] },
  { id: 'w6', name: 'Tech & Innovation', slug: 'tech', emoji: '💻', description: 'Build the future, together', memberCount: 21345, activeRoomCount: 9, colorPrimary: '#4B9FFF', colorSecondary: '#8BC4FF', topics: ['Programming', 'AI', 'Startups', 'Design'] },
  { id: 'w7', name: 'Fitness & Wellness', slug: 'fitness', emoji: '💪', description: 'Stronger together', memberCount: 11234, activeRoomCount: 3, colorPrimary: '#00E5A0', colorSecondary: '#4BFFCA', topics: ['Gym', 'Yoga', 'Running', 'Mental Health'] },
  { id: 'w8', name: 'Entertainment', slug: 'entertainment', emoji: '🎬', description: 'Lights, camera, conversation', memberCount: 16789, activeRoomCount: 7, colorPrimary: '#FF4B6E', colorSecondary: '#FF6B8A', topics: ['Movies', 'TV Shows', 'Nollywood', 'Anime', 'K-Drama'] },
  { id: 'w9', name: 'Business & Money', slug: 'business', emoji: '💰', description: 'Network your net worth', memberCount: 14567, activeRoomCount: 5, colorPrimary: '#FFB84B', colorSecondary: '#FFC966', topics: ['Entrepreneurship', 'Investing', 'Side Hustles', 'Career Growth'] },
  { id: 'w10', name: 'Lifestyle & Fashion', slug: 'lifestyle', emoji: '💄', description: 'Express yourself', memberCount: 13456, activeRoomCount: 4, colorPrimary: '#FF8D5C', colorSecondary: '#FFB088', topics: ['Fashion', 'Beauty', 'Food & Cooking', 'Pets'] },
];

// ===== VOICE ROOMS =====
export const MOCK_ROOMS: VoiceRoom[] = [
  { id: 'r1', worldId: 'w1', title: 'Late Night Vibes 🌙', hostName: 'MelodyQueen', hostAvatar: '/avatars/host1.jpg', hostRating: 4, speakerCount: 5, listenerCount: 45, isLive: true, topics: ['R&B', 'Neo-Soul', 'Chill'], startedMinutesAgo: 45 },
  { id: 'r2', worldId: 'w1', title: 'Afrobeats vs Amapiano — THE DEBATE 🔥', hostName: 'BassBoy', hostAvatar: '/avatars/host2.jpg', hostRating: 3, speakerCount: 8, listenerCount: 78, isLive: true, isTrending: true, topics: ['Afrobeats', 'Amapiano', 'African Music'], startedMinutesAgo: 120 },
  { id: 'r3', worldId: 'w6', title: 'Code Together 💻', hostName: 'TechAhmed', hostAvatar: '/avatars/host3.jpg', hostRating: 4, speakerCount: 3, listenerCount: 18, isLive: true, topics: ['Programming', 'React'], startedMinutesAgo: 30 },
  { id: 'r4', worldId: 'w1', title: 'Guitar Players Only 🎸', hostName: 'StringsNg', hostAvatar: '/avatars/host4.jpg', hostRating: 3, speakerCount: 2, listenerCount: 8, isLive: true, topics: ['Guitar', 'Acoustic'], startedMinutesAgo: 15 },
  { id: 'r5', worldId: 'w8', title: 'Nollywood vs Bollywood 🎬', hostName: 'CineFan', hostAvatar: '/avatars/host5.jpg', hostRating: 4, speakerCount: 5, listenerCount: 32, isLive: true, topics: ['Movies', 'Debate'], startedMinutesAgo: 60 },
  { id: 'r6', worldId: 'w9', title: 'Side Hustle Ideas 💡', hostName: 'BizDavid', hostAvatar: '/avatars/host6.jpg', hostRating: 5, speakerCount: 3, listenerCount: 27, isLive: true, topics: ['Business', 'Money'], startedMinutesAgo: 90 },
];

// ===== SPARK MATCHES =====
export const MOCK_SPARK_MATCHES: SparkMatch[] = [
  { id: 'sm1', user: MOCK_USERS[0], matchScore: 85, sharedInterests: ['Travel', 'Cooking', 'Photography'] },
  { id: 'sm2', user: MOCK_USERS[3], matchScore: 82, sharedInterests: ['Fitness', 'Travel'] },
  { id: 'sm3', user: MOCK_USERS[4], matchScore: 79, sharedInterests: ['Photography', 'Travel'] },
  { id: 'sm4', user: MOCK_USERS[8], matchScore: 75, sharedInterests: ['Photography', 'Fitness'] },
];

// ===== CONVERSATIONS =====
export const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 'c1', user: MOCK_USERS[0], lastMessage: 'Haha that voice room was so fun! 😂', lastMessageTime: '2 min ago', unreadCount: 3 },
  { id: 'c2', user: MOCK_USERS[5], lastMessage: 'Check out this new beat I made', lastMessageTime: '25 min ago', unreadCount: 1 },
  { id: 'c3', user: MOCK_USERS[2], lastMessage: 'The book club discussion was amazing', lastMessageTime: '1 hour ago', unreadCount: 0 },
  { id: 'c4', user: MOCK_USERS[4], lastMessage: '🔒 Vault Photo', lastMessageTime: '3 hours ago', unreadCount: 0 },
  { id: 'c5', user: MOCK_USERS[3], lastMessage: 'Let me know when you join the room!', lastMessageTime: 'Yesterday', unreadCount: 0 },
];

// ===== MESSAGES =====
export const MOCK_MESSAGES: Record<string, Message[]> = {
  c1: [
    { id: 'm1', senderId: 'u1', content: 'Hey! I saw you in Music World earlier 👋', type: 'text', timestamp: '8:30 PM', isRead: true },
    { id: 'm2', senderId: 'me', content: 'Yes! That Afrobeats room was fire 🔥', type: 'text', timestamp: '8:32 PM', isRead: true },
    { id: 'm3', senderId: 'u1', content: 'Right?! DJ Kwame always kills it', type: 'text', timestamp: '8:33 PM', isRead: true },
    { id: 'm4', senderId: 'me', content: 'Do you have any playlist recs?', type: 'text', timestamp: '8:35 PM', isRead: true },
    { id: 'm5', senderId: 'u1', content: '', type: 'voice_note', timestamp: '8:37 PM', isRead: true },
    { id: 'm6', senderId: 'u1', content: 'Haha that voice room was so fun! 😂', type: 'text', timestamp: '8:40 PM', isRead: false },
    { id: 'm7', senderId: 'u1', content: '', type: 'vault_image', timestamp: '8:41 PM', isRead: false },
    { id: 'm8', senderId: 'u1', content: '', type: 'gift', timestamp: '8:42 PM', isRead: false, giftEmoji: '🌹', giftName: 'Rose' },
  ],
};

// ===== GIFT TYPES (28 gifts, 4 tiers) =====
export const GIFT_TYPES: GiftType[] = [
  // Tier 1 — Casual ($0.10 - $0.50)
  { id: 'g1', name: 'Wave', emoji: '👋', vpCost: 100, usdEquivalent: 0.10, description: 'Hey there!', tier: 1 },
  { id: 'g2', name: 'Heart', emoji: '❤️', vpCost: 150, usdEquivalent: 0.15, description: "You're sweet", tier: 1 },
  { id: 'g3', name: 'LOL', emoji: '😂', vpCost: 150, usdEquivalent: 0.15, description: 'You cracked me up', tier: 1 },
  { id: 'g4', name: 'Rose', emoji: '🌹', vpCost: 200, usdEquivalent: 0.20, description: 'I appreciate you', tier: 1 },
  { id: 'g5', name: 'Star', emoji: '⭐', vpCost: 250, usdEquivalent: 0.25, description: "You're a star", tier: 1 },
  { id: 'g6', name: 'Fire', emoji: '🔥', vpCost: 300, usdEquivalent: 0.30, description: "You're on fire", tier: 1 },
  { id: 'g7', name: 'Chocolate', emoji: '🍫', vpCost: 300, usdEquivalent: 0.30, description: 'Something sweet', tier: 1 },
  { id: 'g8', name: 'Flower Bouquet', emoji: '🌺', vpCost: 400, usdEquivalent: 0.40, description: 'For you', tier: 1 },
  { id: 'g9', name: 'Coffee', emoji: '☕', vpCost: 500, usdEquivalent: 0.50, description: "Let's chat more", tier: 1 },
  //  Tier 2 — Affection ($1.00 - $5.00)
  { id: 'g10', name: 'Melody', emoji: '🎵', vpCost: 1000, usdEquivalent: 1.00, description: 'Your voice is amazing', tier: 2 },
  { id: 'g11', name: 'Teddy Bear', emoji: '🧸', vpCost: 1000, usdEquivalent: 1.00, description: 'Warm hugs', tier: 2 },
  { id: 'g12', name: 'Birthday Cake', emoji: '🎂', vpCost: 1500, usdEquivalent: 1.50, description: 'Celebrate you', tier: 2 },
  { id: 'g13', name: 'Kiss', emoji: '💋', vpCost: 1500, usdEquivalent: 1.50, description: 'XOXO', tier: 2 },
  { id: 'g14', name: 'Moonlight', emoji: '🌙', vpCost: 2000, usdEquivalent: 2.00, description: 'You light up my night', tier: 2 },
  { id: 'g15', name: 'Guitar', emoji: '🎸', vpCost: 2000, usdEquivalent: 2.00, description: 'A song for you', tier: 2 },
  { id: 'g16', name: 'Promise Ring', emoji: '💍', vpCost: 3000, usdEquivalent: 3.00, description: "I'm serious about you", tier: 2 },
  { id: 'g17', name: 'Fireworks', emoji: '🎆', vpCost: 3000, usdEquivalent: 3.00, description: 'You spark something', tier: 2 },
  { id: 'g18', name: 'Butterflies', emoji: '🦋', vpCost: 3500, usdEquivalent: 3.50, description: 'You give me butterflies', tier: 2 },
  { id: 'g19', name: 'Crown', emoji: '👑', vpCost: 5000, usdEquivalent: 5.00, description: "You're royalty", tier: 2 },
  // Tier 3 — Luxury ($10.00 - $20.00)
  { id: 'g20', name: 'Diamond', emoji: '💎', vpCost: 10000, usdEquivalent: 10.00, description: "You're priceless", tier: 3 },
  { id: 'g21', name: 'Sports Car', emoji: '🏎️', vpCost: 10000, usdEquivalent: 10.00, description: 'Ride with me', tier: 3 },
  { id: 'g22', name: 'World Trip', emoji: '🌍', vpCost: 12000, usdEquivalent: 12.00, description: "Let's explore together", tier: 3 },
  { id: 'g23', name: 'Island', emoji: '🏝️', vpCost: 15000, usdEquivalent: 15.00, description: 'Our own paradise', tier: 3 },
  { id: 'g24', name: 'Castle', emoji: '🏰', vpCost: 20000, usdEquivalent: 20.00, description: 'You deserve a kingdom', tier: 3 },
  { id: 'g25', name: 'Private Jet', emoji: '✈️', vpCost: 20000, usdEquivalent: 20.00, description: "Sky's the limit", tier: 3 },
  // Tier 4 — Legendary ($50.00 - $100.00)
  { id: 'g26', name: 'Rocket', emoji: '🚀', vpCost: 50000, usdEquivalent: 50.00, description: 'To the moon together', tier: 4 },
  { id: 'g27', name: 'Galaxy', emoji: '🌌', vpCost: 75000, usdEquivalent: 75.00, description: "You're my universe", tier: 4 },
  { id: 'g28', name: 'Supernova', emoji: '💫', vpCost: 100000, usdEquivalent: 100.00, description: 'The biggest gesture', tier: 4 },
];

// ===== DAILY CHALLENGES (10x VP) =====
export const MOCK_CHALLENGES: DailyChallenge[] = [
  { id: 'dc1', title: 'Join a voice room', description: 'Spend 10 minutes in any voice room', emoji: '🎤', vpReward: 200, progress: 0, target: 10, isCompleted: false },
  { id: 'dc2', title: 'Send a message', description: 'Send a message to a new connection', emoji: '💬', vpReward: 200, progress: 1, target: 1, isCompleted: true },
  { id: 'dc3', title: 'Give a Good Vibe', description: 'Rate someone after a conversation', emoji: '⭐', vpReward: 200, progress: 0, target: 1, isCompleted: false },
];

// ===== EVENTS =====
export const MOCK_EVENTS: WorldEvent[] = [
  { id: 'e1', title: 'Friday Night Karaoke', worldName: 'Music World', worldEmoji: '🎵', hostName: 'MelodyQueen', dateTime: 'Friday 8PM WAT', goingCount: 156 },
  { id: 'e2', title: 'Monthly Book Club: "Americanah"', worldName: 'Books & Learning', worldEmoji: '📚', hostName: 'Soul Room Official', dateTime: 'Saturday 5PM WAT', goingCount: 42 },
];

// ===== INTEREST TAGS =====
export const INTEREST_TAGS: InterestTag[] = [
  { id: 'i1', tag: 'Music', emoji: '🎵', category: 'Entertainment' },
  { id: 'i2', tag: 'Books', emoji: '📚', category: 'Education' },
  { id: 'i3', tag: 'Gaming', emoji: '🎮', category: 'Entertainment' },
  { id: 'i4', tag: 'Travel', emoji: '✈️', category: 'Lifestyle' },
  { id: 'i5', tag: 'Fitness', emoji: '🏋️', category: 'Wellness' },
  { id: 'i6', tag: 'Movies', emoji: '🎬', category: 'Entertainment' },
  { id: 'i7', tag: 'Cooking', emoji: '🍳', category: 'Lifestyle' },
  { id: 'i8', tag: 'Photography', emoji: '📸', category: 'Creative' },
  { id: 'i9', tag: 'Faith', emoji: '🙏', category: 'Spirituality' },
  { id: 'i10', tag: 'Technology', emoji: '💻', category: 'Education' },
  { id: 'i11', tag: 'Art', emoji: '🎨', category: 'Creative' },
  { id: 'i12', tag: 'Sports', emoji: '⚽', category: 'Wellness' },
  { id: 'i13', tag: 'Fashion', emoji: '💄', category: 'Lifestyle' },
  { id: 'i14', tag: 'Pets', emoji: '🐾', category: 'Lifestyle' },
  { id: 'i15', tag: 'Business', emoji: '💰', category: 'Education' },
  { id: 'i16', tag: 'Writing', emoji: '📝', category: 'Creative' },
  { id: 'i17', tag: 'Comedy', emoji: '🎭', category: 'Entertainment' },
  { id: 'i18', tag: 'Culture', emoji: '🌍', category: 'Lifestyle' },
  { id: 'i19', tag: 'Singing', emoji: '🎤', category: 'Creative' },
  { id: 'i20', tag: 'Dance', emoji: '💃', category: 'Creative' },
  { id: 'i21', tag: 'Wellness', emoji: '🧘', category: 'Wellness' },
  { id: 'i22', tag: 'Nature', emoji: '🌱', category: 'Lifestyle' },
  { id: 'i23', tag: 'Self Growth', emoji: '🎯', category: 'Wellness' },
  { id: 'i24', tag: 'Dogs', emoji: '🐶', category: 'Lifestyle' },
  { id: 'i25', tag: 'Cats', emoji: '🐱', category: 'Lifestyle' },
  { id: 'i26', tag: 'Wine/Food', emoji: '🍷', category: 'Lifestyle' },
  { id: 'i27', tag: 'Afrobeats', emoji: '🥁', category: 'Music' },
  { id: 'i28', tag: 'Romance', emoji: '❤️', category: 'Lifestyle' },
  { id: 'i29', tag: 'Beach Life', emoji: '🏖️', category: 'Lifestyle' },
  { id: 'i30', tag: 'Nightlife', emoji: '🌃', category: 'Lifestyle' },
];

// ===== SUBSCRIPTION TIERS (Revised) =====
export const SUBSCRIPTION_TIERS = [
  {
    id: 'free', name: 'Free', price: 0, annualPrice: 0, badge: '', color: '#6B6B8A',
    sayHiFreePerDay: 3, sayHiVpCost: 200, strangerReplyCost: 50, monthlyVpBonus: 0,
    features: [
      { text: '3 Say Hi / day', included: true },
      { text: 'Stranger reply: 50 VP', included: true },
      { text: '1 Spark round/day', included: true },
      { text: 'Chat (connections): FREE', included: true },
      { text: '5 min voice/day', included: true },
      { text: 'Video calls', included: false },
      { text: 'Speak in rooms', included: false },
      { text: 'See who liked you', included: false },
      { text: 'Translation', included: false },
      { text: 'Invisible mode', included: false },
      { text: 'Join 3 Worlds', included: true },
      { text: 'Contains ads', included: true },
    ],
  },
  {
    id: 'plus', name: 'Spark Plus', price: 7.99, annualPrice: 5.99, badge: '⭐', color: '#FFB84B',
    sayHiFreePerDay: 15, sayHiVpCost: 100, strangerReplyCost: 20, monthlyVpBonus: 3000,
    features: [
      { text: '15 Say Hi / day', included: true },
      { text: 'Stranger reply: 20 VP', included: true },
      { text: '5 Spark rounds/day', included: true },
      { text: 'Chat (connections): FREE', included: true },
      { text: '60 min voice / 15 min video', included: true },
      { text: 'Speak in rooms', included: true },
      { text: 'See who liked you', included: true },
      { text: 'Read receipts', included: true },
      { text: 'Advanced search filters', included: true },
      { text: 'Join ALL Worlds', included: true },
      { text: 'No ads + 3,000 VP/mo', included: true },
      { text: 'Invisible mode', included: false },
    ],
  },
  {
    id: 'premium', name: 'Spark Premium', price: 19.99, annualPrice: 14.99, badge: '💎', color: '#8B5CF6',
    sayHiFreePerDay: 50, sayHiVpCost: 50, strangerReplyCost: 0, monthlyVpBonus: 7000,
    features: [
      { text: '50 Say Hi / day', included: true },
      { text: 'Stranger messaging: FREE', included: true },
      { text: 'Unlimited Sparks', included: true },
      { text: 'Chat (connections): FREE', included: true },
      { text: 'Unlimited voice / 60 min video', included: true },
      { text: 'Real-time translation', included: true },
      { text: 'Private rooms + Host events', included: true },
      { text: 'Invisible mode', included: true },
      { text: 'Undo accidental Pass', included: true },
      { text: '1 free Boost/week', included: true },
      { text: 'Join ALL Worlds', included: true },
      { text: 'No ads + 7,000 VP/mo', included: true },
    ],
  },
  {
    id: 'vip', name: 'Spark VIP', price: 39.99, annualPrice: 29.99, badge: '👑', color: '#FF4B6E',
    sayHiFreePerDay: Infinity, sayHiVpCost: 0, strangerReplyCost: 0, monthlyVpBonus: 15000,
    features: [
      { text: 'Unlimited Say Hi (FREE)', included: true },
      { text: 'DM anyone without match', included: true },
      { text: 'Unlimited everything', included: true },
      { text: 'Chat (connections): FREE', included: true },
      { text: 'Unlimited voice + video', included: true },
      { text: 'AI matchmaking concierge', included: true },
      { text: 'VIP rooms & events', included: true },
      { text: 'See profile viewers', included: true },
      { text: '3 free Boosts/week', included: true },
      { text: 'Gold highlighted profile', included: true },
      { text: 'Join ALL Worlds', included: true },
      { text: 'No ads + 15,000 VP/mo', included: true },
    ],
  },
];

// ===== VP PACKAGES (10 tiers) =====
export const VP_PACKAGES = [
  { id: 'vp1', name: 'Tiny', emoji: '🫧', amount: 500, price: 0.49, bonus: 0, label: '' },
  { id: 'vp2', name: 'Starter', emoji: '🌱', amount: 1100, price: 0.99, bonus: 10, label: '' },
  { id: 'vp3', name: 'Basic', emoji: '🌿', amount: 2400, price: 1.99, bonus: 20, label: '' },
  { id: 'vp4', name: 'Popular', emoji: '🌳', amount: 6500, price: 4.99, bonus: 30, label: 'Popular' },
  { id: 'vp5', name: 'Best Value', emoji: '💫', amount: 14000, price: 9.99, bonus: 40, label: 'Best Value' },
  { id: 'vp6', name: 'Star', emoji: '⭐', amount: 32000, price: 19.99, bonus: 60, label: '' },
  { id: 'vp7', name: 'Blaze', emoji: '🔥', amount: 54000, price: 29.99, bonus: 80, label: '' },
  { id: 'vp8', name: 'Diamond', emoji: '💎', amount: 100000, price: 49.99, bonus: 100, label: '' },
  { id: 'vp9', name: 'Royal', emoji: '👑', amount: 220000, price: 99.99, bonus: 120, label: '' },
  { id: 'vp10', name: 'Legendary', emoji: '🚀', amount: 500000, price: 199.99, bonus: 150, label: '' },
];

// ===== CONVERSATION STARTERS (for Say Hi) =====
export const CONVERSATION_STARTERS = [
  { emoji: '👋', text: "Hey! I see we both love Afrobeats! Who's your favorite artist right now?" },
  { emoji: '🎵', text: "Your playlist must be amazing. What's the last song that got stuck in your head?" },
  { emoji: '✈️', text: "Where's the one place you're dying to visit? I need some travel inspo!" },
  { emoji: '😊', text: "Your bio made me smile! What's the funniest thing that happened to you this week?" },
];

// ===== INBOX SYSTEM TYPES =====
export interface SayHiRequest {
  id: string;
  sender: User;
  message: string;
  isCustomMessage: boolean;
  isSuperSpark: boolean;
  matchScore: number;
  qualityScore: number; // internal, not shown
  sentAgo: string;
  expiresInHours: number;
  isRead: boolean;
}

export interface ActiveSpark {
  id: string;
  user: User;
  hoursRemaining: number;
  lastMessage: string;
  lastMessageTime: string;
  sharedInterests: string[];
}

export interface OngoingConversation {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  vpPerMessage: number;
  unreadCount: number;
}

export interface PopularityStats {
  messagesThisWeek: number;
  profileViewsThisWeek: number;
  giftsThisWeek: number;
  sparkRequestsThisWeek: number;
  vibeRating: number;
  cityRankPercent: number;
  popularityTier: 'rising' | 'popular' | 'star' | 'icon';
  changeFromLastWeek: number; // percentage
}

// ===== PINNED CONVERSATIONS =====
export const PINNED_CONVERSATIONS = [
  MOCK_CONVERSATIONS[0], // Grace
  MOCK_CONVERSATIONS[1], // Kwame
];

// ===== SAY HI REQUESTS (Incoming) =====
export const MOCK_REQUESTS: SayHiRequest[] = [
  {
    id: 'req1', sender: MOCK_USERS[10], // Kofi
    message: "Hey! I see we both love cooking! What's your signature dish? 🍳",
    isCustomMessage: true, isSuperSpark: false, matchScore: 88,
    qualityScore: 78, sentAgo: '9h ago', expiresInHours: 63, isRead: false,
  },
  {
    id: 'req2', sender: MOCK_USERS[11], // Nadia
    message: "Your travel photos are amazing! Where was that sunset pic taken?",
    isCustomMessage: true, isSuperSpark: false, matchScore: 75,
    qualityScore: 65, sentAgo: '12h ago', expiresInHours: 60, isRead: false,
  },
  {
    id: 'req3', sender: MOCK_USERS[3], // David — Super Spark
    message: "I've been meaning to connect with you — I love your vibe! Would love to chat about travel and music 🌍",
    isCustomMessage: true, isSuperSpark: true, matchScore: 82,
    qualityScore: 142, sentAgo: '2h ago', expiresInHours: 166, isRead: false,
  },
  {
    id: 'req4', sender: MOCK_USERS[8], // John
    message: "Hi there! You seem really interesting. Want to chat?",
    isCustomMessage: false, isSuperSpark: false, matchScore: 62,
    qualityScore: 42, sentAgo: '1 day ago', expiresInHours: 48, isRead: true,
  },
  {
    id: 'req5', sender: MOCK_USERS[1], // Emmanuel
    message: "Your playlist must be amazing. What's the last song that got stuck in your head? 🎵",
    isCustomMessage: false, isSuperSpark: false, matchScore: 92,
    qualityScore: 85, sentAgo: '3h ago', expiresInHours: 69, isRead: false,
  },
  {
    id: 'req6', sender: MOCK_USERS[6], // Priya
    message: "I love that we both enjoy photography! What camera do you use?",
    isCustomMessage: true, isSuperSpark: false, matchScore: 73,
    qualityScore: 58, sentAgo: '18h ago', expiresInHours: 54, isRead: true,
  },
];

// ===== ACTIVE SPARK CONNECTIONS =====
export const MOCK_ACTIVE_SPARKS: ActiveSpark[] = [
  {
    id: 'as1', user: MOCK_USERS[7], // Sarah
    hoursRemaining: 18, lastMessage: 'That Spark call was so fun! 😊',
    lastMessageTime: '30 min ago', sharedInterests: ['Music', 'Cooking', 'Faith'],
  },
  {
    id: 'as2', user: MOCK_USERS[10], // Kofi
    hoursRemaining: 6, lastMessage: 'What kind of music do you make?',
    lastMessageTime: '2h ago', sharedInterests: ['Music', 'Fitness', 'Cooking'],
  },
];

// ===== ONGOING STRANGER CONVERSATIONS =====
export const MOCK_ONGOING_CONVOS: OngoingConversation[] = [
  {
    id: 'oc1', user: MOCK_USERS[10], // Kofi
    lastMessage: 'I love making jollof rice! What about you?',
    lastMessageTime: '1h ago', vpPerMessage: 50, unreadCount: 1,
  },
  {
    id: 'oc2', user: MOCK_USERS[11], // Nadia
    lastMessage: 'Dubai sunsets are something else entirely ☀️',
    lastMessageTime: '4h ago', vpPerMessage: 50, unreadCount: 0,
  },
];

// ===== POPULARITY STATS =====
export const MOCK_POPULARITY: PopularityStats = {
  messagesThisWeek: 47,
  profileViewsThisWeek: 312,
  giftsThisWeek: 8,
  sparkRequestsThisWeek: 12,
  vibeRating: 4.3,
  cityRankPercent: 15,
  popularityTier: 'popular',
  changeFromLastWeek: 23,
};

// ===== VIP LEVEL SYSTEM =====
export interface VipLevel {
  level: number;
  name: string;
  badge: string;
  xpRequired: number;
  monthlyMaintenanceXp: number;
  levelUpVpBonus: number;
  extraSayHiPerDay: number | 'unlimited';
  vpDiscount: number; // percent
  giftEarnBonus: number; // added to base 30%
  freeBoostsPerWeek: number;
  freeSpotlightsPerMonth: number;
  maxPinnedConvos: number;
  inboxCapBonus: number;
  hasEntranceAnimation: boolean;
  hasNameColor: boolean;
  hasChatThemes: boolean;
  hasVoiceEffects: boolean;
  canCreateRoomsFree: boolean;
  hasReadReceipts: boolean;
  hasExclusiveWorld: boolean;
  hasBetaAccess: boolean;
  tagline: string;
}

export interface UserVipStatus {
  currentLevel: number;
  totalXp: number;
  monthlyXp: number;
  monthlyXpRequired: number;
  daysRemainingInMonth: number;
  maintenanceMet: boolean;
  nextLevelXp: number;
  nextLevelName: string;
  nextLevelBadge: string;
}

export const VIP_LEVELS: VipLevel[] = [
  { level: 0, name: 'Newcomer', badge: '', xpRequired: 0, monthlyMaintenanceXp: 0, levelUpVpBonus: 0, extraSayHiPerDay: 0, vpDiscount: 0, giftEarnBonus: 0, freeBoostsPerWeek: 0, freeSpotlightsPerMonth: 0, maxPinnedConvos: 3, inboxCapBonus: 0, hasEntranceAnimation: false, hasNameColor: false, hasChatThemes: false, hasVoiceEffects: false, canCreateRoomsFree: false, hasReadReceipts: false, hasExclusiveWorld: false, hasBetaAccess: false, tagline: 'Welcome! Start connecting to level up.' },
  { level: 1, name: 'Bronze', badge: '🥉', xpRequired: 1000, monthlyMaintenanceXp: 200, levelUpVpBonus: 500, extraSayHiPerDay: 1, vpDiscount: 5, giftEarnBonus: 0, freeBoostsPerWeek: 0, freeSpotlightsPerMonth: 0, maxPinnedConvos: 3, inboxCapBonus: 0, hasEntranceAnimation: false, hasNameColor: false, hasChatThemes: false, hasVoiceEffects: false, canCreateRoomsFree: false, hasReadReceipts: false, hasExclusiveWorld: false, hasBetaAccess: false, tagline: "You're getting started! Welcome to the community." },
  { level: 2, name: 'Silver', badge: '🥈', xpRequired: 5000, monthlyMaintenanceXp: 500, levelUpVpBonus: 2000, extraSayHiPerDay: 3, vpDiscount: 8, giftEarnBonus: 0, freeBoostsPerWeek: 0, freeSpotlightsPerMonth: 0, maxPinnedConvos: 5, inboxCapBonus: 0, hasEntranceAnimation: false, hasNameColor: false, hasChatThemes: true, hasVoiceEffects: true, canCreateRoomsFree: false, hasReadReceipts: false, hasExclusiveWorld: false, hasBetaAccess: false, tagline: 'People are noticing you. Keep going!' },
  { level: 3, name: 'Gold', badge: '🥇', xpRequired: 15000, monthlyMaintenanceXp: 1000, levelUpVpBonus: 5000, extraSayHiPerDay: 6, vpDiscount: 10, giftEarnBonus: 0, freeBoostsPerWeek: 1, freeSpotlightsPerMonth: 0, maxPinnedConvos: 5, inboxCapBonus: 20, hasEntranceAnimation: true, hasNameColor: true, hasChatThemes: true, hasVoiceEffects: true, canCreateRoomsFree: true, hasReadReceipts: false, hasExclusiveWorld: false, hasBetaAccess: false, tagline: "You're a valued member of Soul Room!" },
  { level: 4, name: 'Platinum', badge: '💠', xpRequired: 40000, monthlyMaintenanceXp: 2000, levelUpVpBonus: 10000, extraSayHiPerDay: 11, vpDiscount: 12, giftEarnBonus: 2, freeBoostsPerWeek: 2, freeSpotlightsPerMonth: 1, maxPinnedConvos: 7, inboxCapBonus: 40, hasEntranceAnimation: true, hasNameColor: true, hasChatThemes: true, hasVoiceEffects: true, canCreateRoomsFree: true, hasReadReceipts: false, hasExclusiveWorld: true, hasBetaAccess: false, tagline: "You're in the top tier. People respect you here." },
  { level: 5, name: 'Diamond', badge: '💎', xpRequired: 100000, monthlyMaintenanceXp: 3500, levelUpVpBonus: 25000, extraSayHiPerDay: 21, vpDiscount: 15, giftEarnBonus: 5, freeBoostsPerWeek: 3, freeSpotlightsPerMonth: 2, maxPinnedConvos: 10, inboxCapBonus: 60, hasEntranceAnimation: true, hasNameColor: true, hasChatThemes: true, hasVoiceEffects: true, canCreateRoomsFree: true, hasReadReceipts: true, hasExclusiveWorld: true, hasBetaAccess: false, tagline: "You're Diamond elite. The community knows you." },
  { level: 6, name: 'Royal', badge: '👑', xpRequired: 250000, monthlyMaintenanceXp: 5000, levelUpVpBonus: 50000, extraSayHiPerDay: 'unlimited', vpDiscount: 18, giftEarnBonus: 7, freeBoostsPerWeek: 5, freeSpotlightsPerMonth: 4, maxPinnedConvos: 999, inboxCapBonus: 80, hasEntranceAnimation: true, hasNameColor: true, hasChatThemes: true, hasVoiceEffects: true, canCreateRoomsFree: true, hasReadReceipts: true, hasExclusiveWorld: true, hasBetaAccess: true, tagline: "You're royalty. Soul Room is your kingdom." },
  { level: 7, name: 'Legendary', badge: '🌟', xpRequired: 500000, monthlyMaintenanceXp: 8000, levelUpVpBonus: 100000, extraSayHiPerDay: 'unlimited', vpDiscount: 20, giftEarnBonus: 9, freeBoostsPerWeek: 7, freeSpotlightsPerMonth: 6, maxPinnedConvos: 999, inboxCapBonus: 100, hasEntranceAnimation: true, hasNameColor: true, hasChatThemes: true, hasVoiceEffects: true, canCreateRoomsFree: true, hasReadReceipts: true, hasExclusiveWorld: true, hasBetaAccess: true, tagline:  "You are a Legend. Soul Room wouldn't be the same without you." },
  { level: 8, name: 'Mythic', badge: '💫', xpRequired: 1000000, monthlyMaintenanceXp: 12000, levelUpVpBonus: 250000, extraSayHiPerDay: 'unlimited', vpDiscount: 25, giftEarnBonus: 12, freeBoostsPerWeek: 10, freeSpotlightsPerMonth: 10, maxPinnedConvos: 999, inboxCapBonus: 100, hasEntranceAnimation: true, hasNameColor: true, hasChatThemes: true, hasVoiceEffects: true, canCreateRoomsFree: true, hasReadReceipts: true, hasExclusiveWorld: true, hasBetaAccess: true, tagline: 'You have transcended. You ARE Soul Room.' },
];

// ===== CURRENT USER VIP STATUS =====
export const CURRENT_USER_VIP: UserVipStatus = {
  currentLevel: 3, // Gold
  totalXp: 15420,
  monthlyXp: 660,
  monthlyXpRequired: 1000,
  daysRemainingInMonth: 20,
  maintenanceMet: false,
  nextLevelXp: 40000,
  nextLevelName: 'Platinum',
  nextLevelBadge: '💠',
};

// ===== XP EARNING RATES =====
export const XP_EARNING_RATES = {
  vpSpending: [
    { source: 'Messages (Say Hi, replies)', rate: '1 VP → 1 XP', emoji: '💬' },
    { source: 'Gifts', rate: '1 VP → 1.5 XP', emoji: '🎁' },
    { source: 'Spark features', rate: '1 VP → 1 XP', emoji: '⚡' },
    { source: 'Boosts & Spotlight', rate: '1 VP → 1 XP', emoji: '🚀' },
    { source: 'Voice/Video minutes', rate: '1 VP → 1 XP', emoji: '🎤' },
  ],
  dailyActivity: [
    { source: 'Daily login', xp: 10, emoji: '📅' },
    { source: '7-day streak', xp: 50, emoji: '🔥' },
    { source: '14-day streak', xp: 100, emoji: '🔥' },
    { source: '30-day streak', xp: 250, emoji: '🔥' },
    { source: 'Complete challenge', xp: 20, emoji: '🎯' },
    { source: 'Watch rewarded ad', xp: 5, emoji: '📺', note: 'max 10/day' },
  ],
  socialActivity: [
    { source: 'Complete Spark call', xp: 15, emoji: '⚡' },
    { source: 'Get mutual Spark', xp: 30, emoji: '💜' },
    { source: 'New connection (Keep)', xp: 25, emoji: '🤝' },
    { source: 'Receive Good Vibe', xp: 10, emoji: '⭐' },
    { source: 'Give Good Vibe', xp: 5, emoji: '⭐' },
    { source: 'Receive a gift', xp: 5, emoji: '🎁' },
  ],
  communityActivity: [
    { source: 'Host room 30+ min', xp: 30, emoji: '🎤' },
    { source: 'Room with 10+ listeners', xp: 20, emoji: '👥' },
    { source: 'Join room 10+ min', xp: 5, emoji: '🎧' },
    { source: 'Attend World event', xp: 10, emoji: '🌍' },
    { source: 'Refer a friend', xp: 50, emoji: '📲' },
  ],
  subscriptionMultipliers: [
    { tier: 'Free', multiplier: '1x', color: 'text-text-tertiary' },
    { tier: 'Plus', multiplier: '1.2x', color: 'text-blue-400' },
    { tier: 'Premium', multiplier: '1.5x', color: 'text-accent' },
    { tier: 'VIP', multiplier: '2x', color: 'text-soul-400' },
  ],
};

// ===== VIP LEADERBOARD =====
export const VIP_LEADERBOARD = [
  { rank: 1, name: 'MelodyQueen', badge: '💫', level: 'Mythic', xp: 1245000, city: 'Lagos' },
  { rank: 2, name: 'BigDavid', badge: '🌟', level: 'Legendary', xp: 678000, city: 'Nairobi' },
  { rank: 3, name: 'QueenNadia', badge: '👑', level: 'Royal', xp: 312000, city: 'Dubai' },
  { rank: 4, name: 'KofiGold', badge: '💎', level: 'Diamond', xp: 156000, city: 'Accra' },
  { rank: 5, name: 'Princess', badge: '💠', level: 'Platinum', xp: 52000, city: 'Lagos' },
  { rank: 6, name: 'StarGirl', badge: '💠', level: 'Platinum', xp: 48000, city: 'Lagos' },
  { rank: 7, name: 'AfroBoy', badge: '🥇', level: 'Gold', xp: 28000, city: 'Accra' },
  { rank: 8, name: 'SunShine', badge: '🥇', level: 'Gold', xp: 22000, city: 'Lagos' },
  { rank: 9, name: 'DreamCatcher', badge: '🥇', level: 'Gold', xp: 18000, city: 'Nairobi' },
  { rank: 10, name: 'VibeMaster', badge: '🥈', level: 'Silver', xp: 9500, city: 'Accra' },
];

// Helper: get VIP level info for a user
export function getVipInfo(level: number) {
  return VIP_LEVELS[level] || VIP_LEVELS[0];
}

// ===== CONTROL CENTER DATA =====
export const SOCIAL_STATS = {
  friends: 0,
  following: 12,
  followers: 45,
  visitors: 128,
  newVisitors: 7, // red dot
};

export const EARNINGS_WALLET = {
  balanceDiamonds: 3200,
  lifetimeEarnings: 18500,
  pendingCashout: 0,
  lastCashout: null as string | null,
  hasUnclaimed: true, // red dot
};

export const USER_INVENTORY = [
  { id: 'inv1', type: 'profile_boost', name: 'Profile Boost', emoji: '🚀', quantity: 2, expires: '3 days' },
  { id: 'inv2', type: 'super_spark', name: 'Super Spark', emoji: '⚡', quantity: 1, expires: null },
  { id: 'inv3', type: 'profile_frame', name: 'Gold Frame', emoji: '🖼️', quantity: 1, equipped: true, expires: null },
  { id: 'inv4', type: 'chat_bubble', name: 'Fire Bubble', emoji: '💬', quantity: 1, equipped: false, expires: '14 days' },
];

export const USER_ACHIEVEMENTS = [
  { code: 'streak_7', name: '7-Day Streak', emoji: '🔥', earned: true },
  { code: 'streak_30', name: '30-Day Streak', emoji: '🔥', earned: false },
  { code: 'gift_sender', name: 'Gift Giver', emoji: '🎁', earned: true },
  { code: 'gift_king', name: 'Gift King', emoji: '👑', earned: false },
  { code: 'spark_master', name: 'Spark Master', emoji: '⚡', earned: true },
  { code: 'voice_host', name: 'Room Host', emoji: '🎤', earned: true },
  { code: 'world_explorer', name: 'World Explorer', emoji: '🌍', earned: false },
  { code: 'social_butterfly', name: 'Social Butterfly', emoji: '🦋', earned: false },
  { code: 'verified', name: 'Verified', emoji: '✅', earned: true },
  { code: 'popular', name: 'Popular Badge', emoji: '💜', earned: true },
];

export const DAILY_CHALLENGE = {
  title: 'Host a voice room for 30 minutes',
  reward: 300,
  emoji: '🎤',
  progress: 0,
  target: 30,
  unit: 'min',
};

export const MALL_ITEMS = [
  { id: 'm1', name: 'Gold Frame', emoji: '🖼️', price: 2000, type: 'Profile Frame' },
  { id: 'm2', name: 'Diamond Frame', emoji: '💎', price: 5000, type: 'Profile Frame' },
  { id: 'm3', name: 'Fire Bubble', emoji: '🔥', price: 1500, type: 'Chat Bubble' },
  { id: 'm4', name: 'Royal Entry', emoji: '👑', price: 3000, type: 'Entrance Effect' },
  { id: 'm5', name: 'Glow Aura', emoji: '✨', price: 2500, type: 'Profile Effect' },
  { id: 'm6', name: 'Neon Name', emoji: '🌈', price: 1000, type: 'Name Color' },
];

// ===== DETERMINISTIC NUMBER FORMATTER =====
// Replaces .toLocaleString() to avoid SSR/client hydration mismatches
export function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
