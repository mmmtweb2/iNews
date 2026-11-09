import test from 'node:test'
import assert from 'node:assert/strict'
import { loadSeen, saveSeen, snapshotSeen, summarizeChanges, onlyChanged, sanitizeSeen } from './seen.js'

const memory = () => {
  const data = new Map()
  return { getItem: key => (data.has(key) ? data.get(key) : null), setItem: (key, value) => data.set(key, value) }
}
const s = (id, updatedAt) => ({ id, updatedAt })

test('a first visit has no record, so nothing is labelled new', () => {
  assert.equal(loadSeen(memory()), null)
  assert.deepEqual(summarizeChanges([s('a', '2026-01-01')], null), { added: 0, updated: 0 })
  assert.equal(onlyChanged([s('a', '2026-01-01')], null).length, 1)
})

test('saving then loading round-trips, and broken storage is ignored', () => {
  const storage = memory()
  saveSeen([s('a', '2026-01-01T00:00:00Z'), s('b', '2026-01-02T00:00:00Z')], storage)
  const loaded = loadSeen(storage)
  assert.equal(loaded.get('a'), '2026-01-01T00:00:00Z')
  storage.setItem('inews.seen.v1', '{broken')
  assert.equal(loadSeen(storage), null)
  assert.equal(loadSeen({ getItem() { throw new Error('blocked') } }), null)
  assert.equal(sanitizeSeen([1, 2]), null)
  assert.equal(sanitizeSeen({ a: 5, b: 'x' }).size, 1)
})

test('an empty feed never wipes the record', () => {
  const storage = memory()
  saveSeen([s('a', '2026-01-01')], storage)
  saveSeen([], storage)
  assert.equal(loadSeen(storage).size, 1)
})

test('only the most recent stories are kept', () => {
  const many = Array.from({ length: 600 }, (_, i) => s(`s${i}`, new Date(2026, 0, 1, 0, i).toISOString()))
  const snapshot = snapshotSeen(many)
  assert.equal(snapshot.size, 500)
  assert.ok(snapshot.has('s599'))
  assert.ok(!snapshot.has('s0'))
})

test('changes are counted against what the reader last saw', () => {
  const seen = new Map([['a', '1'], ['b', '1']])
  const stories = [s('a', '1'), s('b', '2'), s('c', '1')]
  assert.deepEqual(summarizeChanges(stories, seen), { added: 1, updated: 1 })
  assert.deepEqual(onlyChanged(stories, seen).map(story => story.id), ['b', 'c'])
})
