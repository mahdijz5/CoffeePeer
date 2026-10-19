// node scripts/selfcheck.mjs — checks the merge/replay logic every device relies on
import assert from 'node:assert/strict'
import { replay } from '../src/lib/reduce.js'

const ev = (id, device, timestamp, op, payload) => ({ id, device, timestamp, op, data: [payload] })
const created = ev('e1', 'A', 1, 'item.created', { id: 'latte', title: 'Latte', price: 4, stock: 5 })

// two devices work offline, then merge: deltas add up regardless of arrival order
const a = [created, ev('e2', 'A', 10, 'item.sold', { itemId: 'latte', quantity: 2 }), ev('e3', 'A', 30, 'item.restocked', { itemId: 'latte', quantity: 10 })]
const b = [ev('e4', 'B', 20, 'item.sold', { itemId: 'latte', quantity: 1 })]
assert.equal(replay([...a, ...b]).latte.stock, 5 - 2 - 1 + 10)
assert.deepEqual(replay([...b, ...a]), replay([...a, ...b]))

// duplicate event ids (same event pulled twice) count once
assert.equal(replay([...a, ...a, ...b, ...b]).latte.stock, 12)

// overselling while offline goes negative instead of being dropped
const oversold = [created, ev('s1', 'A', 2, 'item.sold', { itemId: 'latte', quantity: 4 }), ev('s2', 'B', 3, 'item.sold', { itemId: 'latte', quantity: 4 })]
assert.equal(replay(oversold).latte.stock, -3)

// price: last write wins, ties broken by device id
const prices = [created, ev('p1', 'A', 5, 'item.updated', { id: 'latte', price: 5 }), ev('p2', 'B', 6, 'item.updated', { id: 'latte', price: 6 })]
assert.equal(replay(prices).latte.price, 6)

// events for unknown items are ignored, not crashes
assert.deepEqual(replay([ev('x', 'A', 1, 'item.sold', { itemId: 'ghost', quantity: 1 })]), {})

// icon: set on create, replaced by update; items without one get ''
const withIcon = [ev('i1', 'A', 1, 'item.created', { id: 'mocha', title: 'Mocha', price: 5, stock: 1, icon: 'data:a' }), ev('i2', 'B', 2, 'item.updated', { id: 'mocha', icon: 'data:b' })]
assert.equal(replay(withIcon).mocha.icon, 'data:b')
assert.equal(replay([created]).latte.icon, '')

console.log('selfcheck ok')
