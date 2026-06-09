# Video Calling App — Plan

A 1-on-1 WebRTC video calling website. Users land on a polished dark home page, create a room, share the link, and connect peer-to-peer. Signaling (offer/answer/ICE exchange) runs through Lovable Cloud Realtime — no media ever touches the server.

## Pages / Routes

- `/` — Landing page. Hero, feature highlights, "Create Room" CTA, "Join with code" input.
- `/room/$roomId` — Pre-call lobby + in-call view. Camera preview, name input, mic/cam toggles, then join.

## Core Features

- Create + share room link (random short room ID)
- Camera / mic preview before joining
- Mute mic, toggle camera, hang up
- Screen sharing (replace video track)
- In-call text chat (via WebRTC DataChannel)
- Connection status indicator
- Copy-link button + share toast

## Tech / Implementation

**WebRTC peer connection**
- `RTCPeerConnection` with public STUN servers (`stun:stun.l.google.com:19302`)
- First peer to enter the room is "polite" caller; second peer answers
- Negotiation via Supabase Realtime broadcast channel keyed by `room:{roomId}`
- Messages exchanged: `join`, `offer`, `answer`, `ice-candidate`, `leave`
- DataChannel for chat messages

**Signaling (Lovable Cloud Realtime)**
- No DB tables needed — signaling is ephemeral broadcast
- Each room = one Supabase Realtime channel with broadcast + presence
- Presence tracks the 2 participants; if a 3rd tries to join, show "Room full"

**Frontend structure**
- `src/lib/webrtc/usePeerConnection.ts` — hook managing RTCPeerConnection lifecycle, tracks, datachannel
- `src/lib/webrtc/useSignaling.ts` — hook wrapping Supabase Realtime channel
- `src/components/call/VideoTile.tsx` — local + remote video tiles
- `src/components/call/CallControls.tsx` — bottom control bar (mic, cam, screen, chat, leave)
- `src/components/call/ChatPanel.tsx` — slide-in sidebar chat
- `src/components/landing/*` — hero, features, CTA

## Design (modern dark)

- Deep near-black background (`oklch(0.18 0.02 270)`) with subtle radial gradient
- Vivid accent: electric violet → cyan gradient on primary buttons and call-active states
- Glass/blur surfaces for control bars and chat panel
- Geometric sans (Space Grotesk display + Inter body) loaded via `<link>` in `__root.tsx`
- Animated hero: floating gradient orb, subtle grain texture
- Generated hero illustration (abstract people-on-video-call motif) for landing

## Backend

- Enable Lovable Cloud (Supabase) — used only for Realtime signaling, no auth required for v1
- No tables / no edge functions needed

## Out of Scope (v1)

- Auth / accounts
- Group calls (3+ participants) — current plan is strict 1-on-1
- Recording, transcription, virtual backgrounds
- TURN server (calls between strict-NAT peers may fail without one; can be added later via a TURN credential provider)

## Verification

- Build passes
- Open `/room/abc` in two browser windows → both videos appear, mute/cam toggles work, chat delivers, screen share replaces video
