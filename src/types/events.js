// Domain events — appended to the local log and synced through the GitHub data repo
const Events = {
  ITEM_CREATED: 'item.created',
  ITEM_UPDATED: 'item.updated',
  ITEM_RESTOCKED: 'item.restocked',
  ITEM_SOLD: 'item.sold',
}

// random UUID: unique across devices and sessions
function generateId() {
  return crypto.randomUUID()
}

/**
 * @typedef {{ id: string, title: string, price: number, stock: number }} Item
 * @typedef {{ id: string, device: string, op: string, data: object[], timestamp: number }} DomainEvent
 */

/** @param {{ id?: string, title: string, price: number, stock?: number }} item */
function makeCreatedEvent(item) {
  return {
    op: Events.ITEM_CREATED,
    data: [{ id: item.id || generateId(), title: item.title, price: item.price, stock: item.stock || 0 }],
    timestamp: Date.now(),
  }
}

/** @param {{ id: string, title?: string, price?: number }} updates */
function makeUpdatedEvent(updates) {
  return {
    op: Events.ITEM_UPDATED,
    data: [updates],
    timestamp: Date.now(),
  }
}

/** @param {{ itemId: string, quantity: number }} payload */
function makeRestockedEvent(payload) {
  return {
    op: Events.ITEM_RESTOCKED,
    data: [payload],
    timestamp: Date.now(),
  }
}

/** @param {{ itemId: string, quantity: number }} payload */
function makeSoldEvent(payload) {
  return {
    op: Events.ITEM_SOLD,
    data: [payload],
    timestamp: Date.now(),
  }
}

export { Events, generateId, makeCreatedEvent, makeUpdatedEvent, makeRestockedEvent, makeSoldEvent }
