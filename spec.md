# OMNI Super App

## Current State
The app has multiple demo/mock data issues and functional bugs identified through a comprehensive audit:
1. Dating profiles deplete permanently (localStorage persisted)
2. Token transfer is one-sided simulation
3. All modules initialize with MOCK data (fake friends, fake chats, fake transactions)
4. Ride module is inaccessible (no BottomNav button)
5. "home" module type causes blank screen if navigated
6. Onboarding button can lock on null activeId777
7. `addFriendById` can malfunction when myId is null
8. BottomNav has 7 items that can get cramped on narrow screens

## Requested Changes (Diff)

### Add
- Dating profile auto-refresh: when profiles run low (≤1), generate new random profiles from a pool generator function
- `refreshDatingProfiles()` action in store that regenerates a fresh set of 5 profiles
- Ride access shortcut in Profile module quick actions area
- "Yeni Profiller Yükle" button in DatingModule empty state

### Modify
- `sendTokens` in omniStore: add a simulation credit to the "recipient" conversation if one exists in same session (update a `pendingCredits` map; show toast that recipient will receive tokens)
- Initial store state: replace MOCK_CONVERSATIONS, MOCK_FRIENDS, MOCK_FRIEND_REQUESTS, MOCK_PULSES, MOCK_STORIES, MOCK_TRANSACTIONS with empty arrays `[]` so new users start clean
- Keep MOCK_LISTINGS, MOCK_P2P_OFFERS, MOCK_ID_LISTINGS as market seed data (these are content, not personal data)
- `addFriendById`: guard against null myId by checking `if (targetId === state.myId && state.myId !== null)`
- App.tsx: add fallback for `activeModule === "home"` to render DatingModule (or redirect)
- OnboardingScreen: ensure handleICPFinish always generates fallback ID immediately without waiting
- DatingModule empty state: add "Yenile" button that calls `refreshDatingProfiles()`
- BottomNav: ensure all 7 items have equal spacing and don't overflow on narrow screens

### Remove
- Nothing removed

## Implementation Plan
1. Update `omniStore.ts`:
   - Change initial `conversations`, `friends`, `friendRequests`, `pulses`, `stories`, `transactions` from MOCK arrays to `[]`
   - Fix `addFriendById` null guard
   - Add `refreshDatingProfiles` action
   - Improve `sendTokens` to show clear simulation UX (toast + transaction note)
2. Update `App.tsx`: add `activeModule === "home"` fallback to show DatingModule
3. Update `DatingModule.tsx`: add refresh button in empty state
4. Update `ProfileModule.tsx`: add Ride shortcut button that calls `setActiveModule("ride")`
5. Update `BottomNav.tsx`: ensure responsive spacing
6. Validate build
