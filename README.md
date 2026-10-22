# CoffeePeer

> Offline-first inventory and sales for coffee shops, installable on phones.
> No backend: devices sync event logs through JSON files in a private GitHub repo.

## What it does

A small coffee-shop manager, in Persian (RTL, Jalali dates, تومان), usable offline on phones:

- **Stock:** items with icon, sell price and production cost (the shop makes its own items, so there are no purchases); one-tap sell, "add stock" with a quantity, edit and remove.
- **Profit:** each sale remembers the price and cost it was made at, so editing prices or cost later never rewrites old profit.
- **Detailed sell** ("جزئیات" beside Sell): count, optional note and customer name. Names are saved automatically as customers (matched ignoring ي/ی, ك/ک and spacing), suggested in a dropdown while typing, and listed with totals in the Customers tab. Each customer has a full purchase view (price, cost, profit, notes), rename (renaming to an existing name merges the two; the name changes in all their past sales) and delete (the name is removed from their sales; the sales stay in history and reports).
- **Debts (نسیه):** in the sell form, "paid amount" defaults to the full total; paying less records the rest as that customer's debt (a customer name is then required). Every debt is its own record with partial payments and a payment history; the 💳 tab lists them (open / settled), a debt can also be added by hand without a purchase, and each customer has a total debt report. Profit is still counted when the sale is made, not when it is paid. "فروش سریع" is the one-tap sale, always paid in full.
- **History:** every sale, newest first, with the customer name and a button to read the sale's note. A sale or restock done by mistake can be undone right away (toast) or deleted from the history later; removing an item keeps its sales.
- **Reports:** daily / weekly (Saturday start) / monthly (Jalali) sales, production cost, profit, margin, top items, plus all-time totals.

## How it works

Every change (add item, restock, sale, edit) is an event appended to a local log (saved in the browser's
`localStorage`). Stock, sales and profit are derived by replaying the merged log of all
devices (`src/lib/reduce.js`), so offline edits from several phones always add up.

Sync talks to the GitHub Contents API directly from the browser:

- **Push:** each device appends only to its own file `events/YYYY-MM/<deviceId>.jsonl` in the data repo, so devices never conflict. Pushes are **debounced**: once you stop changing things for 5 seconds, everything pending goes out in one push (one commit, not one per click). The sync button pushes immediately.
- **Pull:** every device reads all files and merges them (deduped by event id), every 60 seconds, when the app is shown or hidden, on regaining network, and with the sync button.

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
- Title/price/cost edits use last-write-wins by timestamp, so a badly wrong phone clock can win.
- The data repo must be private; the setup screen refuses a public one.
- Clearing a phone's site data loses its unsynced events and gives it a new device id.
- `localStorage` (~5MB) holds the log; move to IndexedDB if a shop outgrows it.
