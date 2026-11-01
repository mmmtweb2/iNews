import { useCallback, useEffect, useState } from 'react'
import { loadPrefs, sanitizePrefs, savePrefs } from './prefs.js'

const REFRESH_MS = 5 * 60_000

// Loads the feed, keeps the last good copy if a later refresh fails, and refreshes
// every few minutes and whenever the tab becomes visible again.
export function useFeed() {
  const [state, setState] = useState({ status: 'loading', data: null })

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/feed')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setState({ status: 'ready', data })
    } catch {
      setState(previous => (previous.data ? previous : { status: 'error', data: null }))
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
