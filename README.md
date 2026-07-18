# CoffeePeer

> P2P inventory and sales for coffee shops.
> Test P2P sync with a simple CRUD demo: add items, sell items, verify stock updates across peers.
> Later switch to private/local IPFS.

## Stack

React + Vite + Zustand, libp2p + gossipsub (P2P pubsub), Tauri v2

> **Note on OrbitDB:** OrbitDB v0.29.0 is deprecated and depends on legacy js-ipfs (not Helia).
> OrbitDB won't run in a browser without Node.js builtins, so the codebase uses
> `libp2p` with `gossipsub` directly for peer discovery and pubsub event broadcasting.
> OrbitDB can be swapped in later when Helia-native support lands.

## Prerequisites

- Node.js 18+ (via nvm, fnm, etc.)
- Rust 1.77+ (via [rustup](https://rustup.rs/))
- Cargo (comes with Rust)

```bash
curl -sSf --proto '=https' --tlv1.0.1 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
cargo install tauri-cli@2 --locked
```

## Run

### Option A — Vite (development server)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:5173/ in your browser
```

To verify P2P sync: open **two browser tabs** pointing at `http://localhost:5173/`.
They will discover each other via the public DHT and broadcast events between peers.

### Option B — Tauri desktop app

```bash
# Install dependencies (if not already done)
npm install

# Build and launch as a desktop app
source "$HOME/.cargo/env"
cargo tauri dev
```

### Testing sync between peers

1. Start two instances (either two browser tabs or two Tauri windows on different ports).
2. Add an item on the first instance — it will appear on the second via pubsub.
3. Click "Sell" on an item — stock decrements on both instances.
4. The green/yellow/red dot shows connection status and peer count.

## Project structure

```
src/
├── components/
│   ├── ItemList.jsx          # Renders inventory table
│   ├── ItemForm.jsx          # Add/edit item form
│   └── PeerStatus.jsx        # Connection status indicator
├── services/
│   ├── pubsub.js             # libp2p + gossipsub singleton
│   └── eventStore.js         # Append events, broadcast via pubsub
├── store/
│   └── index.js              # Zustand: items + logs + reducer
└── types/
    └── events.js             # Event builders (addItem, updateItem, sellItem)
src-tauri/                    # Tauri packaging (Rust, no FFI needed yet)
```

## Architecture

```
┌───────────────┐    pubsub ────  ┌───────────────┐
│  Peer A       │ ◄─────────────► │  Peer B       │
│  ───────────  │   gossipsub     │  ───────────   │
│  React UI     │   /coffepeer    │  React UI      │
│  Event log    │   /v1/event     │  Event log     │
└───────────────┘                 └───────────────┘
```

Each peer maintains a full copy of the event log. Events append locally then
broadcast to connected peers through libp2p's gossipsub overlay. State derives
from the log by replaying events through a reducer.
