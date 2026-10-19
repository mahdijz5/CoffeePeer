import { useStore } from '../store/index.js'
import { useSync, getConfig, sync } from '../services/githubSync.js'

const COLORS = { idle: '#22c55e', syncing: '#eab308', error: '#ef4444' }

export default function SyncStatus() {
  const { status, lastSynced, error } = useSync()
  const pending = useStore((s) => {
    const done = new Set(s.pushed)
    const me = getConfig()?.deviceId
    return s.logs.filter((e) => e.device === me && !done.has(e.id)).length
  })

  const label =
    status === 'syncing' ? 'Syncing...'
    : status === 'error' ? `Sync failed: ${error}`
    : lastSynced ? `Synced ${new Date(lastSynced).toLocaleTimeString()}`
    : 'Not synced yet'

  return (
    <header>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[status] }} />
        <span>{label}{pending > 0 && ` · ${pending} pending`}</span>
        <button onClick={sync} disabled={status === 'syncing'}>Sync now</button>
      </div>
    </header>
  )
}
