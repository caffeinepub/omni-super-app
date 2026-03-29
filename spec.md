# OMNI Super App

## Current State
Chat module has simulated voice/video calls using setTimeout to fake a "connected" state. No real peer-to-peer connection exists. Backend has token, storage, and +777 ID mapping functions.

## Requested Changes (Diff)

### Add
- Backend: `sendSignal(toId777, signal)` — store WebRTC signal for a user
- Backend: `pollMySignals()` — retrieve and clear pending signals for caller
- Frontend: `useWebRTC` hook — full WebRTC P2P with Google STUN + OpenRelay TURN
- Frontend: Incoming call UI — show accept/reject when receiving an offer signal
- Frontend: Polling loop — every 2s check for incoming signals when app is active

### Modify
- Backend `main.mo`: add Array import and signal queue map + two new functions
- `ChatModule.tsx`: replace `startCall`/`endCall` simulation with real WebRTC hook; add incoming call overlay
- `backend.d.ts`: add new signal function types

### Remove
- `setTimeout` fake "connected" state in `startCall`

## Implementation Plan
1. Update `main.mo` with signal queue functions
2. Update `backend.d.ts` with new types
3. Create `useWebRTC.ts` hook with RTCPeerConnection, STUN/TURN config, offer/answer/ICE exchange
4. Update `ChatModule.tsx` to use `useWebRTC` hook and show incoming call UI
