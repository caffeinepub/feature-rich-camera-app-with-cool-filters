# Specification

## Summary
**Goal:** Add a basic Live mode that lets a user broadcast their camera stream to remote viewers over the internet using WebRTC peer connections, using canister-based (polling) signaling and clear in-app messaging about limitations.

**Planned changes:**
- Add a new **Live** mode entry point in the camera screen, distinct from Photo/Video.
- Implement broadcaster flow: start a live session, display a shareable session code/link, and show connection status (waiting/connected/ended) and user-friendly errors.
- Implement viewer flow: join via session code and/or shareable link, establish a WebRTC connection using the canister signaling API, and play the live stream in an HTML5 video element with loading/empty/error states.
- Add canister signaling methods in the single Motoko actor to create/join sessions, post/fetch SDP/ICE signaling messages via polling, and end/cleanup sessions with basic validation.
- Update the in-app Help modal with a new English section explaining Live mode steps, permissions, and key limitations (basic P2P reliability; backend does not host video).

**User-visible outcome:** Users can start a Live session to share a code/link, and others can join to watch the live camera stream in-app; the UI clearly communicates connection states, errors, and that this is a basic peer-to-peer live feature (not scalable streaming).
