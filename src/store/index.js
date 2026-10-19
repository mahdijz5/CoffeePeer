import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { replay } from '../lib/reduce.js'

/**
 * Zustand store. `logs` (persisted) is the source of truth; `items` is derived
 * from it by replay. `pushed` = ids of own events already written to GitHub.
 */
export const useStore = create(
  persist(
    (set) => ({
      items: {},   // { [id]: { id, title, price, stock } }
      logs: [],    // every known event, local and pulled
      pushed: [],  // ids of own events already in the data repo

      // ponytail: full replay per change, fine for shop volume; memoise/snapshot if logs get huge.
      addEvents(events) {
        set((state) => {
          const known = new Set(state.logs.map((e) => e.id))
          const fresh = events.filter((e) => !known.has(e.id))
          if (!fresh.length) return state
          const logs = [...state.logs, ...fresh]
          return { logs, items: replay(logs) }
        })
      },

      markPushed(ids) {
        set((state) => ({ pushed: [...state.pushed, ...ids] }))
      },
    }),
    {
      name: 'coffeepeer-store',
      partialize: ({ logs, pushed }) => ({ logs, pushed }),
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        items: replay(persisted?.logs || []),
      }),
    },
  ),
)
