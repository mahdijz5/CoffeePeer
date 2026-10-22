// Domain events — appended to the local log and synced through the GitHub data repo
const Events = {
  ITEM_CREATED: 'item.created',
  ITEM_UPDATED: 'item.updated',
  ITEM_RESTOCKED: 'item.restocked',
  ITEM_SOLD: 'item.sold',
  ITEM_REMOVED: 'item.removed',
  HISTORY_VOIDED: 'history.voided',
  CUSTOMER_RENAMED: 'customer.renamed',
  CUSTOMER_REMOVED: 'customer.removed',
  DEBT_ADDED: 'debt.added',
  DEBT_PAID: 'debt.paid',
  EXPENSE_ADDED: 'expense.added',
}

// random UUID: unique across devices and sessions
function generateId() {
  return crypto.randomUUID()
}

/**
 * @typedef {{ id: string, title: string, price: number, stock: number, icon: string }} Item  icon = data URL or ''
 * @typedef {{ id: string, device: string, op: string, data: object[], timestamp: number }} DomainEvent
 */

/** @param {{ id?: string, title: string, price: number, cost?: number, stock?: number, icon?: string }} item */
function makeCreatedEvent(item) {
  return {
    op: Events.ITEM_CREATED,
    data: [{ id: item.id || generateId(), title: item.title, price: item.price, cost: item.cost || 0, stock: item.stock || 0, ...(item.icon && { icon: item.icon }) }],
    timestamp: Date.now(),
  }
}

/** @param {{ id: string, title?: string, price?: number, cost?: number, icon?: string }} updates */
function makeUpdatedEvent(updates) {
  return {
    op: Events.ITEM_UPDATED,
    data: [updates],
    timestamp: Date.now(),
  }
}

/** Stock made by the shop (no purchase, no cost: cost is an item field).
 * @param {{ itemId: string, quantity: number }} payload */
function makeRestockedEvent(payload) {
  return {
    op: Events.ITEM_RESTOCKED,
    data: [payload],
    timestamp: Date.now(),
  }
}

/** price/cost = the item's price and cost at the moment of sale (kept so history never changes).
 * customer/note are optional (detailed sell); a customer name adds that customer to the derived list.
 * paid = amount received at the sale; only stored when below the total, which opens a debt for the rest.
 * @param {{ itemId: string, quantity: number, price?: number, cost?: number, customer?: string, note?: string, paid?: number }} payload */
function makeSoldEvent(payload) {
  return {
    op: Events.ITEM_SOLD,
    data: [payload],
    timestamp: Date.now(),
  }
}

/** Soft delete: the item leaves the stock list, its history stays.
 * @param {{ id: string }} payload */
function makeRemovedEvent(payload) {
  return { op: Events.ITEM_REMOVED, data: [payload], timestamp: Date.now() }
}

/** Cancels a sale or restock: `id` is the id of that item.sold / item.restocked event.
 * @param {{ id: string }} payload */
function makeVoidedEvent(payload) {
  return { op: Events.HISTORY_VOIDED, data: [payload], timestamp: Date.now() }
}

/** Rename a customer on every sale made up to now; renaming to an existing name merges the two.
 * @param {{ from: string, to: string }} payload */
function makeCustomerRenamedEvent(payload) {
  return { op: Events.CUSTOMER_RENAMED, data: [payload], timestamp: Date.now() }
}

/** Drop a customer's name from the sales made up to now (the sales themselves stay).
 * @param {{ name: string }} payload */
function makeCustomerRemovedEvent(payload) {
  return { op: Events.CUSTOMER_REMOVED, data: [payload], timestamp: Date.now() }
}

/** A debt added by hand (no purchase). The event id is the debt's id.
 * @param {{ customer: string, amount: number, note?: string }} payload */
function makeDebtAddedEvent(payload) {
  return { op: Events.DEBT_ADDED, data: [payload], timestamp: Date.now() }
}

/** A payment against a debt (`debtId` = id of the item.sold or debt.added event that opened it).
 * @param {{ debtId: string, amount: number, note?: string }} payload */
function makeDebtPaidEvent(payload) {
  return { op: Events.DEBT_PAID, data: [payload], timestamp: Date.now() }
}

/** A general cost (salary, rent, bills...), not tied to an item. Voidable like a sale.
 * @param {{ title: string, amount: number, note?: string }} payload */
function makeExpenseAddedEvent(payload) {
  return { op: Events.EXPENSE_ADDED, data: [payload], timestamp: Date.now() }
}

export {
  Events, generateId, makeCreatedEvent, makeUpdatedEvent, makeRestockedEvent, makeSoldEvent, makeRemovedEvent, makeVoidedEvent,
  makeCustomerRenamedEvent, makeCustomerRemovedEvent, makeDebtAddedEvent, makeDebtPaidEvent, makeExpenseAddedEvent,
}
