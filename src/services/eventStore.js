import { makeCreatedEvent, makeUpdatedEvent, makeRestockedEvent, makeSoldEvent, generateId } from '../types/events.js'
import { useStore } from '../store/index.js'
import { getConfig, sync } from './githubSync.js'

/**
 * EventStore stamps new events, appends them to the local log (Zustand,
 * persisted) and kicks off a GitHub sync. Always succeeds locally.
 */
export const EventStore = {
  /** @param {{ op: string, data: any, timestamp: number }} event */
  append(event) {
    useStore.getState().addEvents([{ ...event, id: generateId(), device: getConfig()?.deviceId }])
    sync() // fire and forget: failures show in the sync status, event stays pending
  },

  addItem(item) {
    this.append(makeCreatedEvent(item))
  },

  updateItem(updates) {
    this.append(makeUpdatedEvent(updates))
  },

  restockItem(itemId, quantity = 1) {
    this.append(makeRestockedEvent({ itemId, quantity }))
  },

  sellItem(itemId, quantity = 1) {
    this.append(makeSoldEvent({ itemId, quantity }))
  },
}
