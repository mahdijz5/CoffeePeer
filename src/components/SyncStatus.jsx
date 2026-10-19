import { useStore } from '../store/index.js'
import { useSync, getConfig, sync } from '../services/githubSync.js'
import Logo from './Logo.jsx'

export default function SyncStatus({ onSettings }) {
  const { status, lastSynced, error } = useSync()
  const pending = useStore((s) => {
    const done = new Set(s.pushed)
    const me = getConfig()?.deviceId
    return s.logs.filter((e) => e.device === me && !done.has(e.id)).length
  })

  const label =
    status === 'syncing' ? 'Syncing…'
    : status === 'error' ? `Sync failed: ${error}`
    : lastSynced ? `Synced ${new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Not synced yet'
  const text = `${label}${pending > 0 ? ` · ${pending} pending` : ''}`

  return (
    <header className="topbar">
      <div className="brand">
        <Logo />
        <h1>CoffeePeer</h1>
      </div>
      <div className="pill" data-status={status} title={text}>
        <span className="dot" />
        <span className="pill-text">{text}</span>
        <button className={`icon-btn ${status === 'syncing' ? 'spin' : ''}`} onClick={sync} disabled={status === 'syncing'} title="Sync now" aria-label="Sync now">⟳</button>
        <button className="icon-btn" onClick={onSettings} title="Settings" aria-label="Settings">⚙</button>
      </div>
    </header>
  )
}
