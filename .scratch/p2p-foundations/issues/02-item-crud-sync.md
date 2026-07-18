# 02 — Item CRUD: add/view/update items across peers

**What to build:** A user can create, view, and edit items (id, title, price) through the UI. Each mutation appends an event to the OrbitDB event log. When a second peer is connected, item changes sync across peers.

**Blocked by:** 01 — P2P foundation

- [ ] Define Item types (id, title, price) and event shape (addItem, updateItem)
- [ ] Build ItemReducer that derives current item list from the event log
- [ ] Build ItemList component displaying all items with price
- [ ] Build ItemForm component for adding and editing items
- [ ] Wire events to the event store (addItem appends {op: 'addItem', data: {id, title, price}})
- [ ] Verify second peer sees newly created items without manual refresh
- [ ] Verify second peer sees updated items when edited on the first peer
