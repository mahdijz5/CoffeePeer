import { useState, useEffect } from 'react'
import { PubSubService } from '../services/pubsub.js'

export default function PeerStatus() {
  const [peers, setPeers] = useState(0)
  const [status, setStatus] = useState('connecting')

  useEffect(() => {
    const unsubStatus = PubSubService.on('status', (s) => {
      setStatus(s)
    })
    setPeers(PubSubService.peerCount)
    setStatus(PubSubService.status)

    return () => {
      unsubStatus()
    }
  }, [])

  const statusColor =
    status === 'connected'
      ? '#22c55e'
      : status === 'connecting'
      ? '#eab308'
      : '#ef4444'

  const label =
    status === 'connected'
      ? `Connected · ${peers} peer${peers !== 1 ? 's' : ''} online`
      : status === 'connecting'
      ? 'Connecting...'
      : 'Disconnected'

  return (
    <header>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: statusColor,
          }}
        />
        <span>{label}</span>
      </div>
    </header>
  )
}
