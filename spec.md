# OMNI Super App

## Current State
Full-stack super app with Chat, Social, Dating, Market, Wallet, AI, Profile, Ride modules. Multiple rounds of bug fixing done but several critical issues remain across all modules.

## Requested Changes (Diff)

### Add
- `likeReel` action in omniStore for Reels tab likes

### Modify
- **omniStore**: `tokenBalance` initial value → 0 (not 250); `completedTrades` → 0; `referralCount` → 0; `dailyStreakDays` → 0; `userTrustScore` → 0; `rideRole`/`driverOnline` not persisted; `createConversation` race condition fix; Market `sellerId` fallback fix to `+777 0000 0000`
- **ProfileModule**: `trustDisplay` fix — use `(userTrustScore).toFixed(1)` not divide by 20; SubSection "Arkadaşlar" use real `friends` store; SubSection "Eşleşmeler" use real `datingMatches` store; Admin panel note it's demo data
- **SocialModule**: `handleCreate` must copy `mediaUrl` and `mediaType` to new post; `toggleLike` for reels call `likeReel` store action; `handleTip` deduct from `tokenBalance` via store `sendTokens`; ProfileTab use real store data (myId777, socialPosts, tokenBalance, bio)
- **ChatModule**: message button must call `setActiveTab("dms")` AND `setActiveConversation(id)` together; smart replies in Turkish; conversation title use otherParticipant name not own ID
- **WalletModule**: `formatCountdown` "d" → "dk"; ICP relTime use `dk/sa/g` consistently
- **DatingModule**: `timeAgo` "d" → "dk"
- **MarketModule**: `sellerId` fallback `+777 0000 0000`; `trustScore` use `userTrustScore` from store

### Remove
- Hardcoded fake friends list in ProfileModule SubSection
- Hardcoded fake matches in ProfileModule SubSection  
- Hardcoded stats (trust=94, followers=1247, posts=42) in SocialModule ProfileTab
- Hardcoded bio in SocialModule ProfileTab

## Implementation Plan
1. Fix omniStore: initial values, likeReel action, createConversation race, partialize (remove rideRole/driverOnline)
2. Fix ProfileModule: trustDisplay formula, real friends/matches data, admin panel label
3. Fix SocialModule: mediaUrl passthrough, reel likes, token tip, ProfileTab real data
4. Fix ChatModule: tab+conversation switching, Turkish smart replies, title logic
5. Fix WalletModule + DatingModule: time format strings
6. Fix MarketModule: sellerId format, trustScore from store
