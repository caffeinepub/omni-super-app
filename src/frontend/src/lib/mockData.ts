export type AnonymousID = string;

export function generateAnonymousID(): AnonymousID {
  const p1 = Math.floor(1000 + Math.random() * 9000);
  const p2 = Math.floor(1000 + Math.random() * 9000);
  return `+777 ${p1} ${p2}`;
}

export function generateShortID(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export interface Message {
  id: string;
  senderId: AnonymousID;
  content: string;
  timestamp: number;
  selfDestructAt?: number;
  isVoice?: boolean;
  voiceDuration?: number;
  fileUrl?: string;
  exploded?: boolean;
  status?: "sent" | "delivered" | "read";
  reactions?: Record<string, string[]>;
  replyToId?: string;
  translatedContent?: string;
}

export interface Conversation {
  id: string;
  participants: AnonymousID[];
  name?: string;
  isGroup: boolean;
  isChannel: boolean;
  ghostMode: boolean;
  lastMessage?: string;
  lastTime?: number;
  unread: number;
  messages: Message[];
}

export interface Story {
  id: string;
  authorId: AnonymousID;
  content: string;
  emoji: string;
  createdAt: number;
  expiresAt: number;
  views: number;
}

export interface RideRequest {
  id: string;
  riderId: AnonymousID;
  origin: string;
  destination: string;
  fareEstimate: number;
  status: "pending" | "matched" | "active" | "completed" | "cancelled";
  driverId?: AnonymousID;
  driverName?: string;
  vehicle?: string;
  tokenReward: number;
  rating?: number;
  rideChat: Message[];
}

export interface MarketListing {
  id: string;
  sellerId: AnonymousID;
  type: "id_sale" | "product" | "service" | "nft";
  title: string;
  description: string;
  price: number;
  status: "active" | "sold";
  category: string;
  trustScore: number;
  rarity?: "common" | "rare" | "legendary";
  likes: number;
}

export interface TokenTransaction {
  id: string;
  type: "earn" | "spend" | "transfer" | "reward";
  amount: number;
  description: string;
  timestamp: number;
}

export interface MatchProfile {
  id: AnonymousID;
  mood: string;
  interests: string[];
  online: boolean;
  lastSeen: string;
}

export interface FriendRequest {
  id: string;
  fromId: AnonymousID;
  toId: AnonymousID;
  direction: "incoming" | "outgoing";
  status: "pending" | "accepted" | "declined";
  sentAt: number;
  pulseMatch?: number;
  sharedInterests: string[];
}

export interface Friend {
  id: string;
  friendId: AnonymousID;
  addedAt: number;
  isPhantom: boolean;
  phantomExpiresAt?: number;
  friendScore: number;
  lastSeen: string;
  sharedInterests: string[];
  mood: string;
}

export interface PulseEntry {
  id: string;
  authorId: AnonymousID;
  content: string;
  emoji: string;
  mood: string;
  createdAt: number;
  expiresAt: number;
  matchedIds: AnonymousID[];
}

export const MOCK_IDS: AnonymousID[] = [
  "+777 3421 8921",
  "+777 9182 4452",
  "+777 6637 2013",
  "+777 4490 8174",
  "+777 2815 6345",
  "+777 7703 9526",
  "+777 1129 4767",
  "+777 8844 3318",
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    participants: ["+777 3421 8921"],
    isGroup: false,
    isChannel: false,
    ghostMode: false,
    lastMessage: "Hey, are you there? 👀",
    lastTime: Date.now() - 300000,
    unread: 2,
    messages: [
      {
        id: "m1",
        senderId: "+777 3421 8921",
        content: "Hey, are you there? 👀",
        timestamp: Date.now() - 300000,
        status: "read",
      },
      {
        id: "m2",
        senderId: "+777 3421 8921",
        content: "I found a rare ID for sale!",
        timestamp: Date.now() - 280000,
        status: "read",
      },
    ],
  },
  {
    id: "c2",
    participants: ["+777 9182 4452", "+777 6637 2013", "+777 4490 8174"],
    name: "Phantom Squad 🔮",
    isGroup: true,
    isChannel: false,
    ghostMode: true,
    lastMessage: "The AI story generator is insane 🤯",
    lastTime: Date.now() - 3600000,
    unread: 5,
    messages: [
      {
        id: "m3",
        senderId: "+777 9182 4452",
        content: "Welcome to the squad! Ghost mode is on 👻",
        timestamp: Date.now() - 7200000,
        status: "read",
      },
      {
        id: "m4",
        senderId: "+777 6637 2013",
        content: "The AI story generator is insane 🤯",
        timestamp: Date.now() - 3600000,
        status: "read",
      },
    ],
  },
  {
    id: "c3",
    participants: [],
    name: "🌐 OMNI Network",
    isGroup: false,
    isChannel: true,
    ghostMode: false,
    lastMessage: "OMNI v2.0 launches next week",
    lastTime: Date.now() - 86400000,
    unread: 12,
    messages: [
      {
        id: "m6",
        senderId: "OMNI",
        content: "🚀 OMNI Network is now live!",
        timestamp: Date.now() - 86400000,
        status: "read",
      },
    ],
  },
  {
    id: "c4",
    participants: ["+777 2815 6345"],
    isGroup: false,
    isChannel: false,
    ghostMode: true,
    lastMessage: "🔥 This is a self-destruct message",
    lastTime: Date.now() - 600000,
    unread: 0,
    messages: [
      {
        id: "m8",
        senderId: "+777 2815 6345",
        content: "🔥 This is a self-destruct message",
        timestamp: Date.now() - 600000,
        selfDestructAt: Date.now() + 3600000,
        status: "read",
      },
    ],
  },
];

