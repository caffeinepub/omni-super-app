import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IDType, OmniIdentity, PrivacyMode } from "./identitySystem";
import {
  createIdentity as createOmniIdentityFn,
  generateKeyPair as generateKeyPairFn,
} from "./identitySystem";
import {
  type AnonymousID,
  type Conversation,
  type EscrowTrade,
  type Friend,
  type FriendRequest,
  type IDListing,
  MOCK_CONVERSATIONS,
  MOCK_FRIENDS,
  MOCK_FRIEND_REQUESTS,
  MOCK_ID_LISTINGS,
  MOCK_LISTINGS,
  MOCK_P2P_OFFERS,
  MOCK_PULSES,
  MOCK_STORIES,
  MOCK_TRANSACTIONS,
  type MarketListing,
  type P2POffer,
  type PulseEntry,
  type Story,
  type TokenTransaction,
  generateAnonymousID,
} from "./mockData";

export type RideState =
  | "REQUESTED"
  | "DRIVER_ASSIGNED"
  | "DRIVER_ARRIVING"
  | "TRIP_STARTED"
  | "TRIP_COMPLETED"
  | "CANCELLED";

export interface AIPriceEstimate {
  distanceKm: number;
  estimatedMinutes: number;
  baseFare: number;
  trafficMultiplier: number;
  surgeMultiplier: number;
  fairPrice: number;
  minPrice: number;
  maxPrice: number;
}

export interface NearbyDriver {
  id: string;
  anonymousId: string;
  emoji: string;
  rating: number;
  distanceKm: number;
  vehicle: string;
  responseSpeed: number;
}

export interface RideMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  isQuick?: boolean;
}

export interface ActiveRide {
  id: string;
  state: RideState;
  passengerAnonymousId: string;
  driverAnonymousId: string;
  driverEmoji: string;
  driverRating: number;
  driverVehicle: string;
  origin: string;
  destination: string;
  aiPrice: AIPriceEstimate;
  agreedPrice: number;
  startedAt?: number;
  messages: RideMessage[];
  driverProgress: number;
}

export interface IncomingRideRequest {
  id: string;
  passengerAnonymousId: string;
  passengerEmoji: string;
  origin: string;
  destination: string;
  aiPrice: AIPriceEstimate;
  expiresAt: number;
}

export interface CompletedRide {
  id: string;
  origin: string;
  destination: string;
  price: number;
  driverAnonymousId: string;
  passengerRating: number;
  driverRating: number;
  completedAt: number;
  distanceKm: number;
  durationMinutes: number;
}

export type Module =
  | "chat"
  | "social"
  | "market"
  | "ai"
  | "wallet"
  | "friends"
  | "ride"
  | "identity"
  | "engine"
  | "dating"
  | "home"
  | "profile";

export interface CallLog {
  id: string;
  contactId: AnonymousID;
  type: "voice" | "video";
  direction: "outgoing" | "incoming";
  status: "answered" | "missed" | "declined";
  duration?: number;
  timestamp: number;
}

export interface DatingProfile {
  id: string;
  anonymousId: AnonymousID;
  emoji: string;
  mood: string;
  vibe: string;
  interests: string[];
  distance: number;
  trustScore: number;
  isOnline: boolean;
  tokenBalance?: number;
  bio?: string;
  age?: number;
  vibeStatus?: string;
  proximity?: string;
  privacyMode?: string;
  aiMatchScore?: number;
}

export interface DatingMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  isGift?: boolean;
  giftAmount?: number;
}

export interface DatingMatch {
  id: string;
  profileId: string;
  profile: DatingProfile;
  matchedAt: number;
  messages: DatingMessage[];
  tokensSent: number;
  isActive: boolean;
  expiresAt?: number;
}

interface OmniState {
  // Identity
  myId: AnonymousID | null;
  displayName: string;
  isPremium: boolean;
  isOnboarded: boolean;

  // Navigation
  activeModule: Module;
  setActiveModule: (m: Module) => void;

  // Onboarding
  completeOnboarding: (id: AnonymousID, name: string) => void;

  // Chat
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (
    convId: string,
    content: string,
    selfDestructMins?: number,
    isVoice?: boolean,
    voiceDuration?: number,
    replyToId?: string,
  ) => void;
  createConversation: (
    participantId: AnonymousID,
    ghostMode?: boolean,
  ) => string;
  createGroup: (name: string, participants: AnonymousID[]) => string;
  markConversationRead: (convId: string) => void;
  addReaction: (
    convId: string,
    msgId: string,
    emoji: string,
    userId: string,
  ) => void;
  setMessageTranslation: (
    convId: string,
    msgId: string,
    translated: string,
  ) => void;
  deleteMessage: (convId: string, msgId: string) => void;

