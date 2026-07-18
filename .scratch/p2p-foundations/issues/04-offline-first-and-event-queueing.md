# 04 — Sync status and reconnect feedback

**What to build:** A UI component that shows how many peers are connected and whether PubSub replication is active. No custom offline queue — OrbitDB's log is the queue; when peers reconnect they replay the log automatically.

**Blocked by:** 01 — P2P foundation

- [ ] Build PeerStatus component showing connected peer count and replication status
- [ ] Wire component to listen for peer connect/disconnect events
- [ ] Display "connected", "syncing", and disconnected states
- [ ] No custom offline queue — just show sync state; replication is handled by PubSub
- [ ] Verify PeerStatus updates when a second instance joins or leaves