export const MOCK_STORIES: Story[] = [
  {
    id: "s1",
    authorId: "+777 3421 8921",
    content: "Living in the shadows of the neon city 🌆",
    emoji: "🌆",
    createdAt: Date.now() - 3600000,
    expiresAt: Date.now() + 72000000,
    views: 234,
  },
  {
    id: "s2",
    authorId: "+777 9182 4452",
    content: "Anonymous but free ✨",
    emoji: "✨",
    createdAt: Date.now() - 7200000,
    expiresAt: Date.now() + 64800000,
    views: 891,
  },
  {
    id: "s3",
    authorId: "+777 6637 2013",
    content: "The marketplace is 🔥 today.",
    emoji: "🔥",
    createdAt: Date.now() - 1800000,
    expiresAt: Date.now() + 79200000,
    views: 102,
  },
  {
    id: "s4",
    authorId: "+777 7703 9526",
    content: "Earned 50 OMNI tokens today 💰",
    emoji: "💰",
    createdAt: Date.now() - 5400000,
    expiresAt: Date.now() + 72000000,
    views: 67,
  },
];

export const MOCK_LISTINGS: MarketListing[] = [
  {
    id: "l1",
    sellerId: "+777 9182 4452",
    type: "id_sale",
    title: "+777 0001 0001",
    description: "Ultra-rare genesis ID.",
    price: 5000,
    status: "active",
    category: "ID Sale",
    trustScore: 95,
    rarity: "legendary",
    likes: 234,
  },
  {
    id: "l2",
    sellerId: "+777 6637 2013",
    type: "id_sale",
    title: "+777 1337 0001",
    description: "Elite hacker-style ID.",
    price: 1200,
    status: "active",
    category: "ID Sale",
    trustScore: 88,
    rarity: "rare",
    likes: 87,
  },
  {
    id: "l3",
    sellerId: "+777 4490 8174",
    type: "id_sale",
    title: "+777 8888 8888",
    description: "Lucky 8s ID.",
    price: 800,
    status: "active",
    category: "ID Sale",
    trustScore: 72,
    rarity: "rare",
    likes: 45,
  },
  {
    id: "l4",
    sellerId: "+777 3421 8921",
    type: "id_sale",
    title: "+777 2024 7770",
    description: "Year-based commemorative ID.",
    price: 250,
    status: "active",
    category: "ID Sale",
    trustScore: 61,
    rarity: "common",
    likes: 12,
  },
  {
    id: "l5",
    sellerId: "+777 2815 6345",
    type: "product",
    title: "Anonymous VPN Config Pack",
    description: "Premium multi-hop VPN configs.",
    price: 150,
    status: "active",
    category: "Digital Product",
    trustScore: 82,
    likes: 56,
  },
  {
    id: "l6",
    sellerId: "+777 1129 4767",
    type: "service",
    title: "Ghost Profile Setup",
    description: "Help set up anonymous shadow profile.",
    price: 80,
    status: "active",
    category: "Service",
    trustScore: 76,
    likes: 23,
  },
  {
    id: "l7",
    sellerId: "+777 8844 3318",
    type: "nft",
    title: "Neon Phantom #042",
    description: "Exclusive OMNI NFT.",
    price: 2500,
    status: "active",
    category: "NFT",
    trustScore: 91,
    rarity: "legendary",
    likes: 178,
  },
  {
    id: "l8",
    sellerId: "+777 7703 9526",
    type: "product",
    title: "Encrypted Chat Scripts",
    description: "Advanced chat automation.",
    price: 120,
    status: "active",
    category: "Digital Product",
    trustScore: 68,
    likes: 34,
  },
];

