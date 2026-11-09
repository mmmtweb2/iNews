import { useEffect } from 'react'
import { Info, RefreshCw, X } from 'lucide-react'
import Wordmark from './Wordmark.jsx'
import { BRAND } from '../brand.js'
import { timeAgo } from '../lib/format.js'
import { progressText, refreshMessage } from '../lib/copy.js'

const MESSAGE_MS = 9000

export function RefreshButton({ running, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={running}
      className={`inline-flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2 text-sm font-medium text-paper disabled:opacity-70 ${className}`}
    >
      <RefreshCw size={16} aria-hidden="true" className={running ? 'motion-safe:animate-spin' : ''} />
      {running ? 'מרענן' : 'רענן'}
    </button>
  )
}

// One line under the masthead: how fresh the news is, what a running refresh is doing, or what the last one did.
function RefreshLine({ generatedAt, now, refresh }) {
  const { running, progress, message, dismiss } = refresh

  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(dismiss, MESSAGE_MS)
    return () => clearTimeout(timer)
  }, [message, dismiss])

  let text = generatedAt ? `עודכן ${timeAgo(generatedAt, now)}` : 'עוד לא נאספו ידיעות'
  if (running) text = progressText(progress)
  else if (message) text = refreshMessage(message)

  return (
    <div className="flex min-h-6 items-center gap-2 text-sm text-soft" role="status" aria-live="polite">
      <span className={message && !running ? 'font-medium text-ink' : ''}>{text}</span>
      {message && !running && (
        <button type="button" onClick={dismiss} aria-label="סגור הודעה" className="rounded p-1 hover:bg-[var(--track)]">
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export default function Masthead({ generatedAt, now, refresh, canRefresh, onAbout }) {
  return (
    <header className="mx-auto w-full max-w-[72rem] px-4 pt-5 pb-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <h1 className="m-0">
            <Wordmark />
          </h1>
          <span className="hidden text-sm text-soft sm:inline">{BRAND.tagline}</span>
        </div>
        <div className="flex items-center gap-2 text-sm sm:gap-4">
          <button type="button" onClick={onAbout} className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 font-medium hover:bg-[var(--track)]">
            <Info size={16} aria-hidden="true" />
            <span className="hidden sm:inline">שקיפות ושיטה</span>
            <span className="sr-only sm:hidden">שקיפות ושיטה</span>
          </button>
          {canRefresh && <RefreshButton running={refresh.running} onClick={refresh.start} />}
        </div>
      </div>
      <div className="mt-2">
        <RefreshLine generatedAt={generatedAt} now={now} refresh={refresh} />
      </div>
    </header>
  )
}
