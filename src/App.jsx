import { useEffect, useState } from 'react'
import SyncStatus from './components/SyncStatus'
import ItemList from './components/ItemList'
import ItemForm from './components/ItemForm'
import History from './components/History'
import Reports from './components/Reports'
import Customers from './components/Customers'
import Debts from './components/Debts'
import Setup from './components/Setup'
import { getConfig, startSync } from './services/githubSync'

const TABS = [['stock', '📦', 'موجودی'], ['history', '🧾', 'تاریخچه'], ['customers', '👥', 'مشتریان'], ['debts', '💳', 'بدهی‌ها'], ['reports', '📊', 'گزارش‌ها']]

function App() {
  const [tab, setTab] = useState('stock')
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
          <div key={tab} className="view">
            {tab === 'stock' && <ItemList onAdd={() => setShowForm(true)} />}
            {tab === 'history' && <History />}
            {tab === 'customers' && <Customers />}
            {tab === 'debts' && <Debts />}
            {tab === 'reports' && <Reports />}
          </div>
          {tab === 'stock' && <button className="fab" onClick={() => setShowForm(true)} aria-label="افزودن کالا">+</button>}
          {showForm && <ItemForm onClose={() => setShowForm(false)} />}
          <nav className="tabs">
            <div className="tabs-in" role="tablist">
              {TABS.map(([k, icon, label]) => (
                <button key={k} className="tab" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                  <span aria-hidden="true">{icon}</span><span className="tab-label">{label}</span>
                </button>
              ))}
            </div>
          </nav>
        </main>
      )}
    </>
  )
}

export default App
