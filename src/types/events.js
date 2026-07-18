// P2P event operations — the only messages sent over libp2p pubsub
const Events = {
  ITEM_CREATED: 'item.created',
  ITEM_UPDATED: 'item.updated',
  ITEM_SOLD: 'item.sold',
}

/**
 * @typedef {{ id: string, title: string, price: number, stock: number }} Item
 * @typedef {{ op: string, data: object[], timestamp: number }} P2PMessage
 */

/** @param {{ id: string, title: string, price: number }} item */
function makeCreatedEvent(item) {
  return {
    op: Events.ITEM_CREATED,
    data: [item],
    timestamp: Date.now(),
  }
}

/** @param {{ id: string, title?: string, price?: number, stock?: number }} updates */
function makeUpdatedEvent(updates) {
  return {
    op: Events.ITEM_UPDATED,
    data: [updates],
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

export { Events, makeCreatedEvent, makeUpdatedEvent, makeSoldEvent }
