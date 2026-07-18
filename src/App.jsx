import { useEffect, useState } from 'react'
import PeerStatus from './components/PeerStatus'
import ItemList from './components/ItemList'
import ItemForm from './components/ItemForm'
import { PubSubService } from './services/pubsub'
import { EventStore } from './services/eventStore'

function App() {
  const [_showForm, setShowForm] = useState(false)

  useEffect(() => {
    PubSubService.init()
    EventStore.onEvent((event) => {
      // Incoming event from another peer — apply to store
      // The store's processEvent is called inside EventStore.append,
      // so we just need to call it here for remote events
      import('./store/index.js').then(({ useStore }) => {
        useStore.getState().processEvent(event)
      })
    })
  }, [])

  return (
    <main>
      <PeerStatus />
      <h1>CoffeePeer</h1>
      <button onClick={() => setShowForm(!showForm)}>
        {_showForm ? 'Hide Form' : 'Add Item'}
      </button>
      {_showForm && <ItemForm onClose={() => setShowForm(false)} />}
      <ItemList />
    </main>
  )
}

export default App