  // Social
  stories: Story[];
  addStory: (content: string, emoji: string) => void;
  viewStory: (storyId: string) => void;
  selectedInterests: string[];
  setSelectedInterests: (interests: string[]) => void;

  // Ride
  rideRole: "passenger" | "driver";
  setRideRole: (role: "passenger" | "driver") => void;
  driverOnline: boolean;
  setDriverOnline: (online: boolean) => void;
  activeRide: ActiveRide | null;
  rideHistory: CompletedRide[];
  nearbyDrivers: NearbyDriver[];
  incomingRideRequest: IncomingRideRequest | null;
  driverEarnings: number;
  requestRide: (
    origin: string,
    destination: string,
    aiPrice: AIPriceEstimate,
  ) => void;
  acceptRideRequest: () => void;
  rejectRideRequest: () => void;
  updateRideState: (state: RideState) => void;
  cancelRide: () => void;
  sendRideMessage: (content: string) => void;
  rateRide: (rating: number, comment?: string) => void;
  completeRide: () => void;

  // Market
  listings: MarketListing[];
  purchaseListing: (listingId: string) => void;
  createListing: (
    listing: Omit<MarketListing, "id" | "status" | "likes">,
  ) => void;

  // Wallet
  tokenBalance: number;
  transactions: TokenTransaction[];
  earnTokens: (amount: number, description: string) => void;
  spendTokens: (amount: number, description: string) => boolean;
  sendTokens: (targetId: AnonymousID, amount: number) => boolean;
  claimedRewards: string[];
  claimReward: (rewardId: string, amount: number, description: string) => void;

  // P2P Economy
  p2pOffers: P2POffer[];
  escrowTrades: EscrowTrade[];
  idListings: IDListing[];
  userTrustScore: number;
  completedTrades: number;
  referralCount: number;
  dailyStreakDays: number;
  dailyStreakClaimed: boolean;
  claimedDrops: string[];
  createP2POffer: (type: "sell" | "buy", amount: number, price: number) => void;
  acceptOffer: (offerId: string) => void;
  confirmPaymentSent: (escrowId: string) => void;
  confirmPaymentReceived: (escrowId: string) => void;
  disputeTrade: (escrowId: string) => void;
  cancelEscrow: (escrowId: string) => void;
  bidOnID: (listingId: string, amount: number) => void;
  buyNowID: (listingId: string) => boolean;
  claimDrop: (dropId: string, amount: number) => void;
  claimDailyStreak: () => void;

  // Friends
  friendRequests: FriendRequest[];
  friends: Friend[];
  pulses: PulseEntry[];
  sendFriendRequest: (
    targetId: AnonymousID,
    sharedInterests: string[],
    pulseMatch: number,
  ) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  addPulse: (content: string, emoji: string, mood: string) => void;
  callLogs: CallLog[];
  addCallLog: (log: Omit<CallLog, "id">) => void;
  addFriendById: (targetId: AnonymousID) => "added" | "already_friend" | "self";

  // Identity Hub
  identities: OmniIdentity[];
  activeIdentityId: string | null;
  privacyMode: PrivacyMode;
  createIdentity: (
    type: IDType,
    nickname?: string,
    emoji?: string,
    customSuffix?: string,
  ) => OmniIdentity;
  switchIdentity: (id: string) => void;
  updatePrivacyMode: (identityId: string, mode: PrivacyMode) => void;
  deleteIdentity: (id: string) => void;
  transferIdentity: (id: string, toId: string) => void;
  regenerateKeyPair: (id: string) => void;

  // Dating
  datingProfiles: DatingProfile[];
  datingMatches: DatingMatch[];
  datingActiveMatchId: string | null;
  datingDailySwipes: number;
  swipeProfile: (
    profileId: string,
    direction: "like" | "pass",
  ) => DatingMatch | null;
  sendDatingMessage: (matchId: string, content: string) => void;
  sendTokenGift: (matchId: string, amount: number) => void;
  setDatingActiveMatch: (id: string | null) => void;

  // Settings
  upgradeToPremium: () => void;
}

// Non-persisted runtime state (typing indicators)
interface RuntimeState {
  typingConversations: string[];
  setTyping: (convId: string, isTyping: boolean) => void;
}

const _RANDOM_IDS: AnonymousID[] = [
  "+777 1129 4760",
  "+777 8844 3310",
  "+777 5521 7630",
  "+777 3310 9480",
];

