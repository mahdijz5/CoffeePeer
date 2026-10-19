import { useEffect, useState } from 'react'
import SyncStatus from './components/SyncStatus'
import ItemList from './components/ItemList'
import ItemForm from './components/ItemForm'
import Setup from './components/Setup'
import { getConfig, startSync } from './services/githubSync'

function App() {
  const [showForm, setShowForm] = useState(false)
  const [configured, setConfigured] = useState(() => !!getConfig())

  useEffect(() => (configured ? startSync() : undefined), [configured])

  if (!configured) return <main><h1>CoffeePeer</h1><Setup onDone={() => setConfigured(true)} /></main>

  return (
    <main>
      <SyncStatus />
      <h1>CoffeePeer</h1>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Hide Form' : 'Add Item'}
      </button>
      {showForm && <ItemForm onClose={() => setShowForm(false)} />}
      <ItemList />
    </main>
  )
}

export default App
