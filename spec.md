# OMNI Super App

## Current State
- ProfileModule has hardcoded fake stats (47 posts, 1.2K followers, 384 following)
- Bio is hardcoded static text
- Trust score is hardcoded "4.8"
- Avatar is a static emoji with no upload capability
- ProfileModule Posts/Videos tabs use local MOCK_POSTS/MOCK_REELS arrays disconnected from SocialModule
- SocialModule manages posts/reels via local useState — not shared with Profile
- Profile Market tab uses empty MOCK_MARKET, not connected to real `listings` store
- Profile Rides tab uses empty MOCK_RIDES, not connected to real `rideHistory` store
- SocialModule NEARBY_USERS are 6 hardcoded fake +777 IDs

## Requested Changes (Diff)

### Add
- `posts` and `reels` arrays moved into `omniStore` (with `addPost`, `addReel`, `deletePost` actions) so both SocialModule and ProfileModule share the same data
- `profileAvatarUrl: string | null` field in omniStore (persisted)
- `profileBio: string` field in omniStore (persisted, default empty)
- `followers: number` and `following: number` fields in omniStore (persisted, default 0)
- Profile avatar upload: tapping avatar opens file input (image only), stores as base64 dataURL in omniStore `profileAvatarUrl`
- Profile bio edit: tap bio area → inline edit input → save on blur/enter
- Profile Posts tab: shows posts from omniStore where `authorId === myId`, plus an upload/create button
- Profile Videos tab: shows reels from omniStore where `authorId === myId`, plus an upload/create button

### Modify
- ProfileModule stats: `value` for posts = `myPosts.length.toString()`, followers = `followers.toString()`, following = `following.toString()`
- ProfileModule trust score: use `userTrustScore` from store (e.g., `(userTrustScore / 20).toFixed(1)` to convert 0-100 → 0-5 scale)
- ProfileModule bio display: use `profileBio` from store, show placeholder "Bio ekle..." if empty
- Profile avatar: if `profileAvatarUrl` exists show as `<img>`, else show 🌟 emoji; add camera icon overlay for upload
- ProfileModule Market tab: use `listings` from omniStore filtered by `sellerId === myId` (or all if no seller field)
- ProfileModule Rides tab: use `rideHistory` from omniStore
- SocialModule `posts`/`reels` state: replace `useState(INITIAL_POSTS)` / `useState(INITIAL_REELS)` with omniStore `posts`/`reels` and actions
- SocialModule NEARBY_USERS: replace hardcoded array with empty array (show "Yakında kullanıcı yok" empty state)

### Remove
- MOCK_POSTS, MOCK_REELS, MOCK_MARKET, MOCK_RIDES local constants from ProfileModule (already empty but still referenced in logic — replace with store data)
- Hardcoded stats values "47", "1.2K", "384"
- Hardcoded bio text
- Hardcoded "Güven 4.8" trust score
- NEARBY_USERS hardcoded array in SocialModule

## Implementation Plan
1. Add to `omniStore`: `posts: Post[]`, `reels: Reel[]`, `addPost(post)`, `addReel(reel)`, `deletePost(id)`, `profileAvatarUrl: string | null`, `setProfileAvatarUrl(url)`, `profileBio: string`, `setProfileBio(bio)`, `followers: number`, `following: number` — all persisted
2. Export Post/Reel types from omniStore so both modules can import them
3. Update SocialModule: use `posts`/`reels` from omniStore instead of local useState; keep all existing UI/upload logic intact
4. Update ProfileModule:
   - Avatar: shows `profileAvatarUrl` or emoji; camera icon overlay triggers hidden file input; on file select → read as base64 → `setProfileAvatarUrl`
   - Bio: inline editable — tap to edit, save on blur; uses `profileBio` / `setProfileBio`
   - Stats: dynamic from store
   - Trust score: computed from `userTrustScore`
   - Posts tab: omniStore `posts.filter(p => p.authorId === myId)` — show grid with upload button
   - Videos tab: omniStore `reels.filter(r => r.authorId === myId)` — show list with upload button
   - Market tab: `listings` from store
   - Rides tab: `rideHistory` from store
5. Remove NEARBY_USERS hardcoded data from SocialModule; show empty state
6. Bump store version to clear stale data
