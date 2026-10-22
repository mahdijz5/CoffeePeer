/**
 * Sync through a private GitHub data repo. Each device appends only to its own
 * file events/YYYY-MM/<deviceId>.jsonl, so devices never conflict; pull merges
 * every file into the local log (deduped by event id in the store).
 */
import { create } from 'zustand'
import { useStore } from '../store/index.js'

const API = 'https://api.github.com'
const CFG_KEY = 'coffeepeer-config'
const SHA_KEY = 'coffeepeer-shas'
const INTERVAL_MS = 60_000 // pull (and push leftovers) this often
const PUSH_QUIET_MS = 5_000 // push once the user has made no change for this long

/** UI-facing sync state */
export const useSync = create(() => ({ status: 'idle', lastSynced: null, error: null }))

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

/** @returns {{ repo: string, token: string, deviceId: string } | null} */
export const getConfig = () => read(CFG_KEY, null)

// GETs carry a throwaway query param to dodge the browser's 60s cache of API responses.
// Not `cache: 'no-store'`: that adds Cache-Control/Pragma headers, which GitHub's CORS preflight rejects.
const gh = (path, { method = 'GET', body, raw = false } = {}) =>
  fetch(`${API}/repos/${getConfig().repo}${path}${method === 'GET' ? `?_=${Date.now()}` : ''}`, {
    method,
    body: body && JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${getConfig().token}`,
      Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
    },
  })

/** Validate repo + token, then store them. Keeps the deviceId across re-setup. */
export async function saveConfig({ repo, token }) {
  repo = repo.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, '') // accept pasted URLs
  const res = await fetch(`${API}/repos/${repo}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`GitHub ${res.status}: نام مخزن و توکن را بررسی کنید`)
  if (!(await res.json()).private) throw new Error('این مخزن عمومی است و همه می‌توانند داده‌های فروش را ببینند. از یک مخزن خصوصی استفاده کنید.')
  const prev = getConfig()
  if (prev?.repo !== repo) {
    // new data repo: re-push own events there and forget the old repo's file shas
    useStore.setState({ pushed: [] })
    localStorage.removeItem(SHA_KEY)
  }
  localStorage.setItem(CFG_KEY, JSON.stringify({ repo, token, deviceId: prev?.deviceId || crypto.randomUUID() }))
}

const b64dec = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, '')), (c) => c.charCodeAt(0)))
const b64enc = (s) => btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(''))

const monthOf = (e) => new Date(e.timestamp).toISOString().slice(0, 7)

const parseLines = (text) =>
  text.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)] } catch { return [] } })

async function pushMonth(path, events) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const cur = await gh(`/contents/${path}`)
    if (cur.status !== 404 && !cur.ok) throw new Error(`GitHub ${cur.status} هنگام خواندن ${path}`)
    const file = cur.ok ? await cur.json() : null
    let text = file?.content ? b64dec(file.content) : ''
    if (file && !text && file.size) {
      // Contents API omits inline content above 1MB (icons make big files likelier): read it raw
      const raw = await gh(`/contents/${path}`, { raw: true })
      if (!raw.ok) throw new Error(`GitHub ${raw.status} هنگام خواندن ${path}`)
      text = await raw.text()
    }
    const have = new Set(parseLines(text).map((e) => e.id))
    const add = events.filter((e) => !have.has(e.id))
    if (add.length) {
      const next = text + add.map((e) => JSON.stringify(e) + '\n').join('')
      const res = await gh(`/contents/${path}`, {
        method: 'PUT',
        body: { message: `events ${path}`, content: b64enc(next), sha: file?.sha },
      })
      if (res.status === 409 || res.status === 422) continue // stale sha, re-read and retry
      if (!res.ok) throw new Error(`GitHub ${res.status} هنگام نوشتن ${path}`)
    }
    return
  }
  throw new Error(`نوشتن ${path} پس از ۳ تلاش ناموفق بود`)
}

async function push() {
  const { deviceId } = getConfig()
  const { logs, pushed, markPushed } = useStore.getState()
  const done = new Set(pushed)
  const byMonth = {}
  for (const e of logs) {
    if (e.device === deviceId && !done.has(e.id)) (byMonth[monthOf(e)] ??= []).push(e)
  }
  for (const [month, events] of Object.entries(byMonth)) {
    await pushMonth(`events/${month}/${deviceId}.jsonl`, events)
    markPushed(events.map((e) => e.id))
  }
}

async function list(path) {
  const res = await gh(`/contents/${path}`)
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`GitHub ${res.status} هنگام خواندن فهرست ${path}`)
  return res.json()
}

async function pull() {
  const shas = read(SHA_KEY, {})
  for (const dir of (await list('events')).filter((d) => d.type === 'dir')) {
    for (const f of await list(dir.path)) {
      if (shas[f.path] === f.sha) continue // unchanged since last pull
      const res = await gh(`/contents/${f.path}`, { raw: true })
      if (!res.ok) throw new Error(`GitHub ${res.status} هنگام خواندن ${f.path}`)
      useStore.getState().addEvents(parseLines(await res.text()))
      shas[f.path] = f.sha
      localStorage.setItem(SHA_KEY, JSON.stringify(shas))
    }
  }
}

let running = null
let again = false
let pushTimer = null

/**
 * Called after every local change. Debounced: each change restarts the wait, so a burst of
 * edits becomes one push (one commit) PUSH_QUIET_MS after the last one.
 * ponytail: constant editing postpones the push; the 60s timer in startSync still pushes pending events.
 */
export function queueSync() {
  if (!getConfig()) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => { pushTimer = null; sync() }, PUSH_QUIET_MS)
}

/** Push own events, then pull everyone's. Calls during a run schedule one more run. */
export function sync() {
  if (!getConfig()) return
  clearTimeout(pushTimer) // a queued push is covered by this run
  pushTimer = null
  if (running) { again = true; return running }
  useSync.setState({ status: 'syncing' })
  running = (async () => {
    try {
      await push()
      await pull()
      useSync.setState({ status: 'idle', lastSynced: Date.now(), error: null })
    } catch (e) {
      const error = e instanceof TypeError ? 'اتصال به GitHub برقرار نشد (اینترنت یا VPN را بررسی کنید)' : e.message
      useSync.setState({ status: 'error', error })
    } finally {
      running = null
      if (again) { again = false; sync() }
    }
  })()
  return running
}

/** Sync now, then every minute and whenever the app is hidden/shown or regains network. Returns a stop fn. */
export function startSync() {
  const onVisible = () => sync() // hidden: flush pending changes before the phone suspends the page; visible: catch up
  sync()
  const timer = setInterval(sync, INTERVAL_MS)
  window.addEventListener('online', sync)
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    clearInterval(timer)
    window.removeEventListener('online', sync)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
