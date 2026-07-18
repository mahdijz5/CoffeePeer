import { PubSubService } from './pubsub.js'
import { makeCreatedEvent, makeUpdatedEvent, makeSoldEvent } from '../types/events.js'
import { useStore } from '../store/index.js'

/**
 * EventStore manages the append log and forwards new events to peers via PubSub.
 * It is stateless about data — items are kept in Zustand store.
 */
export const EventStore = {
  /**
   * Append an event to the local log and broadcast to swarm.
   * Always succeeds — no buffering, no rejection.
   * @param {{ op: string, data: any, timestamp: number }} event
   */
  async append(event) {
    // 1. Write to local log
    const newLogs = [event, ...logs]
    useStore.getState().setLogs(newLogs)

    // 2. Apply to local state
    useStore.getState().processEvent(event)

    // 3. Broadcast to peers (non-blocking — PubSub handles retries)
    PubSubService.broadcast(event)
  },

  async addItem(item) {
    await this.append(makeCreatedEvent(item))
  },

  async updateItem(updates) {
    await this.append(makeUpdatedEvent(updates))
  },

  async sellItem(itemId, quantity = 1) {
    await this.append(makeSoldEvent({ itemId, quantity }))
  },

  /**
   * Subscribe to incoming events (from PubSub, not own appends).
   * @param {(event: any) => void} cb
   */
  onEvent(cb) {
    PubSubService.on('events', cb)
  },
}
