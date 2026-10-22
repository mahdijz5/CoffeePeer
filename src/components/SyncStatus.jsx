import { useStore } from '../store/index.js'
import { useSync, getConfig, sync } from '../services/githubSync.js'
import { fmtNum, fmtTime } from '../lib/format.js'
import Logo from './Logo.jsx'

export default function SyncStatus({ onSettings }) {
  const { status, lastSynced, error } = useSync()
  const pending = useStore((s) => {
    const done = new Set(s.pushed)
    const me = getConfig()?.deviceId
    return s.logs.filter((e) => e.device === me && !done.has(e.id)).length
  })

  const label =
    status === 'syncing' ? 'در حال همگام‌سازی…'
    : status === 'error' ? `همگام‌سازی ناموفق: ${error}`
    : lastSynced ? `همگام شد ${fmtTime(lastSynced)}`
    : 'هنوز همگام نشده'
  const text = `${label}${pending > 0 ? ` · ${fmtNum(pending)} در انتظار` : ''}`

  return (
    <header className="topbar">
      <div className="brand">
        <Logo />
        <h1>کافی‌پیر</h1>
      </div>
      <div className="pill" data-status={status} title={text}>
        <span className="dot" />
        <span className="pill-text">{text}</span>
        <button className={`icon-btn ${status === 'syncing' ? 'spin' : ''}`} onClick={sync} disabled={status === 'syncing'} title="همگام‌سازی اکنون" aria-label="همگام‌سازی اکنون">⟳</button>
        <button className="icon-btn" onClick={onSettings} title="تنظیمات" aria-label="تنظیمات">⚙</button>
      </div>
    </header>
  )
}
