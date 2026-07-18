# 01 — P2P foundation: project setup, OrbitDB init, and end-to-end sync

**What to build:** A minimal Tauri v2 + Vite + React project scaffolds, OrbitDB initializes on Helia IPFS, two instances discover each other via the public DHT, and one peer can append an event that the other receives and sees reflected in local state.

**Blocked by:** None — can start immediately

## What to build

- [ ] Scaffold Tauri v2 + Vite + React project (frontend only, no Rust code)
- [ ] Install OrbitDB (Helia-compatible) and Helia
- [ ] Initialize IPFS + OrbitDB in a singleton service, with a global `isConnected` watcher
- [ ] Build a simple event store module that appends events and replays the log
- [ ] Build PeerStatus component that displays peer count and connection status
- [ ] Demonstrate two running instances discover each other on public DHT
- [ ] Demonstrate Peer A appends an event and Peer B sees it in its event log within a few seconds
