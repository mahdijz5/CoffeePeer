import { useState } from 'react'
import { saveConfig } from '../services/githubSync.js'

/** First-launch screen: where the data repo is and the token to access it. */
export default function Setup({ onDone }) {
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSave = async () => {
    setBusy(true)
    setError('')
    try {
      await saveConfig({ repo: repo.trim(), token: token.trim() })
      onDone()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="item-form">
      <h2>Connect data repo</h2>
      <p>Private GitHub repo + fine-grained token with Contents read/write on that repo only.</p>
      <input placeholder="owner/CoffeePeer-data" value={repo} onChange={(e) => setRepo(e.target.value)} />
      <input type="password" placeholder="GitHub token" value={token} onChange={(e) => setToken(e.target.value)} />
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      <button onClick={handleSave} disabled={busy || !repo || !token}>{busy ? 'Checking...' : 'Connect'}</button>
    </section>
  )
}