export const MOCK_MATCH_PROFILES: MatchProfile[] = [
  {
    id: "+777 3421 8921",
    mood: "🎮",
    interests: ["Gaming", "Tech", "AI"],
    online: true,
    lastSeen: "Online",
  },
  {
    id: "+777 9182 4452",
    mood: "🎵",
    interests: ["Music", "Art", "Dating"],
    online: false,
    lastSeen: "5m ago",
  },
  {
    id: "+777 6637 2013",
    mood: "🌍",
    interests: ["Travel", "Networking", "Gaming"],
    online: true,
    lastSeen: "Online",
  },
  {
    id: "+777 4490 8174",
    mood: "💡",
    interests: ["Tech", "AI", "Networking"],
    online: false,
    lastSeen: "1h ago",
  },
  {
    id: "+777 2815 6345",
    mood: "❤️",
    interests: ["Dating", "Music", "Art"],
    online: true,
    lastSeen: "Online",
  },
  {
    id: "+777 7703 9526",
    mood: "🎨",
    interests: ["Art", "Travel", "Gaming"],
    online: false,
    lastSeen: "30m ago",
  },
];

export const MOCK_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: "fr1",
    fromId: "+777 3421 8921",
    toId: "myId",
    direction: "incoming",
    status: "pending",
    sentAt: Date.now() - 600000,
    pulseMatch: 87,
    sharedInterests: ["Gaming", "Tech"],
  },
  {
    id: "fr2",
    fromId: "+777 9182 4452",
    toId: "myId",
    direction: "incoming",
    status: "pending",
    sentAt: Date.now() - 1800000,
    pulseMatch: 72,
    sharedInterests: ["Music", "Art"],
  },
  {
    id: "fr3",
    fromId: "myId",
    toId: "+777 4490 8174",
    direction: "outgoing",
    status: "pending",
    sentAt: Date.now() - 3600000,
    pulseMatch: 91,
    sharedInterests: ["AI", "Tech"],
  },
];

export const MOCK_FRIENDS: Friend[] = [
  {
    id: "f1",
    friendId: "+777 6637 2013",
    addedAt: Date.now() - 86400000,
    isPhantom: false,
    friendScore: 94,
    lastSeen: "2h ago",
    sharedInterests: ["Travel", "Gaming"],
    mood: "🌍",
  },
  {
    id: "f2",
    friendId: "+777 2815 6345",
    addedAt: Date.now() - 172800000,
    isPhantom: true,
    phantomExpiresAt: Date.now() + 3600000 * 8,
    friendScore: 78,
    lastSeen: "Online",
    sharedInterests: ["Music"],
    mood: "❤️",
  },
  {
    id: "f3",
    friendId: "+777 7703 9526",
    addedAt: Date.now() - 43200000,
    isPhantom: false,
    friendScore: 88,
    lastSeen: "30m ago",
    sharedInterests: ["Art", "AI"],
    mood: "🎨",
  },
];

