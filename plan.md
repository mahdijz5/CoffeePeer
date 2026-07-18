# CoffeePeer — P2P Inventory & Sales System

## Goal

Build a minimal P2P coffee shop inventory system to test peer-to-peer sync, with a later path to local/private IPFS networks.

## Stack

| Layer       | Technology                                     |
|-------------|------------------------------------------------|
| UI          | React + Vite                                   |
| State       | Zustand                                        |
| P2P DB      | OrbitDB (Helia-native v3+)                     |
| Transport   | IPFS swarm (public DHT → later private subnet) |
| Packaging   | Tauri v2 (CLI only initially)                  |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React UI                           │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐   │
│  │ ItemList │ │ SaleApp  │ │ PeerStatus         │   │
│  │ CRUD     │ │ Sell     │ │ Connected peers    │   │
│  └────┬─────┘ └────┬─────┘ └─────────┬──────────┘   │
└───────┼─────────────┼────────────────┼──────────────┘
        │             │                │
┌───────┼─────────────┼────────────────┼──────────────┐
│                  Event Store (OrbitDB Log)             │
│              ItemCreated / ItemUpdated / ItemSold      │
└────────────────────────┼──────────────────────────────┘
                          │
┌────────────────────────┼──────────────────────────────┐
│                 State Derivation Layer                 │
│           Reads event log → rebuilds item state        │
└────────────────────────┼──────────────────────────────┘
                          │
┌────────────────────────┼──────────────────────────────┐
│                   Offline Queue                        │
│          Events buffered when disconnected             │
└────────────────────────┼──────────────────────────────┘
                          │
┌────────────────────────┼──────────────────────────────┐
│                IPFS Swarm (Phase 1: public DHT)        │
│              Peer discovery + replication              │
└────────────────────────────────────────────────────────┘
```

## Data Model

### Item (mutable, last-write-wins per field)

| Field   | Type   | Description              |
|---------|--------|--------------------------|
| id      | string | Unique identifier        |
| title   | string | Item name                |
| price   | number | Sell price               |
| stock   | number | Current inventory (may go negative) |

### Events (append-only, immutable)

```json
{ "op": "addItem", "data": { "id": "item-1", "title": "Latte", "price": 4.50 } }
{ "op": "updateItem", "data": { "id": "item-1", "price": 4.00 } }
{ "op": "sellItem", "data": { "itemId": "item-1", "quantity": 2 } }
```

## Business Rules

1. Stock can go negative — no rejection at sell time
2. Offline queue — events append locally when disconnected, replay on reconnect
3. CRDT convergence — all peers eventually see the same event log
4. Public IPFS first — use public DHT, move to private subnet later
5. Full local state — each peer stores a complete copy
6. Event sourcing pattern — domain events logged append-only; state derived from log

## Implementation Order

```
Phase 1: Infrastructure
  1. Scaffold Vite + React + Zustand
  2. Install & initialize OrbitDB
  3. Build EventStore wrapper (append/query log)

Phase 2: State Layer
  4. Build ItemReducer (derive items from event log)
  5. Add offline queue (FIFO buffer)

Phase 3: UI & P2P
  6. Build CRUD UI (ItemList, ItemForm)
  7. Build Sale flow (append ItemSold event)
  8. Test P2P sync between 2 instances
  9. Add offline queue + reconnect
```

## Future Transition — Public to Private IPFS

Phase 1: Public DHT, open peer discovery
Phase 2: Private subnet, static peers, local LAN only — config switch `mode: 'public' | 'private'`

## Open Questions

- [ ] Tauri Android build steps (once cargo installed)
- [ ] Private subnet bootstrap mechanics
- [ ] VPN/Tailscale bridging for multi-branch shops
