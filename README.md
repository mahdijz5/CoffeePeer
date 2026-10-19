# CoffeePeer

> Offline-first inventory and sales for coffee shops, installable on phones.
> No backend: devices sync event logs through JSON files in a private GitHub repo.

## How it works

Every change (add item, restock, sell, edit price) is an event appended to a local log
(saved in the browser's `localStorage`). Stock and prices are derived by replaying the
merged log of all devices, so offline edits from several phones always add up.

Sync talks to the GitHub Contents API directly from the browser:

- **Push:** each device appends only to its own file `events/YYYY-MM/<deviceId>.jsonl` in the data repo, so devices never conflict.
- **Pull:** every device reads all files and merges them (deduped by event id).
- **When:** right after each change, every 60s while the app is open, on regaining focus or network, and with the "Sync now" button.

Stock can go negative if two phones sell the last item offline; it shows red.

## Stack

React + Vite + Zustand, `vite-plugin-pwa`, GitHub Pages for hosting. (`src-tauri/` is an unused Tauri shell kept for a possible native build.)

## Setup

1. Create a **private** repo for the data, e.g. `CoffeePeer-data` (an initial commit, e.g. a README, so the default branch exists).
2. Create a **fine-grained personal access token**: only that repo, permission *Contents: Read and write*. Use one token per phone so a lost phone can be revoked.
3. Create the public app repo `CoffeePeer`, push this code to `main`, and in *Settings → Pages* set the source to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` deploys it.
4. Open `https://<you>.github.io/CoffeePeer/` on a phone, enter `<you>/CoffeePeer-data` and the token, then use *Add to Home Screen*.

## Develop

```bash
npm install
npm run dev                    # http://localhost:5173/CoffeePeer/
node scripts/selfcheck.mjs     # merge/replay logic checks
npm run build
```

To test sync locally, open two different browser profiles (each has its own `localStorage` and so its own device id) with the same repo and token.

## Limits

- The token on each phone can read and write all data in the repo. Keep the repo private.
- Sync only runs while the app is open (PWAs have no reliable background sync).
- Title/price edits use last-write-wins by timestamp, so a badly wrong phone clock can win.
- Clearing a phone's site data loses its unsynced events and gives it a new device id.
- `localStorage` (~5MB) holds the log; move to IndexedDB if a shop outgrows it.
