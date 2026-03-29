# OMNI Super App

## Current State
- Backend has `MixinStorage` (blob-storage) and `MixinAuthorization` but NO token ledger methods.
- `StorageClient.ts` exists in frontend with full upload/download logic but is NOT wired to SocialModule.
- SocialModule uses `URL.createObjectURL()` for media — lost on refresh.
- WalletModule token transfer is fully simulated via localStorage in `omniStore.ts`.
- `sendTokens` only deducts from sender, never credits recipient. No real P2P.
- backend.d.ts only has storage + authorization methods, no token methods.

## Requested Changes (Diff)

### Add
- Motoko backend: OMNI token ledger (balance map per Principal, transfer, getBalance, mintInitial, transaction history)
- Frontend: `useStorageUpload` hook that wraps `StorageClient` with the backend actor agent
- SocialModule: real upload to ICP blob-storage on post creation, persistent URLs from `getDirectURL`
- WalletModule: call `getBalance` and `transferTokens` on ICP backend; show real on-chain balance
- `useOmniToken` hook for balance/transfer with loading/error state
- Post data stored in backend as well (title, mediaHash, authorPrincipal)

### Modify
- `omniStore.ts`: `tokenBalance` sourced from ICP backend when available, localStorage as fallback/cache
- `SocialModule.tsx`: replace object URL with blob-storage hash URL after upload
- `WalletModule.tsx`: replace `sendTokens` from store with `transferTokens` actor call

### Remove
- Simulated token deduction without real credit to recipient
- Ephemeral object URLs for media posts

## Implementation Plan
1. Generate Motoko backend with token ledger: `mintInitialTokens`, `getBalance`, `transferTokens(toPrincipal, amount)`, `getTransactionHistory`, and `storeSocialPost(mediaHash, caption, mediaType)` + `getSocialPosts`.
2. Update backend.d.ts bindings (auto-generated after motoko generation).
3. Add `useOmniToken.ts` hook: wraps actor calls for balance fetch and transfer.
4. Add `useStorageUpload.ts` hook: wraps StorageClient with actor agent and config.
5. Update `SocialModule.tsx`: on post submit, upload file via StorageClient, get hash URL, store post on-chain.
6. Update `WalletModule.tsx`: on mount fetch `getBalance`, on send call `transferTokens` with recipient principal.
