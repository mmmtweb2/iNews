import test from 'node:test'
import assert from 'node:assert/strict'
import { tokenize, stem, sanitizeFollows, loadFollows, saveFollows, snapshotStory, matchFollows, unreadCount, markViewed, entryForFollowed, MAX_FOLLOWS } from './follow.js'

const T0 = Date.parse('2026-11-09T10:00:00Z')
const iso = minutes => new Date(T0 + minutes * 60_000).toISOString()

let counter = 0
function story(over = {}) {
  counter += 1
  return {
    id: `s${counter}`,
    headline: 'כותרת',
    oneLiner: '',
    entities: [],
    primaryTopic: 'economy',
    intensity: 1,
    importance: 3,
    firstSeenAt: iso(-60),
    updatedAt: iso(-60),
    publishedAt: iso(-60),
    sources: [{ url: 'https://example.com/a' }],
    ...over,
  }
}

const rate = story({ id: 'rate', headline: 'הבנק המרכזי השאיר את הריבית ללא שינוי', entities: ['ריבית', 'אינפלציה', 'משכנתאות'] })
const mark = snapshotStory(rate, T0)

test('tokenize drops short words and stop words, and stem forgives Hebrew prefixes and plurals', () => {
  assert.deepEqual(tokenize('הבנק של ישראל הודיע על הריבית'), ['הבנק', 'הריבית'])
  assert.equal(stem('הריבית'), 'ריבית')
  assert.equal(stem('מפלגות'), 'פלג')
  assert.equal(stem('אבן'), 'אבן')
})

test('stories that arrive later and share distinctive terms are related, with the shared terms listed', () => {
  const later = story({ headline: 'נתוני האינפלציה לחודש האחרון', entities: ['אינפלציה', 'ריבית', 'משכנתאות'], firstSeenAt: iso(30) })
  const unrelated = story({ headline: 'האצטדיון החדש נחנך', entities: ['אצטדיון'], firstSeenAt: iso(30) })
  const [match] = matchFollows([mark], [rate, later, unrelated])
  assert.deepEqual(match.related.map(item => item.story.id), [later.id])
  assert.ok(match.related[0].shared.length >= 2)
  assert.equal(match.related[0].isNew, true)
})

test('one shared word is not enough', () => {
  const weak = story({ headline: 'פרטיות בענן', entities: ['ריבית'], firstSeenAt: iso(30) })
  assert.equal(matchFollows([mark], [rate, weak])[0].related.length, 0)
})

test('stories that were already in the feed when the reader marked the story are not follow-ups', () => {
  const earlier = story({ entities: ['אינפלציה', 'ריבית', 'משכנתאות'], firstSeenAt: iso(-30) })
  assert.equal(matchFollows([mark], [rate, earlier])[0].related.length, 0)
})

test('a term found in many stories counts for little', () => {
  const generic = snapshotStory(story({ id: 'g', headline: 'ממשלה תדון בתקציב', entities: ['ממשלה', 'תקציב'] }), T0)
  const crowd = Array.from({ length: 10 }, () => story({ headline: 'ממשלה', entities: ['ממשלה'], firstSeenAt: iso(-90) }))
  const candidate = story({ headline: 'ממשלה ותקציב', entities: ['ממשלה', 'תקציב'], firstSeenAt: iso(30) })
  assert.equal(matchFollows([generic], [...crowd, candidate])[0].related.length, 0)
})

test('the same story updated after it was marked is flagged, and markViewed clears it', () => {
  const updated = { ...rate, updatedAt: iso(45), headline: 'הריבית ירדה' }
  const [match] = matchFollows([mark], [updated])
  assert.equal(match.updated, true)
  assert.equal(match.current.headline, 'הריבית ירדה')
  assert.equal(unreadCount([match]), 1)

  const viewed = markViewed([mark], [updated], T0 + 60 * 60_000)
  assert.equal(matchFollows(viewed, [updated])[0].updated, false)
  assert.equal(unreadCount(matchFollows(viewed, [updated])), 0)
})

test('a follow-up seen before the reader last looked is not counted as new', () => {
  const later = story({ entities: ['אינפלציה', 'ריבית', 'משכנתאות'], firstSeenAt: iso(30) })
  const viewed = markViewed([mark], [rate], T0 + 40 * 60_000)
  const [match] = matchFollows(viewed, [rate, later])
  assert.equal(match.related.length, 1)
  assert.equal(match.related[0].isNew, false)
  assert.equal(unreadCount([match]), 0)
})

test('hidden stories and other followed stories are not offered as follow-ups', () => {
  const later = story({ entities: ['אינפלציה', 'ריבית', 'משכנתאות'], firstSeenAt: iso(30) })
  assert.equal(matchFollows([mark], [rate, later], [later.id])[0].related.length, 0)
  const both = matchFollows([mark, snapshotStory(later, T0 + 31 * 60_000)], [rate, later])
  assert.ok(both.every(match => match.related.every(item => item.story.id !== later.id)))
})

test('a followed story that left the feed keeps its snapshot', () => {
  const [match] = matchFollows([mark], [])
  assert.equal(match.current, null)
  assert.equal(match.mark.headline, rate.headline)
})

test('sanitizeFollows drops bad entries, de-duplicates and caps the list', () => {
  const good = snapshotStory(rate, T0)
  const many = Array.from({ length: MAX_FOLLOWS + 5 }, (_, i) => ({ ...good, id: `m${i}`, markedAt: iso(i) }))
  const clean = sanitizeFollows({ marks: [{ nope: true }, null, { ...good, markedAt: 'x' }, good, good, ...many] })
  assert.equal(clean.marks.length, MAX_FOLLOWS)
  assert.ok(clean.marks.every(item => item.id && item.headline))
  assert.equal(clean.marks[0].id, `m${MAX_FOLLOWS + 4}`)
  assert.deepEqual(sanitizeFollows('junk').marks, [])
})

test('loadFollows and saveFollows round-trip and survive broken storage', () => {
  const data = new Map()
  const storage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
  saveFollows({ marks: [mark] }, storage)
  assert.equal(loadFollows(storage).marks[0].id, 'rate')
  assert.deepEqual(loadFollows({ getItem() { throw new Error('blocked') } }).marks, [])
  saveFollows({ marks: [] }, { setItem() { throw new Error('full') } }) // must not throw
})

test('followed stories heavier than the reader allows are softened, not hidden', () => {
  const heavy = story({ intensity: 4 })
  assert.equal(entryForFollowed(heavy, 'balanced').tone, 'calm')
  assert.equal(entryForFollowed(heavy, 'all').tone, 'normal')
  assert.equal(entryForFollowed(story({ intensity: 2 }), 'calm').tone, 'normal')
})
