# 03 — Sale flow: sell items and derive stock from events

**What to build:** A user can sell items through the UI by appending a `sellItem` event. The item reducer recalculates stock from the event log. Stock can go negative (no rejection). The sale propagates across peers.

**Blocked by:** 02 — Item CRUD

- [ ] Define sellItem event shape: {op: 'sellItem', data: {itemId, quantity, timestamp}}
- [ ] Extend ItemReducer to process sellItem events and update stock field
- [ ] Build SaleButton component on each item in the ItemList
- [ ] Wire SaleButton to append sellItem event to the event store
- [ ] Verify stock decrements in the UI after a sale
- [ ] Verify stock can go negative (no guard/rate limiting)
- [ ] Verify second peer sees the sale reflected in item stock within 1 second