export const MOCK_PULSES: PulseEntry[] = [
  {
    id: "p1",
    authorId: "+777 3421 8921",
    content: "Into deep techno and late night coding",
    emoji: "🎧",
    mood: "Focused",
    createdAt: Date.now() - 3600000,
    expiresAt: Date.now() + 72000000,
    matchedIds: ["+777 4490 8174", "+777 6637 2013"],
  },
  {
    id: "p2",
    authorId: "+777 9182 4452",
    content: "Feeling adventurous, looking for travel buddies",
    emoji: "✈️",
    mood: "Excited",
    createdAt: Date.now() - 7200000,
    expiresAt: Date.now() + 64800000,
    matchedIds: ["+777 6637 2013"],
  },
];

export const MOCK_TRANSACTIONS: TokenTransaction[] = [
  {
    id: "t1",
    type: "earn",
    amount: 50,
    description: "Referral reward: +777 3421 8921 joined",
    timestamp: Date.now() - 86400000,
  },
  {
    id: "t2",
    type: "earn",
    amount: 10,
    description: "Ride completed reward",
    timestamp: Date.now() - 43200000,
  },
  {
    id: "t3",
    type: "spend",
    amount: -80,
    description: "Purchased: Ghost Profile Setup",
    timestamp: Date.now() - 21600000,
  },
  {
    id: "t4",
    type: "earn",
    amount: 5,
    description: "Story posted reward",
    timestamp: Date.now() - 10800000,
  },
  {
    id: "t5",
    type: "transfer",
    amount: -20,
    description: "Sent to +777 6637 2013",
    timestamp: Date.now() - 3600000,
  },
];

// P2P Economy Types
export interface P2POffer {
  id: string;
  type: "sell" | "buy";
  sellerId: string;
  amount: number;
  price: number;
  trustScore: number;
  createdAt: number;
}

export interface EscrowTrade {
  id: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  price: number;
  status:
    | "tokens_locked"
    | "payment_sent"
    | "completed"
    | "disputed"
    | "cancelled";
  createdAt: number;
  expiresAt: number;
}

export interface IDListing {
  id: string;
  idValue: string;
  rarity: "nadir" | "epik" | "efsanevi";
  currentBid: number;
  buyNowPrice: number;
  sellerId: string;
  sellerTrust: number;
  expiresAt: number;
}

export const MOCK_P2P_OFFERS: P2POffer[] = [
  {
    id: "o1",
    type: "sell",
    sellerId: "+777 4521 8833",
    amount: 100,
    price: 9.5,
    trustScore: 4.8,
    createdAt: Date.now() - 3600000,
  },
  {
    id: "o2",
    type: "sell",
    sellerId: "+777 7734 2291",
    amount: 250,
    price: 22.0,
    trustScore: 4.5,
    createdAt: Date.now() - 7200000,
  },
  {
    id: "o3",
    type: "sell",
    sellerId: "+777 8821 3304",
    amount: 500,
    price: 42.5,
    trustScore: 4.2,
    createdAt: Date.now() - 10800000,
  },
  {
    id: "o4",
    type: "sell",
    sellerId: "+777 5512 6649",
    amount: 1000,
    price: 80.0,
    trustScore: 4.7,
    createdAt: Date.now() - 14400000,
  },
  {
    id: "o5",
    type: "sell",
    sellerId: "+777 3310 9482",
    amount: 75,
    price: 7.2,
    trustScore: 3.9,
    createdAt: Date.now() - 1800000,
  },
  {
    id: "o6",
    type: "sell",
    sellerId: "+777 6637 2013",
    amount: 200,
    price: 18.0,
    trustScore: 4.1,
    createdAt: Date.now() - 5400000,
  },
];

