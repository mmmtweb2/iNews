import { Info } from 'lucide-react'
import Wordmark from './Wordmark.jsx'
import { BRAND } from '../brand.js'
import { timeAgo } from '../lib/format.js'

const STALE_MS = 3 * 3_600_000

export default function Masthead({ generatedAt, now, onAbout }) {
  const age = generatedAt ? now - Date.parse(generatedAt) : null
  const stale = age !== null && age > STALE_MS
  const status = generatedAt ? (stale ? `העדכון האחרון ${timeAgo(generatedAt, now)}` : `עודכן ${timeAgo(generatedAt, now)}`) : ''

  return (
    <header className="mx-auto flex w-full max-w-[72rem] items-center justify-between gap-4 px-4 pt-5 pb-4 sm:px-6">
      <div className="flex items-baseline gap-4">
        <h1 className="m-0">
          <Wordmark />
        </h1>
        <span className="hidden text-sm text-soft sm:inline">{BRAND.tagline}</span>
      </div>
      <div className="flex items-center gap-3 text-sm sm:gap-5">
        {status && <span className={stale ? 'font-medium text-heat-4' : 'text-soft'}>{status}</span>}
        <button type="button" onClick={onAbout} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium hover:bg-[var(--track)]">
          <Info size={16} aria-hidden="true" />
          שקיפות ושיטה
        </button>
      </div>
    </header>
  )
}