export const useOmniStore = create<OmniState & RuntimeState>()(
  persist(
    (set, get) => ({
      myId: null,
      displayName: "Anonymous",
      isPremium: false,
      isOnboarded: false,

      activeModule: "home" as Module,
      setActiveModule: (m) => set({ activeModule: m }),

      completeOnboarding: (id, name) => {
        const identity = get().createIdentity("permanent", name, "🌟");
        set({
          myId: id,
          displayName: name,
          isOnboarded: true,
          activeIdentityId: identity.id,
        });
      },

      // Chat
      conversations: MOCK_CONVERSATIONS,
      activeConversationId: null,
      setActiveConversation: (id) => set({ activeConversationId: id }),

      sendMessage: (
        convId,
        content,
        selfDestructMins,
        isVoice,
        voiceDuration,
        replyToId,
      ) => {
        const state = get();
        const msg = {
          id: `m${Date.now()}`,
          senderId: state.myId ?? "You",
          content,
          timestamp: Date.now(),
          status: "sent" as const,
          selfDestructAt: selfDestructMins
            ? Date.now() + selfDestructMins * 60000
            : undefined,
          isVoice,
          voiceDuration,
          replyToId,
        };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId ? { ...c, messages: [...c.messages, msg] } : c,
          ),
        }));
      },

      createConversation: (participantId, ghostMode) => {
        const existing = get().conversations.find(
          (c) => !c.isGroup && c.participants.includes(participantId),
        );
        if (existing) return existing.id;
        const newConv: Conversation = {
          id: `c${Date.now()}`,
          participants: [participantId],
          messages: [],
          isGroup: false,
          isChannel: false,
          ghostMode: ghostMode ?? false,
          unread: 0,
        };
        set((s) => ({ conversations: [newConv, ...s.conversations] }));
        return newConv.id;
      },

      createGroup: (name, participants) => {
        const newGroup: Conversation = {
          id: `g${Date.now()}`,
          participants,
          messages: [],
          isGroup: true,
          isChannel: false,
          name,
          ghostMode: false,
          unread: 0,
        };
        set((s) => ({ conversations: [newGroup, ...s.conversations] }));
        return newGroup.id;
      },

      markConversationRead: (convId) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId ? { ...c, unread: 0 } : c,
          ),
        }));
      },

      addReaction: (convId, msgId, emoji, userId) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) => {
                    if (m.id !== msgId) return m;
                    const reactions: Record<string, string[]> = {
                      ...(m.reactions ?? {}),
                    };
                    if (!reactions[emoji]) reactions[emoji] = [];
                    if (!reactions[emoji].includes(userId)) {
                      reactions[emoji] = [...reactions[emoji], userId];
                    }
                    return { ...m, reactions };
                  }),
                }
              : c,
          ),
        }));
      },

      setMessageTranslation: (convId, msgId, translated) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === msgId
                      ? { ...m, translatedContent: translated }
                      : m,
                  ),
                }
              : c,
          ),
        }));
      },

      deleteMessage: (convId, msgId) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: c.messages.filter((m) => m.id !== msgId) }
              : c,
          ),
        }));
      },

      // Social
      stories: MOCK_STORIES,
      selectedInterests: [],
      setSelectedInterests: (interests) =>
        set({ selectedInterests: interests }),

      addStory: (content, emoji) => {
        const state = get();
        const newStory: Story = {
          id: `s${Date.now()}`,
          authorId: state.myId ?? generateAnonymousID(),
          content,
          emoji,
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000,
          views: 0,
        };
        set((s) => ({ stories: [newStory, ...s.stories] }));
      },

      viewStory: (storyId) => {
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === storyId ? { ...st, views: st.views + 1 } : st,
          ),
        }));
      },

      // Ride
      rideRole: "passenger",
      setRideRole: (role) => set({ rideRole: role }),
      driverOnline: false,
      setDriverOnline: (online) => {
        set({ driverOnline: online });
        if (online) {
          setTimeout(() => {
            const req: IncomingRideRequest = {
              id: `req${Date.now()}`,
              passengerAnonymousId: `+777 ${Math.floor(1000 + Math.random() * 8999)} ${Math.floor(1000 + Math.random() * 8999)}`,
              passengerEmoji: ["🌙", "⚡", "🔥", "💫", "🌊"][
                Math.floor(Math.random() * 5)
              ],
              origin: [
                "Kadıköy Meydan",
                "Beşiktaş İskelesi",
                "Taksim Meydanı",
                "Üsküdar",
              ][Math.floor(Math.random() * 4)],
              destination: [
                "Sabiha Gökçen",
                "Atatürk Havalimanı",
                "Levent Metro",
                "Bostancı",
              ][Math.floor(Math.random() * 4)],
              aiPrice: {
                distanceKm: +(5 + Math.random() * 15).toFixed(1),
                estimatedMinutes: Math.floor(12 + Math.random() * 20),
                baseFare: 45,
                trafficMultiplier: 1.2,
                surgeMultiplier: 1.0,
                fairPrice: Math.floor(55 + Math.random() * 30),
                minPrice: 50,
                maxPrice: 95,
              },
              expiresAt: Date.now() + 30000,
            };
            set({ incomingRideRequest: req });
          }, 3000);
        } else {
          set({ incomingRideRequest: null });
        }
      },
      nearbyDrivers: [
        {
          id: "nd1",
          anonymousId: "+777 4421 8830",
          emoji: "🚗",
          rating: 4.9,
          distanceKm: 0.4,
          vehicle: "Toyota Corolla",
          responseSpeed: 850,
        },
        {
          id: "nd2",
          anonymousId: "+777 7731 2210",
          emoji: "🚙",
          rating: 4.7,
          distanceKm: 0.8,
          vehicle: "Honda Civic",
          responseSpeed: 1200,
        },
        {
          id: "nd3",
          anonymousId: "+777 2209 5541",
          emoji: "🚘",
          rating: 4.5,
          distanceKm: 1.3,
          vehicle: "Renault Fluence",
          responseSpeed: 2100,
        },
      ],
      incomingRideRequest: null,
      driverEarnings: 0,
      activeRide: null,
      rideHistory: [],

      requestRide: (origin, destination, aiPrice) => {
        const state = get();
        const driver = state.nearbyDrivers[0];
        const ride: ActiveRide = {
          id: `ride${Date.now()}`,
          state: "REQUESTED",
          passengerAnonymousId: state.myId ?? "+777 0000 0000",
          driverAnonymousId: driver.anonymousId,
          driverEmoji: driver.emoji,
          driverRating: driver.rating,
          driverVehicle: driver.vehicle,
          origin,
          destination,
          aiPrice,
          agreedPrice: aiPrice.fairPrice,
          messages: [],
          driverProgress: 0,
        };
        set({ activeRide: ride });
        setTimeout(() => {
          set((s) =>
            s.activeRide
              ? { activeRide: { ...s.activeRide!, state: "DRIVER_ASSIGNED" } }
              : {},
          );
        }, 2000);
        setTimeout(() => {
          set((s) =>
            s.activeRide
              ? { activeRide: { ...s.activeRide!, state: "DRIVER_ARRIVING" } }
              : {},
          );
        }, 4000);
      },

      acceptRideRequest: () => {
        const state = get();
        const req = state.incomingRideRequest;
        if (!req) return;
        const ride: ActiveRide = {
          id: req.id,
          state: "DRIVER_ARRIVING",
          passengerAnonymousId: req.passengerAnonymousId,
          driverAnonymousId: state.myId ?? "+777 0000 0000",
          driverEmoji: "🚗",
          driverRating: 4.8,
          driverVehicle: "Toyota Corolla",
          origin: req.origin,
          destination: req.destination,
          aiPrice: req.aiPrice,
          agreedPrice: req.aiPrice.fairPrice,
          messages: [],
          driverProgress: 0,
        };
        set({ incomingRideRequest: null, activeRide: ride });
      },

      rejectRideRequest: () => set({ incomingRideRequest: null }),

      updateRideState: (rideState) => {
        set((s) =>
          s.activeRide
            ? { activeRide: { ...s.activeRide!, state: rideState } }
            : {},
        );
      },

      cancelRide: () => {
        set((s) => ({
          activeRide: s.activeRide
            ? { ...s.activeRide!, state: "CANCELLED" as RideState }
            : null,
        }));
        setTimeout(() => set({ activeRide: null }), 2000);
      },

      sendRideMessage: (content) => {
        const state = get();
        const msg: RideMessage = {
          id: `rm${Date.now()}`,
          senderId: state.myId ?? "me",
          content,
          timestamp: Date.now(),
        };
        set((s) =>
          s.activeRide
            ? {
                activeRide: {
                  ...s.activeRide!,
                  messages: [...s.activeRide!.messages, msg],
                },
              }
            : {},
        );
      },

      rateRide: (_rating) => {
        set((s) =>
          s.activeRide
            ? {
                activeRide: {
                  ...s.activeRide!,
                  state: "TRIP_COMPLETED" as RideState,
                },
              }
            : {},
        );
      },

      completeRide: () => {
        const state = get();
        if (!state.activeRide) return;
        const completed: CompletedRide = {
          id: state.activeRide.id,
          origin: state.activeRide.origin,
          destination: state.activeRide.destination,
          price: state.activeRide.agreedPrice,
          driverAnonymousId: state.activeRide.driverAnonymousId,
          passengerRating: 5,
          driverRating: 5,
          completedAt: Date.now(),
          distanceKm: state.activeRide.aiPrice.distanceKm,
          durationMinutes: state.activeRide.aiPrice.estimatedMinutes,
        };
        get().earnTokens(10, "Tamamlanan sürüş ödülü: +10 OMNI");
        set((s) => ({
          activeRide: null,
          rideHistory: [completed, ...s.rideHistory],
          driverEarnings: s.driverEarnings + state.activeRide!.agreedPrice,
        }));
      },

      // Market
      listings: MOCK_LISTINGS,
      purchaseListing: (listingId) => {
        set((s) => ({
          listings: s.listings.map((l) =>
            l.id === listingId ? { ...l, status: "sold" } : l,
          ),
        }));
      },
      createListing: (listing) => {
        const newListing: MarketListing = {
          ...listing,
          id: `l${Date.now()}`,
          status: "active",
          likes: 0,
        };
        set((s) => ({ listings: [newListing, ...s.listings] }));
      },

      // Wallet
      tokenBalance: 250,
      transactions: MOCK_TRANSACTIONS,
      claimedRewards: [],

      earnTokens: (amount, description) => {
        const tx: TokenTransaction = {
          id: `t${Date.now()}`,
          type: "earn",
          amount,
          description,
          timestamp: Date.now(),
        };
        set((s) => ({
          tokenBalance: s.tokenBalance + amount,
          transactions: [tx, ...s.transactions],
        }));
      },

      spendTokens: (amount, description) => {
        if (get().tokenBalance < amount) return false;
        const tx: TokenTransaction = {
          id: `t${Date.now()}`,
          type: "spend",
          amount: -amount,
          description,
          timestamp: Date.now(),
        };
        set((s) => ({
          tokenBalance: s.tokenBalance - amount,
          transactions: [tx, ...s.transactions],
        }));
        return true;
      },

      sendTokens: (targetId, amount) => {
        if (get().tokenBalance < amount) return false;
        const tx: TokenTransaction = {
          id: `t${Date.now()}`,
          type: "transfer",
          amount: -amount,
          description: `Gönderildi: ${targetId}`,
          timestamp: Date.now(),
        };
        set((s) => ({
          tokenBalance: s.tokenBalance - amount,
          transactions: [tx, ...s.transactions],
        }));
        return true;
      },

      claimReward: (rewardId, amount, description) => {
        if (get().claimedRewards.includes(rewardId)) return;
        set((s) => ({ claimedRewards: [...s.claimedRewards, rewardId] }));
        get().earnTokens(amount, description);
      },

      // P2P Economy
      p2pOffers: MOCK_P2P_OFFERS,
      escrowTrades: [],
      idListings: MOCK_ID_LISTINGS,
      userTrustScore: 4.2,
      completedTrades: 7,
      referralCount: 2,
      dailyStreakDays: 3,
      dailyStreakClaimed: false,
      claimedDrops: [],

      createP2POffer: (type, amount, price) => {
        const state = get();
        if (type === "sell" && state.tokenBalance < amount) return;
        const offer: P2POffer = {
          id: `o${Date.now()}`,
          type,
          sellerId: state.myId ?? "unknown",
          amount,
          price,
          trustScore: state.userTrustScore,
          createdAt: Date.now(),
        };
        const updates: Partial<OmniState & RuntimeState> = {
          p2pOffers: [offer, ...state.p2pOffers],
        };
        if (type === "sell") {
          const tx: TokenTransaction = {
            id: `t${Date.now()}`,
            type: "spend",
            amount: -amount,
            description: `P2P teklif kilitlendi: ${amount} OMNI`,
            timestamp: Date.now(),
          };
          updates.tokenBalance = state.tokenBalance - amount;
          updates.transactions = [tx, ...state.transactions];
        }
        set(updates);
      },

      acceptOffer: (offerId) => {
        const state = get();
        const offer = state.p2pOffers.find((o) => o.id === offerId);
        if (!offer) return;
        const trade: EscrowTrade = {
          id: `e${Date.now()}`,
          offerId,
          buyerId: state.myId ?? "unknown",
          sellerId: offer.sellerId,
          amount: offer.amount,
          price: offer.price,
          status: "tokens_locked",
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000,
        };
        set((s) => ({
          escrowTrades: [trade, ...s.escrowTrades],
          p2pOffers: s.p2pOffers.filter((o) => o.id !== offerId),
        }));
      },

      confirmPaymentSent: (escrowId) => {
        set((s) => ({
          escrowTrades: s.escrowTrades.map((e) =>
            e.id === escrowId ? { ...e, status: "payment_sent" } : e,
          ),
        }));
      },

      confirmPaymentReceived: (escrowId) => {
        const state = get();
        const trade = state.escrowTrades.find((e) => e.id === escrowId);
        if (!trade) return;
        const tx: TokenTransaction = {
          id: `t${Date.now()}`,
          type: "earn",
          amount: trade.amount,
          description: `P2P trade tamamlandı: +${trade.amount} OMNI`,
          timestamp: Date.now(),
        };
        set((s) => ({
          escrowTrades: s.escrowTrades.map((e) =>
            e.id === escrowId ? { ...e, status: "completed" } : e,
          ),
          tokenBalance: s.tokenBalance + trade.amount,
          transactions: [tx, ...s.transactions],
          completedTrades: s.completedTrades + 1,
          userTrustScore: Math.min(5.0, s.userTrustScore + 0.05),
        }));
      },

      disputeTrade: (escrowId) => {
        set((s) => ({
          escrowTrades: s.escrowTrades.map((e) =>
            e.id === escrowId ? { ...e, status: "disputed" } : e,
          ),
        }));
      },

      cancelEscrow: (escrowId) => {
        const state = get();
        const trade = state.escrowTrades.find((e) => e.id === escrowId);
        if (!trade || trade.status !== "tokens_locked") return;
        const tx: TokenTransaction = {
          id: `t${Date.now()}`,
          type: "earn",
          amount: trade.amount,
          description: `Escrow iptal: ${trade.amount} OMNI iade edildi`,
          timestamp: Date.now(),
        };
        set((s) => ({
          escrowTrades: s.escrowTrades.map((e) =>
            e.id === escrowId ? { ...e, status: "cancelled" } : e,
          ),
          tokenBalance: s.tokenBalance + trade.amount,
          transactions: [tx, ...s.transactions],
        }));
      },

      bidOnID: (listingId, amount) => {
        set((s) => ({
          idListings: s.idListings.map((l) =>
            l.id === listingId ? { ...l, currentBid: amount } : l,
          ),
        }));
      },

      buyNowID: (listingId) => {
        const state = get();
        const listing = state.idListings.find((l) => l.id === listingId);
        if (!listing) return false;
        if (state.tokenBalance < listing.buyNowPrice) return false;
        const tx: TokenTransaction = {
          id: `t${Date.now()}`,
          type: "spend",
          amount: -listing.buyNowPrice,
          description: `ID satın alındı: ${listing.idValue}`,
          timestamp: Date.now(),
        };
        set((s) => ({
          tokenBalance: s.tokenBalance - listing.buyNowPrice,
          transactions: [tx, ...s.transactions],
          idListings: s.idListings.filter((l) => l.id !== listingId),
        }));
        return true;
      },

      claimDrop: (dropId, amount) => {
        if (get().claimedDrops.includes(dropId)) return;
        set((s) => ({ claimedDrops: [...s.claimedDrops, dropId] }));
        get().earnTokens(amount, `Drop talep edildi: ${amount} OMNI`);
      },

      claimDailyStreak: () => {
        if (get().dailyStreakClaimed) return;
        set((s) => ({
          dailyStreakClaimed: true,
          dailyStreakDays: s.dailyStreakDays + 1,
        }));
        get().earnTokens(10, "Günlük streak bonusu: +10 OMNI");
      },

      // Friends
      friendRequests: MOCK_FRIEND_REQUESTS,
      friends: MOCK_FRIENDS,
      pulses: MOCK_PULSES,

      sendFriendRequest: (targetId, sharedInterests, pulseMatch) => {
        const state = get();
        const newRequest: FriendRequest = {
          id: `fr${Date.now()}`,
          fromId: state.myId ?? "myId",
          toId: targetId,
          direction: "outgoing",
          status: "pending",
          sentAt: Date.now(),
          pulseMatch,
          sharedInterests,
        };
        set((s) => ({ friendRequests: [...s.friendRequests, newRequest] }));
      },

      acceptFriendRequest: (requestId) => {
        const state = get();
        const req = state.friendRequests.find((r) => r.id === requestId);
        if (!req) return;
        const newFriend: Friend = {
          id: `f${Date.now()}`,
          friendId: req.fromId,
          addedAt: Date.now(),
          isPhantom: false,
          friendScore: 80,
          lastSeen: "Online",
          sharedInterests: req.sharedInterests,
          mood: "🌟",
        };
        set((s) => ({
          friends: [...s.friends, newFriend],
          friendRequests: s.friendRequests.map((r) =>
            r.id === requestId ? { ...r, status: "accepted" } : r,
          ),
        }));
      },

      declineFriendRequest: (requestId) => {
        set((s) => ({
          friendRequests: s.friendRequests.map((r) =>
            r.id === requestId ? { ...r, status: "declined" } : r,
          ),
        }));
      },

      addPulse: (content, emoji, mood) => {
        const state = get();
        const newPulse: PulseEntry = {
          id: `p${Date.now()}`,
          authorId: state.myId ?? generateAnonymousID(),
          content,
          emoji,
          mood,
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000,
          matchedIds: [],
        };
        set((s) => ({ pulses: [newPulse, ...s.pulses] }));
      },

      callLogs: [],
      addCallLog: (log) => {
        const newLog: CallLog = { ...log, id: `cl${Date.now()}` };
        set((s) => ({ callLogs: [newLog, ...s.callLogs] }));
      },

      addFriendById: (targetId) => {
        const state = get();
        if (targetId === state.myId) return "self";
        const alreadyFriend = state.friends.some(
          (f) => f.friendId === targetId,
        );
        if (alreadyFriend) return "already_friend";
        const newFriend: Friend = {
          id: `f${Date.now()}`,
          friendId: targetId,
          addedAt: Date.now(),
          isPhantom: false,
          friendScore: 80,
          lastSeen: "Online",
          sharedInterests: [],
          mood: "🌟",
        };
        set((s) => ({ friends: [newFriend, ...s.friends] }));
        return "added";
      },

      // Identity Hub
      identities: [],
      activeIdentityId: null,
      privacyMode: "normal" as PrivacyMode,

      createIdentity: (type, nickname, emoji, customSuffix) => {
        const identity = createOmniIdentityFn(
          type,
          nickname,
          emoji,
          customSuffix,
        );
        set((s) => ({
          identities: [...s.identities, identity],
          activeIdentityId: s.activeIdentityId ?? identity.id,
        }));
        return identity;
      },

      switchIdentity: (id) => {
        const state = get();
        const identity = state.identities.find((i) => i.id === id);
        if (!identity) return;
        set({ activeIdentityId: id, privacyMode: identity.privacyMode });
      },

      updatePrivacyMode: (identityId, mode) => {
        set((s) => ({
          privacyMode: mode,
          identities: s.identities.map((i) =>
            i.id === identityId ? { ...i, privacyMode: mode } : i,
          ),
        }));
      },

      deleteIdentity: (id) => {
        set((s) => ({
          identities: s.identities.filter((i) => i.id !== id),
          activeIdentityId:
            s.activeIdentityId === id
              ? (s.identities.find((i) => i.id !== id)?.id ?? null)
              : s.activeIdentityId,
        }));
      },

      transferIdentity: (id, toId) => {
        set((s) => ({
          identities: s.identities.map((i) =>
            i.id === id ? { ...i, ownerId: toId } : i,
          ),
        }));
      },

      regenerateKeyPair: (id) => {
        const keyPair = generateKeyPairFn();
        set((s) => ({
          identities: s.identities.map((i) =>
            i.id === id ? { ...i, ...keyPair } : i,
          ),
        }));
      },

      // Dating
      datingProfiles: [
        {
          id: "dp1",
          anonymousId: "+777 2847 3901",
          emoji: "🌙",
          mood: "Mistik",
          vibe: "Derin Düşünceli",
          interests: ["Müzik", "Sanat", "Teknoloji"],
          distance: 1.2,
          trustScore: 4.8,
          isOnline: true,
          bio: "Geceleri şehri gözlemliyorum...",
        },
        {
          id: "dp2",
          anonymousId: "+777 5519 6628",
          emoji: "⚡",
          mood: "Enerjik",
          vibe: "Maceraperest",
          interests: ["Spor", "Seyahat", "Yemek"],
          distance: 2.5,
          trustScore: 4.2,
          isOnline: true,
          bio: "Her gün yeni bir macera!",
        },
        {
          id: "dp3",
          anonymousId: "+777 8834 1122",
          emoji: "🌊",
          mood: "Sakin",
          vibe: "Huzurlu",
          interests: ["Kitap", "Doğa", "Meditasyon"],
          distance: 0.8,
          trustScore: 4.9,
          isOnline: false,
          bio: "İç huzurun peşinde...",
        },
        {
          id: "dp4",
          anonymousId: "+777 1107 4456",
          emoji: "🔥",
          mood: "Tutkulu",
          vibe: "Yaratıcı",
          interests: ["Dans", "Sinema", "Teknoloji"],
          distance: 3.1,
          trustScore: 3.9,
          isOnline: true,
          bio: "Yaratıcılık sınır tanımaz.",
        },
        {
          id: "dp5",
          anonymousId: "+777 7723 8890",
          emoji: "💫",
          mood: "Gizemli",
          vibe: "Özgün",
          interests: ["Şiir", "Müzik", "Felsefe"],
          distance: 1.9,
          trustScore: 4.6,
          isOnline: true,
          bio: "Kelimelerin gücüne inanıyorum.",
        },
      ],
      datingMatches: [],
      datingActiveMatchId: null,
      datingDailySwipes: 0,

      swipeProfile: (profileId, direction) => {
        const state = get();
        set((s) => ({ datingDailySwipes: s.datingDailySwipes + 1 }));
        get().earnTokens(1, "Swipe ödülü");
        if (direction === "like" && Math.random() > 0.4) {
          const profile = state.datingProfiles.find((p) => p.id === profileId);
          if (!profile) return null;
          const match: DatingMatch = {
            id: `dm${Date.now()}`,
            profileId,
            profile,
            matchedAt: Date.now(),
            messages: [],
            tokensSent: 0,
            isActive: true,
          };
          set((s) => ({
            datingMatches: [match, ...s.datingMatches],
            datingProfiles: s.datingProfiles.filter((p) => p.id !== profileId),
          }));
          get().earnTokens(20, "Eşleşme ödülü! +20 OMNI");
          return match;
        }
        set((s) => ({
          datingProfiles: s.datingProfiles.filter((p) => p.id !== profileId),
        }));
        return null;
      },

      sendDatingMessage: (matchId, content) => {
        const state = get();
        const msg: DatingMessage = {
          id: `dm${Date.now()}`,
          senderId: state.myId ?? "me",
          content,
          timestamp: Date.now(),
        };
        set((s) => ({
          datingMatches: s.datingMatches.map((m) =>
            m.id === matchId ? { ...m, messages: [...m.messages, msg] } : m,
          ),
        }));
        get().earnTokens(5, "İlk mesaj ödülü");
      },

      sendTokenGift: (matchId, amount) => {
        const state = get();
        if (state.tokenBalance < amount) return;
        const msg: DatingMessage = {
          id: `gift${Date.now()}`,
          senderId: state.myId ?? "me",
          content: `🎁 ${amount} OMNI hediye gönderildi!`,
          timestamp: Date.now(),
          isGift: true,
          giftAmount: amount,
        };
        set((s) => ({
          tokenBalance: s.tokenBalance - amount,
          datingMatches: s.datingMatches.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  messages: [...m.messages, msg],
                  tokensSent: m.tokensSent + amount,
                }
              : m,
          ),
        }));
      },

      setDatingActiveMatch: (id) => set({ datingActiveMatchId: id }),

      // Settings
      upgradeToPremium: () => {
        set({ isPremium: true });
      },

      // Runtime
      typingConversations: [],
      setTyping: (convId, isTyping) => {
        set((s) => ({
          typingConversations: isTyping
            ? [...s.typingConversations, convId]
            : s.typingConversations.filter((id) => id !== convId),
        }));
      },
    }),
    {
      name: "omni-store",
      partialize: (state) => ({
        myId: state.myId,
        displayName: state.displayName,
        isPremium: state.isPremium,
        isOnboarded: state.isOnboarded,
        conversations: state.conversations,
        stories: state.stories,
        selectedInterests: state.selectedInterests,
        listings: state.listings,
        tokenBalance: state.tokenBalance,
        transactions: state.transactions,
        claimedRewards: state.claimedRewards,
        p2pOffers: state.p2pOffers,
        escrowTrades: state.escrowTrades,
        idListings: state.idListings,
        userTrustScore: state.userTrustScore,
        completedTrades: state.completedTrades,
        referralCount: state.referralCount,
        dailyStreakDays: state.dailyStreakDays,
        dailyStreakClaimed: state.dailyStreakClaimed,
        claimedDrops: state.claimedDrops,
        friendRequests: state.friendRequests,
        friends: state.friends,
        pulses: state.pulses,
        callLogs: state.callLogs,
        identities: state.identities,
        activeIdentityId: state.activeIdentityId,
        privacyMode: state.privacyMode,
        datingProfiles: state.datingProfiles,
        datingMatches: state.datingMatches,
        datingDailySwipes: state.datingDailySwipes,
        rideRole: state.rideRole,
        driverOnline: state.driverOnline,
        rideHistory: state.rideHistory,
        driverEarnings: state.driverEarnings,
      }),
    },
  ),
);
