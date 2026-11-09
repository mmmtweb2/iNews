import { useState } from 'react'
import { Bookmark, BookmarkCheck, ChevronDown, EyeOff, Info } from 'lucide-react'
import HeatGlyph from './HeatGlyph.jsx'
import Coverage from './Coverage.jsx'
import { formatClock, timeAgo } from '../lib/format.js'

const HEADLINE_SIZE = {
  lead: 'text-[clamp(1.75rem,1.25rem+2vw,2.5rem)] leading-[1.2]',
  standard: 'text-[clamp(1.25rem,1.1rem+0.7vw,1.5rem)] leading-[1.3]',
  compact: 'text-lg leading-snug',
}

function LeadImage({ src }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setOk(false)} className="mt-5 aspect-[16/9] w-full rounded-lg bg-[var(--track)] object-cover" />
}

// One story. `entry.depth` decides how much is open by default; the reader can always open more.
export default function StoryItem({ entry, variant = 'standard', showClock = true, active = false, now, topicLabels, leanLabels, showImages, onHide, followedIds = null, onFollow, note = null, badge = null }) {
  const { story, tone, depth, startSec } = entry
  const calm = tone === 'calm'
  const followed = Boolean(followedIds && followedIds.has(story.id))
  const [open, setOpen] = useState(depth === 'full')

  const showLead = !calm && (depth !== 'headline' || open)
  const hasMore = !calm && (depth === 'headline' || story.bullets.length > 0 || Boolean(story.whyItMatters) || story.framing.length > 0)
  const inflated = story.sourceHeat >= story.intensity + 2
  const withImage = showImages && variant === 'lead' && story.image && story.intensity <= 2 && !story.graphic

  const toggleLabel = open ? 'הצג פחות' : depth === 'headline' ? 'הצג את הידיעה' : 'קרא עוד'

  return (
    <article id={`story-${story.id}`} data-id={story.id} data-active={active} className={`story ${showClock ? 'story-timed' : ''}`}>
      {showClock && (
        <div className="spine">
          <span className="clock">
            <span className="sr-only">מתחיל בדקה </span>
            {formatClock(startSec)}
          </span>
        </div>
      )}

      <div className="min-w-0 pb-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-soft">
          <span className="font-semibold text-accent">{topicLabels[story.primaryTopic] || ''}</span>
          <span>{timeAgo(story.publishedAt, now)}</span>
          <HeatGlyph level={story.intensity} showLabel={calm || story.intensity >= 3} />
          {badge && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-ink">{badge}</span>}
        </div>

        <h3 className={`headline mt-2 ${HEADLINE_SIZE[variant]}`}>{story.headline}</h3>

        {calm && (
          <>
            <p className="mt-3 max-w-[42rem] text-[1.0625rem] leading-[1.75]">{story.calmSummary}</p>
            <p className="mt-3 flex items-center gap-1.5 text-[0.8125rem] text-soft">
              <Info size={15} aria-hidden="true" className="shrink-0" />
              {story.importance >= 4 ? 'ידיעה כבדה וחשובה, בניסוח מאופק' : 'ידיעה טעונה, בניסוח מאופק'}
            </p>
          </>
        )}

        {showLead && story.oneLiner && <p className="mt-3 max-w-[42rem] text-[1.0625rem] leading-[1.75]">{story.oneLiner}</p>}
        {showLead && withImage && <LeadImage src={story.image} />}

        {showLead && story.contested && (
          <p className="mt-4 max-w-[42rem] border-s-2 border-heat-3 ps-3 text-[0.9375rem] leading-[1.7]">
            <strong className="font-semibold">במחלוקת: </strong>
            {story.contested}
          </p>
        )}

        {open && !calm && (
          <>
            {story.bullets.length > 0 && (
              <ul className="mt-4 max-w-[42rem] list-disc space-y-2 ps-5 text-[0.9375rem] leading-[1.7] marker:text-faint">
                {story.bullets.map(bullet => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
            {story.whyItMatters && (
              <p className="mt-4 max-w-[42rem] text-[0.9375rem] leading-[1.7]">
                <strong className="font-semibold">למה זה חשוב: </strong>
                {story.whyItMatters}
              </p>
            )}
            {story.framing.length > 0 && (
              <details className="mt-4 max-w-[42rem]">
                <summary className="cursor-pointer text-sm font-medium text-accent">איך כל מקור ניסח את זה</summary>
                <ul className="mt-2 space-y-2 text-[0.9375rem] leading-[1.7]">
                  {story.framing.map(item => (
                    <li key={item.sourceId}>
                      <span className="font-semibold">{item.source}: </span>
                      {item.note}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}

        {inflated && !calm && (
          <p className="mt-3 flex items-center gap-1.5 text-[0.8125rem] text-soft">
            <Info size={15} aria-hidden="true" className="shrink-0" />
            הניסוח במקורות טעון יותר מהעובדות
          </p>
        )}

        {note && <p className="mt-3 text-[0.8125rem] text-soft">{note}</p>}

        {(showLead || calm || open) && <Coverage story={story} leanLabels={leanLabels} />}

        <div className="mt-5 flex items-center gap-6 text-sm">
          {hasMore && (
            <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} className="inline-flex items-center gap-1 font-medium text-accent hover:underline hover:underline-offset-4">
              {toggleLabel}
              <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
          {onFollow && (
            <button type="button" aria-pressed={followed} onClick={() => onFollow(story)} className={`inline-flex items-center gap-1.5 font-medium ${followed ? 'text-accent' : 'text-soft hover:text-ink'}`}>
              {followed ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
              {followed ? 'במעקב' : 'מעניין אותי'}
            </button>
          )}
          {onHide && <button type="button" onClick={() => onHide(story.id)} className="inline-flex items-center gap-1.5 text-soft hover:text-ink">
            <EyeOff size={15} aria-hidden="true" />
            הסתר
          </button>}
        </div>
      </div>
    </article>
  )
}
