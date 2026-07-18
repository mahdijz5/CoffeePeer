import { create } from 'zustand'

/**
 * Zustand store: single source of truth for all item state.
 * The reducer processes domain events and applies them locally.
 * PubSub delivers events from peers into processEvent.
 */
export const useStore = create((set, get) => ({
  items: {},       // { [id]: { id, title, price, stock } }
  logs: [],        // [event, event, ...] — append-only log

  setItems(items) {
    set({ items })
  },

  setLogs(logs) {
    set({ logs })
  },

  addItem(item) {
    set((state) => ({
      items: { ...state.items, [item.id]: item },
    }))
  },

  processEvent(event) {
    const { data } = event
    // data is always an array — take first element
    const payload = data[0] || {}

    switch (event.op) {
      case 'item.created': {
        const item = {
          id: payload.id || String(Date.now()),
          title: payload.title || 'Unnamed',
          price: Number(payload.price) || 0,
          stock: 0,
        }
        set((state) => ({
          items: { ...state.items, [item.id]: item },
        }))
        break
      }

      case 'item.updated': {
        set((state) => {
          const existing = state.items[payload.id]
          if (!existing) return state
          return {
            items: {
              ...state.items,
              [payload.id]: { ...existing, ...payload },
            },
          }
        })
        break
      }

      case 'item.sold': {
        set((state) => {
          const existing = state.items[payload.itemId]
          if (!existing) return state
          const newStock = Math.max(0, existing.stock - payload.quantity)
          return {
            items: {
              ...state.items,
              [payload.itemId]: { ...existing, stock: newStock },
            },
          }
        })
        break
      }
    }
  },

  getItem(id) {
    return get().items[id]
  },
}))
