/** @file P2P pubsub service — wraps libp2p pubsub for event broadcasting */
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { gossipsub } from '@libp2p/gossipsub'
import { bootstrap } from '@libp2p/bootstrap'

const PUBSUB_TOPIC = '/coffepeer/v1/event'

const BOOTSTRAP_NODES = [
  '/ip4/134.209.44.100/tcp/4001/p2p/12D3KooQKnNRYq2r9DFnCXdKjGgAwp3chLnV8EPBGo5QD3G5Go3S',
  '/ip4/68.183.168.219/tcp/4001/p2p/12D3KooWCsKfMJn4MJU3q1ZPnBwzoLXj1HQN7R7vLdVjZj3FJm3s',
]

let status_ = 'connecting'
let peerCount_ = 0
const listeners = new Map()
let node = null

export const PubSubService = {
  status: /** @type {'connecting' | 'connected' | 'disconnected'} */ ('connecting'),
  peerCount: 0,

  async init() {
    if (node) return
    const libp2pNode = await createLibp2p({
      transports: [tcp()],
      connectionMultiplexers: [mplex()],
      peerDiscovery: [bootstrap({ list: BOOTSTRAP_NODES })],
      services: {
        pubsub: gossipsub({ warnOnLargeMessage: true }),
      },
    })
    await libp2pNode.start()
    await libp2pNode.services.pubsub.subscribe(PUBSUB_TOPIC)

    const onMsg = (evt) => {
      const { source, data } = evt
      if (source.equals(libp2pNode.peerId)) return
      try {
        const msg = JSON.parse(new TextDecoder().decode(data))
        listeners.get('events')?.forEach(cb => cb(msg))
      } catch { /* skip bad messages */ }
    }
    libp2pNode.services.pubsub.addEventListener('message', onMsg)

    libp2pNode.addEventListener('peer:connect', () => {
      peerCount_ = libp2pNode.services.peerStore.size
      status_ = 'connected'
      this.status = 'connected'
      this.peerCount = peerCount_
      listeners.get('status')?.forEach(cb => cb('connected', peerCount_))
    })

    libp2pNode.addEventListener('peer:disconnect', () => {
      peerCount_ = libp2pNode.services.peerStore.size
      if (peerCount_ === 0) status_ = 'disconnected'
      this.status = status_
      this.peerCount = peerCount_
      listeners.get('status')?.forEach(cb => cb(peerCount_ === 0 ? 'disconnected' : 'connected', peerCount_))
    })

    node = libp2pNode
    for (const addr of BOOTSTRAP_NODES) {
      try { await libp2pNode.dial(addr) } catch { /* best-effort */ }
    }
    status_ = 'connected'
    this.status = 'connected'
    this.peerCount = peerCount_
  },

  async destroy() {
    if (!node) return
    await node.stop()
    node = null
    status_ = 'disconnected'
    this.status = 'disconnected'
    this.peerCount = 0
  },

  async broadcast(msg) {
    if (!node?.services.pubsub) return
    const data = new TextEncoder().encode(JSON.stringify(msg))
    try { await node.services.pubsub.publish(PUBSUB_TOPIC, data) } catch { /* non-blocking */ }
  },

  on(type, fn) {
    if (!listeners.has(type)) listeners.set(type, new Set())
    listeners.get(type).add(fn)
    return () => { listeners.get(type)?.delete(fn) }
  },
}
