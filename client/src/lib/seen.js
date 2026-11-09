// What the reader has already been shown, so the next visit can say what is new or changed.
// Stored in this browser only: story id -> the updatedAt the reader last saw.

const KEY = 'inews.seen.v1'
const MAX_SEEN = 500

export function sanitizeSeen(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const entries = Object.entries(raw).filter(([id, at]) => typeof id === 'string' && typeof at === 'string' && at)
  if (!entries.length) return null
  return new Map(entries.slice(-MAX_SEEN))
}

// null on a first visit (or when storage is unavailable): then nothing is labelled as new.
export function loadSeen(storage = globalThis.localStorage) {
  try {
    return sanitizeSeen(JSON.parse(storage.getItem(KEY)))
  } catch {
    return null
  }
}

export function snapshotSeen(stories) {
  return new Map([...stories].sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt)).slice(-MAX_SEEN).map(story => [story.id, story.updatedAt]))
}

export function saveSeen(stories, storage = globalThis.localStorage) {
  if (!stories.length) return
  try {
    storage.setItem(KEY, JSON.stringify(Object.fromEntries(snapshotSeen(stories))))
  } catch {
    // Private mode or a full disk: the labels simply do not appear next time.
  }
}

// How many stories are new, and how many have changed, compared with what the reader last saw.
export function summarizeChanges(stories, seen) {
  if (!seen) return { added: 0, updated: 0 }
  let added = 0
  let updated = 0
  for (const story of stories) {
    if (!seen.has(story.id)) added += 1
    else if (seen.get(story.id) !== story.updatedAt) updated += 1
  }
  return { added, updated }
}

export function onlyChanged(stories, seen) {
  if (!seen) return stories
  return stories.filter(story => !seen.has(story.id) || seen.get(story.id) !== story.updatedAt)
}
