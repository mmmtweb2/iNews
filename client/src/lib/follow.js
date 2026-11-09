// "Following": the reader marks a story as interesting, and later stories about the same
// thing are gathered in one place. Everything runs in the browser from data we already
// have (headline, entities, topics). There is no account and no extra AI call.
//
// Relatedness is deliberately plain and explainable: two stories are related when they
// share enough distinctive words or named things, and the interface shows which ones.

import { HEAT_CAP } from './briefing.js'

const KEY = 'inews.follows.v1'
export const MAX_FOLLOWS = 20
const MAX_RELATED = 8
const MIN_SHARED_TERMS = 2
const MIN_SCORE = 3.5
const COMMON_SHARE = 0.15 // a term in more than this share of stories says little
const COMMON_WEIGHT = 0.3

const STOP = new Set(
  'של את על עם הוא היא הם הן אחרי לפני כי גם או לא כל זה זו אל מן בין עד כך יותר פחות לאחר במהלך אמר אמרו אומר צפוי צפויה לפי כמו מול דווח דיווח הודיע הודיעה חדשות ישראל ישראלי ישראלית ישראלים היום אתמול מחר השבוע החודש הבוקר הערב שנה שנים חדש חדשה'.split(' '),
)

export function tokenize(text) {
  return String(text || '')
    .replace(/[֑-ׇ]/g, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(token => token.length >= 3 && !STOP.has(token))
}

// A crude Hebrew stem: drop one leading prefix letter and a plural ending. Imperfect on purpose;
// `sameTerm` forgives the rest.
export function stem(token) {
  let t = token
  if (t.length >= 5 && 'הוכלבמש'.includes(t[0])) t = t.slice(1)
  if (t.length >= 5 && /(ים|ות)$/.test(t)) t = t.slice(0, -2)
  return t
}

function sameTerm(a, b) {
  if (a === b) return true
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  return short.length >= 4 && long.length - short.length <= 2 && long.startsWith(short)
}

function termsOf(story) {
  const entityTokens = (story.entities || []).flatMap(tokenize)
  const entities = [...new Set(entityTokens.map(stem))]
  const words = [...new Set([...tokenize(story.headline), ...tokenize(story.oneLiner)].map(stem))]
  return { entities, words, shown: new Map([...entityTokens, ...tokenize(story.headline)].map(token => [stem(token), token])) }
}

export function sanitizeFollows(raw) {
  const input = raw && typeof raw === 'object' ? raw : {}
  const list = Array.isArray(input.marks) ? input.marks : []
  const marks = []
  for (const item of list) {
    if (!item || typeof item.id !== 'string' || typeof item.headline !== 'string') continue
    const markedAt = Date.parse(item.markedAt) ? item.markedAt : null
    if (!markedAt || marks.some(mark => mark.id === item.id)) continue
    marks.push({
      id: item.id.slice(0, 80),
      headline: item.headline.slice(0, 200),
      entities: (Array.isArray(item.entities) ? item.entities : []).filter(text => typeof text === 'string').map(text => text.slice(0, 40)).slice(0, 6),
      topic: typeof item.topic === 'string' ? item.topic.slice(0, 30) : '',
      url: typeof item.url === 'string' && item.url.startsWith('http') ? item.url.slice(0, 500) : '',
      markedAt,
      viewedAt: Date.parse(item.viewedAt) ? item.viewedAt : markedAt,
      seenUpdatedAt: Date.parse(item.seenUpdatedAt) ? item.seenUpdatedAt : markedAt,
    })
  }
  return { marks: marks.sort((a, b) => Date.parse(b.markedAt) - Date.parse(a.markedAt)).slice(0, MAX_FOLLOWS) }
}

export function loadFollows(storage = globalThis.localStorage) {
  try {
    return sanitizeFollows(JSON.parse(storage.getItem(KEY)))
  } catch {
    return sanitizeFollows(null)
  }
}

export function saveFollows(state, storage = globalThis.localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Private mode or a full disk: following simply will not persist.
  }
}

export function snapshotStory(story, now = Date.now()) {
  const stamp = new Date(now).toISOString()
  return {
    id: story.id,
    headline: story.headline,
    entities: (story.entities || []).slice(0, 6),
    topic: story.primaryTopic || '',
    url: story.sources && story.sources[0] ? story.sources[0].url : '',
    markedAt: stamp,
    viewedAt: stamp,
    seenUpdatedAt: story.updatedAt || stamp,
  }
}

