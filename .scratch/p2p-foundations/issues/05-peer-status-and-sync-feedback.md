# 05 — Peer status and sync feedback

**What to build:** A UI component that shows how many peers are connected, whether each peer is currently syncing, and basic sync progress indicators so the user can see the P2P state at a glance.

**Blocked by:** 01 — P2P foundation

- [ ] Extend PeerStatus component with peer count and connection state
- [ ] Wire component to OrbitDB IPFS swarm peer events (peers.connected/peers.disconnected)
- [ ] Show a visual indicator of sync activity (e.g., "3 peers connected, syncing...")
- [ ] Display a simple event count or "last synced" timestamp
- [ ] Update indicators in real-time as peers join/leave
- [ ] Ensure UI remains responsive even when swarm status changes quickly
