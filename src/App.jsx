import { useEffect, useState } from 'react'
import SyncStatus from './components/SyncStatus'
import ItemList from './components/ItemList'
import ItemForm from './components/ItemForm'
import Setup from './components/Setup'
import { getConfig, startSync } from './services/githubSync'

function App() {
  const [showForm, setShowForm] = useState(false)
  const [configured, setConfigured] = useState(() => !!getConfig())
  const [editing, setEditing] = useState(false) // reopen Setup to change repo/token

  useEffect(() => (configured && !editing ? startSync() : undefined), [configured, editing])

  return (
    <>
      <div className="bg" aria-hidden="true"><i /><i /><i /></div>
      {!configured || editing ? (
        <Setup
          onDone={() => { setConfigured(true); setEditing(false) }}
          onCancel={configured ? () => setEditing(false) : undefined}
        />
      ) : (
        <main className="app">
          <SyncStatus onSettings={() => setEditing(true)} />
          <ItemList onAdd={() => setShowForm(true)} />
          <button className="fab" onClick={() => setShowForm(true)} aria-label="Add item">+</button>
          {showForm && <ItemForm onClose={() => setShowForm(false)} />}
        </main>
      )}
    </>
  )
}

export default App
