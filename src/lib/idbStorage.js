/**
 * Minimal IndexedDB key-value storage for zustand's persist (async getItem/setItem/removeItem).
 * localStorage holds ~5MB, which icons-in-events fill up; IndexedDB doesn't. The first read after the
 * switch falls back to the old localStorage copy, and the first write moves it (then deletes the old key).
 * If IndexedDB is unavailable (some private modes) everything falls back to localStorage.
 */
const DB = 'coffeepeer'
const STORE = 'kv'

let dbPromise
const open = () =>
  (dbPromise ??= new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no indexedDB'))
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }))

const run = async (mode, fn) => {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = tx.onabort = () => reject(tx.error)
  })
}

const ls = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* quota: nothing more to do */ } },
  remove: (k) => { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}

export const idbStorage = {
  async getItem(name) {
    try {
      const value = await run('readonly', (s) => s.get(name))
      if (value !== undefined) return value
    } catch { /* fall through to localStorage */ }
    return ls.get(name)
  },
  async setItem(name, value) {
    try {
      await run('readwrite', (s) => s.put(value, name))
      ls.remove(name) // migrated
    } catch {
      ls.set(name, value)
    }
  },
  async removeItem(name) {
    try { await run('readwrite', (s) => s.delete(name)) } catch { /* ignore */ }
    ls.remove(name)
  },
}
