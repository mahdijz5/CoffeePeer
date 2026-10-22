import { makeCreatedEvent, makeUpdatedEvent, makeRestockedEvent, makeSoldEvent, makeRemovedEvent, makeVoidedEvent, makeCustomerRenamedEvent, makeCustomerRemovedEvent, makeDebtAddedEvent, makeDebtPaidEvent, generateId } from '../types/events.js'
import { useStore } from '../store/index.js'
import { getConfig, queueSync } from './githubSync.js'

/**
 * EventStore stamps new events, appends them to the local log (Zustand,
 * persisted) and queues a batched GitHub sync. Always succeeds locally.
 */
export const EventStore = {
  /** @param {{ op: string, data: any, timestamp: number }} event */
  /** @returns {string} the new event's id */
  append(event) {
    const id = generateId()
    useStore.getState().addEvents([{ ...event, id, device: getConfig()?.deviceId }])
    queueSync() // batched push; failures show in the sync status and the event stays pending
    return id
  },

  addItem(item) {
    this.append(makeCreatedEvent(item))
  },

  updateItem(updates) {
    this.append(makeUpdatedEvent(updates))
  },

  /** Add stock the shop made. @returns {string} the event's id (for voidEntry) */
  restockItem(itemId, quantity = 1) {
    return this.append(makeRestockedEvent({ itemId, quantity }))
  },

  /**
   * Records the item's price and cost as they are right now.
   * @param {{ customer?: string, note?: string, paid?: number }} [extra] detailed-sell fields, stored only when non-empty;
   *   `paid` only when below the total (the unpaid rest becomes the customer's debt)
   * @returns {string | undefined} the sale's id (for voidEntry)
   */
  sellItem(itemId, quantity = 1, { customer = '', note = '', paid } = {}) {
    const item = useStore.getState().items[itemId]
    if (!item) return
    const c = customer.trim()
    const nt = note.trim()
    const owes = paid !== undefined && paid < quantity * item.price && c // a debt needs a customer
    return this.append(makeSoldEvent({ itemId, quantity, price: item.price, cost: item.cost, ...(c && { customer: c }), ...(nt && { note: nt }), ...(owes && { paid: Math.max(0, paid) }) }))
  },

  /** Hide the item from stock; its sales stay in history and reports. */
  removeItem(id) {
    this.append(makeRemovedEvent({ id }))
  },

  /** A debt without a purchase. @returns {string} its id */
  addDebt({ customer, amount, note = '' }) {
    const nt = note.trim()
    return this.append(makeDebtAddedEvent({ customer: customer.trim(), amount, ...(nt && { note: nt }) }))
  },

  /** A (part-)payment of a debt. @returns {string} the payment's id (for voidEntry) */
  payDebt(debtId, amount, note = '') {
    const nt = note.trim()
    return this.append(makeDebtPaidEvent({ debtId, amount, ...(nt && { note: nt }) }))
  },

  /** Rename a customer everywhere in the history; an existing name merges the two customers. */
  renameCustomer(from, to) {
    this.append(makeCustomerRenamedEvent({ from, to: to.trim() }))
  },

  /** Remove a customer from the list; their sales stay in history and reports, just without the name. */
  removeCustomer(name) {
    this.append(makeCustomerRemovedEvent({ name }))
  },

  /** Cancel a sale or a restock (by its event id): it disappears from history and reports, stock is recomputed. */
  voidEntry(id) {
    this.append(makeVoidedEvent({ id }))
  },
}