// Scores one story against one mark. Returns null when they are not related enough.
function relate(markTerms, storyTerms, commonTerms) {
  let score = 0
  const shared = []
  const consider = (terms, weight) => {
    for (const term of terms) {
      const hit = storyTerms.entities.find(candidate => sameTerm(term, candidate)) ?? storyTerms.words.find(candidate => sameTerm(term, candidate))
      if (hit === undefined || shared.some(item => sameTerm(item.term, term))) continue
      const common = [...commonTerms].some(candidate => sameTerm(candidate, term))
      shared.push({ term })
      score += weight * (common ? COMMON_WEIGHT : 1)
    }
  }
  consider(markTerms.entities, 2)
  consider(markTerms.words, 1)
  if (shared.length < MIN_SHARED_TERMS || score < MIN_SCORE) return null
  return { score, shared: shared.map(item => markTerms.shown.get(item.term) || item.term).slice(0, 3) }
}

// For each followed story: the current version of it (if still in the feed, and whether it changed
// since the reader last looked) and the stories that arrived after the reader marked it and are about the same thing.
export function matchFollows(marks, stories, hiddenIds = []) {
  if (!marks.length) return []
  const hidden = new Set(hiddenIds)
  const markedIds = new Set(marks.map(mark => mark.id))
  const byId = new Map(stories.map(story => [story.id, story]))

  // Terms that appear in many stories (e.g. "ממשלה") count for much less.
  const df = new Map()
  const storyTerms = new Map()
  for (const story of stories) {
    const terms = termsOf(story)
    storyTerms.set(story.id, terms)
    for (const term of new Set([...terms.entities, ...terms.words])) df.set(term, (df.get(term) || 0) + 1)
  }
  const commonTerms = new Set([...df].filter(([, count]) => stories.length >= 8 && count / stories.length > COMMON_SHARE).map(([term]) => term))

  const results = marks.map(mark => {
    const current = byId.get(mark.id) || null
    return {
      mark,
      current,
      updated: Boolean(current && Date.parse(current.updatedAt) > Date.parse(mark.seenUpdatedAt)),
      related: [],
      markTerms: termsOf({ headline: mark.headline, entities: mark.entities }),
    }
  })

  for (const story of stories) {
    if (markedIds.has(story.id) || hidden.has(story.id)) continue
    let best = null
    results.forEach((result, index) => {
      if (Date.parse(story.firstSeenAt) <= Date.parse(result.mark.markedAt)) return
      const match = relate(result.markTerms, storyTerms.get(story.id), commonTerms)
      if (match && (!best || match.score > best.match.score)) best = { index, match }
    })
    if (best) {
      const mark = results[best.index].mark
      results[best.index].related.push({ story, score: best.match.score, shared: best.match.shared, isNew: Date.parse(story.firstSeenAt) > Date.parse(mark.viewedAt) })
    }
  }

  return results
    .map(result => ({ mark: result.mark, current: result.current, updated: result.updated, related: [...result.related].sort((a, b) => Date.parse(b.story.publishedAt) - Date.parse(a.story.publishedAt)).slice(0, MAX_RELATED) }))
    .sort((a, b) => unreadOf(b) - unreadOf(a) || Date.parse(b.mark.markedAt) - Date.parse(a.mark.markedAt))
}

function unreadOf(match) {
  return match.related.filter(item => item.isNew).length + (match.updated ? 1 : 0)
}

export function unreadCount(matches) {
  return matches.reduce((sum, match) => sum + unreadOf(match), 0)
}

// Marks everything as seen as of now.
export function markViewed(marks, stories, now = Date.now()) {
  const byId = new Map(stories.map(story => [story.id, story]))
  const stamp = new Date(now).toISOString()
  return marks.map(mark => {
    const current = byId.get(mark.id)
    return { ...mark, viewedAt: stamp, seenUpdatedAt: current ? current.updatedAt : mark.seenUpdatedAt }
  })
}

// How a followed-up story is shown: the reader's intensity setting still applies, softened rather than hidden.
export function entryForFollowed(story, heat) {
  const cap = HEAT_CAP[heat] ?? HEAT_CAP.balanced
  return { story, tone: story.intensity > cap ? 'calm' : 'normal', depth: 'short', startSec: 0 }
}
