import { useCallback, useEffect, useRef, useState } from 'react'
import { loadPrefs, sanitizePrefs, savePrefs } from './prefs.js'
import { loadSeen, saveSeen, snapshotSeen } from './seen.js'
import { loadFollows, markViewed, MAX_FOLLOWS, sanitizeFollows, saveFollows, snapshotStory } from './follow.js'

const REFRESH_MS = 5 * 60_000

// Loads the feed and keeps the last good copy if a later load fails. This only reads what the
// server already has; making new stories is the refresh button's job (useRefresh).
export function useFeed() {
  const [state, setState] = useState({ status: 'loading', data: null })

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/feed')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setState({ status: 'ready', data })
      return data
    } catch {
      setState(previous => (previous.data ? previous : { status: 'error', data: null }))
      return null
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, REFRESH_MS)
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  return { ...state, reload: load }
}

// A clock that ticks once a minute, so "5 minutes ago" stays honest.
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

// Preferences live in this browser only. `update` takes a partial object or a function of the current prefs.
export function usePrefs() {
  const [prefs, setPrefs] = useState(() => loadPrefs())

  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  const update = useCallback(patch => {
    setPrefs(previous => sanitizePrefs({ ...previous, ...(typeof patch === 'function' ? patch(previous) : patch) }))
  }, [])

  return [prefs, update]
}

// Which story is currently being read (the one crossing the upper part of the screen).
export function useActiveStory(ids) {
  const [activeId, setActiveId] = useState(null)
  const key = ids.join('|')

  useEffect(() => {
    if (!key) return undefined
    const elements = key
      .split('|')
      .map(id => document.getElementById(`story-${id}`))
      .filter(Boolean)
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length) setActiveId(visible[0].target.dataset.id)
      },
      { rootMargin: '-18% 0px -68% 0px' },
    )
    elements.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [key])

  return activeId
}


const POLL_MS = 2500
const POLL_LIMIT_MS = 15 * 60_000

// The refresh button. It asks the server to fetch and write up new stories, follows the run's
// progress, then reloads the feed. `getSnapshot` returns Map(id -> updatedAt) of what is on screen,
// so the result can say how many stories are new or changed.
export function useRefresh({ reload, getSnapshot }) {
  const [state, setState] = useState({ running: false, progress: null, message: null })
  const timer = useRef(null)
  const before = useRef(null)

  const stop = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = null
  }, [])

  const finish = useCallback(
    async message => {
      stop()
      const data = await reload()
      let result = message
      if (data && before.current && message.kind === 'done') {
        const added = data.stories.filter(story => !before.current.has(story.id)).length
        const changed = data.stories.filter(story => before.current.has(story.id) && before.current.get(story.id) !== story.updatedAt).length
        result = { kind: 'done', added, changed }
      }
      setState({ running: false, progress: null, message: result })
    },
    [reload, stop],
  )

  const poll = useCallback(
    startedAt => {
      stop()
      timer.current = setTimeout(async () => {
        try {
          const response = await fetch('/api/refresh', { cache: 'no-store' })
          const body = await response.json()
          if (body.running) {
            if (Date.now() - startedAt > POLL_LIMIT_MS) return finish({ kind: 'error' })
            setState(previous => ({ ...previous, running: true, progress: body.progress }))
            return poll(startedAt)
          }
          return finish({ kind: 'done' })
        } catch {
          return finish({ kind: 'error' })
        }
      }, POLL_MS)
    },
    [finish, stop],
  )

  const start = useCallback(async () => {
    before.current = getSnapshot()
    setState({ running: true, progress: null, message: null })
    try {
      const response = await fetch('/api/refresh', { method: 'POST' })
      const body = await response.json().catch(() => ({}))
      if (response.status === 202) {
        setState({ running: true, progress: body.progress || null, message: null })
        return poll(Date.now())
      }
      if (response.status === 200) return finish({ kind: 'fresh', retryAfterSec: body.retryAfterSec || null })
      if (response.status === 429) return finish({ kind: 'limit' })
      if (response.status === 503) return finish({ kind: 'unavailable' })
      return finish({ kind: 'error' })
    } catch {
      return finish({ kind: 'error' })
    }
  }, [finish, getSnapshot, poll])

  // A page opened while someone else's run is in progress joins it instead of looking idle.
  useEffect(() => {
    let cancelled = false
    fetch('/api/refresh', { cache: 'no-store' })
      .then(response => response.json())
      .then(body => {
        if (cancelled || !body.running) return
        before.current = getSnapshot()
        setState({ running: true, progress: body.progress || null, message: null })
        poll(Date.now())
      })
      .catch(() => {})
    return () => {
      cancelled = true
      stop()
    }
    // Runs once on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismiss = useCallback(() => setState(previous => ({ ...previous, message: null })), [])

  return { ...state, start, dismiss }
}

// Followed stories live in this browser only.
export function useFollows() {
  const [state, setState] = useState(() => loadFollows())

  useEffect(() => {
    saveFollows(state)
  }, [state])

  const toggle = useCallback(story => {
    setState(previous => {
      if (previous.marks.some(mark => mark.id === story.id)) return { marks: previous.marks.filter(mark => mark.id !== story.id) }
      return sanitizeFollows({ marks: [snapshotStory(story), ...previous.marks].slice(0, MAX_FOLLOWS) })
    })
  }, [])

  const remove = useCallback(id => setState(previous => ({ marks: previous.marks.filter(mark => mark.id !== id) })), [])

  const viewed = useCallback(stories => setState(previous => ({ marks: markViewed(previous.marks, stories) })), [])

  return { marks: state.marks, toggle, remove, viewed }
}


// What the reader had already seen when this visit began (null on a first visit). The record is
// updated when they leave the page, so the labels stay steady while they read.
export function useSeen(stories) {
  const [seen, setSeen] = useState(() => loadSeen())
  const latest = useRef(stories)
  useEffect(() => {
    latest.current = stories
  }, [stories])

  useEffect(() => {
    const save = () => saveSeen(latest.current)
    const onHide = () => document.visibilityState === 'hidden' && save()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', save)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', save)
    }
  }, [])

  const markSeen = useCallback(() => {
    saveSeen(latest.current)
    setSeen(snapshotSeen(latest.current))
  }, [])

  return { seen, markSeen }
}