export const MOCK_ID_LISTINGS: IDListing[] = [
  {
    id: "il1",
    idValue: "+777 7777 7777",
    rarity: "efsanevi",
    currentBid: 2400,
    buyNowPrice: 5000,
    sellerId: "+777 4521 8833",
    sellerTrust: 4.9,
    expiresAt: Date.now() + 86400000 * 2,
  },
  {
    id: "il2",
    idValue: "+777 1234 1234",
    rarity: "epik",
    currentBid: 750,
    buyNowPrice: 1500,
    sellerId: "+777 7734 2291",
    sellerTrust: 4.5,
    expiresAt: Date.now() + 86400000 * 1,
  },
  {
    id: "il3",
    idValue: "+777 0000 1337",
    rarity: "nadir",
    currentBid: 300,
    buyNowPrice: 600,
    sellerId: "+777 8821 3304",
    sellerTrust: 4.2,
    expiresAt: Date.now() + 86400000 * 3,
  },
  {
    id: "il4",
    idValue: "+777 8888 8888",
    rarity: "efsanevi",
    currentBid: 3100,
    buyNowPrice: 7500,
    sellerId: "+777 5512 6649",
    sellerTrust: 4.7,
    expiresAt: Date.now() + 86400000 * 4,
  },
  {
    id: "il5",
    idValue: "+777 9876 5432",
    rarity: "nadir",
    currentBid: 150,
    buyNowPrice: 400,
    sellerId: "+777 3310 9482",
    sellerTrust: 3.8,
    expiresAt: Date.now() + 43200000,
  },
];

// AI helper functions
export function getAIResponse(input: string): string {
  const responses: Record<string, string> = {
    default: "Anlıyorum, sana yardımcı olabilirim! 🤖",
    tech: "Teknoloji konusunda daha fazla bilgi verebilir misin?",
    help: "Yardım etmekten mutluluk duyarım! Nasıl devam edelim?",
  };
  const lower = input.toLowerCase();
  if (lower.includes("tech") || lower.includes("teknoloji"))
    return responses.tech;
  if (lower.includes("help") || lower.includes("yardım")) return responses.help;
  return `OMNI AI: ${input.slice(0, 30)}... hakkında şunu söyleyebilirim: harika bir konu!`;
}

export function analyzeMood(text: string): {
  mood: string;
  emoji: string;
  confidence: number;
  color: string;
} {
  const moods = [
    { mood: "Mutlu", emoji: "😊", confidence: 0.8, color: "#FFD700" },
    { mood: "Heyecanlı", emoji: "🎉", confidence: 0.9, color: "#FF6B6B" },
    { mood: "Sakin", emoji: "😌", confidence: 0.6, color: "#4ECDC4" },
    { mood: "Derin", emoji: "🤔", confidence: 0.5, color: "#9B59B6" },
    { mood: "Enerjik", emoji: "⚡", confidence: 0.85, color: "#F39C12" },
  ];
  const lowerText = text.toLowerCase();
  if (lowerText.includes("mutlu") || lowerText.includes("harika"))
    return moods[0];
  if (lowerText.includes("heyecan") || lowerText.includes("süper"))
    return moods[1];
  if (lowerText.includes("sakin") || lowerText.includes("iyi")) return moods[2];
  return moods[Math.floor(Math.random() * moods.length)];
}

export const STORY_TEMPLATES: Array<(prompt: string) => string> = [
  (p) => `${p} hakkında düşüncelerimi paylaşıyorum... 💭`,
  (p) => `Bugün ${p} ile ilgili ilginç bir şey keşfettim! ✨`,
  (p) => `${p} konusunda herkes ne düşünüyor? 🤔`,
  (p) => `${p} - bunun hakkında konuşmalıyız! 🔥`,
  (p) => `Anonim sesim: ${p} 👻`,
];
