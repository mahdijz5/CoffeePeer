import { useState } from 'react'
import { saveConfig, getConfig } from '../services/githubSync.js'
import Logo from './Logo.jsx'

/** Connect screen: where the private data repo is and the token to access it. */
export default function Setup({ onDone, onCancel }) {
  const [repo, setRepo] = useState(() => getConfig()?.repo || '')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await saveConfig({ repo: repo.trim(), token: token.trim() })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="setup-wrap">
      <form className="setup" onSubmit={handleSave}>
        <Logo size={64} />
        <h1>کافی‌پیر</h1>
        <p>یک مخزن <b>خصوصی</b> GitHub و یک توکن Fine-grained (دسترسی Contents: خواندن و نوشتن، فقط روی همان مخزن) وصل کنید.</p>
        <input dir="ltr" placeholder="owner/CoffeePeer-data" value={repo} onChange={(e) => setRepo(e.target.value)} autoCapitalize="none" autoCorrect="off" />
        <input dir="ltr" type="password" placeholder="GitHub token" value={token} onChange={(e) => setToken(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy || !repo || !token}>{busy ? 'در حال بررسی…' : 'اتصال'}</button>
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>انصراف</button>}
      </form>
    </div>
  )
}
