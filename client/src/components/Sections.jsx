import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import StoryItem from './StoryItem.jsx'
import HeatGlyph from './HeatGlyph.jsx'
import { storiesCount } from '../lib/format.js'

function Toggle({ open, onClick, children, id }) {
  return (
    <h2 className="text-[0.9375rem]" id={id}>
      <button type="button" aria-expanded={open} onClick={onClick} className="inline-flex items-center gap-2 font-semibold">
        {children}
        <ChevronDown size={18} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
    </h2>
  )
}

// Stories that matched the reader's topics but did not fit in their time.
export function OverflowSection({ entries, ...cardProps }) {
  const [open, setOpen] = useState(false)
  if (!entries.length) return null
  return (
    <section className="mt-4 border-t border-rule pt-6" aria-labelledby="overflow-title">
      <Toggle id="overflow-title" open={open} onClick={() => setOpen(value => !value)}>
        עוד {storiesCount(entries.length)} שלא נכנסו לזמן שבחרת
      </Toggle>
      {open && (
        <ul className="mt-6 space-y-8">
          {entries.slice(0, 25).map(entry => (
            <li key={entry.story.id}>
              <StoryItem entry={entry} variant="compact" showClock={false} {...cardProps} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FilteredRow({ story }) {
  const [shown, setShown] = useState(false)
  return (
    <li className="py-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-medium leading-snug">{story.headline}</p>
          {shown && <p className="mt-1.5 max-w-[40rem] text-[0.9375rem] leading-[1.7] text-soft">{story.calmSummary}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
          <HeatGlyph level={story.intensity} showLabel />
          <button type="button" aria-expanded={shown} onClick={() => setShown(value => !value)} className="text-[0.8125rem] font-medium text-accent hover:underline hover:underline-offset-4">
            {shown ? 'הסתר' : 'הצג בניסוח מאופק'}
          </button>
        </div>
      </div>
    </li>
  )
}

// What the intensity setting left out. It is always listed, never silently dropped.
export function FilteredSection({ stories, mutedCount, onEditTopics }) {
  const [open, setOpen] = useState(false)
  if (!stories.length && !mutedCount) return null
  return (
    <section className="mt-4 border-t border-rule pt-6" aria-labelledby="filtered-title">
      {stories.length > 0 && (
        <>
          <Toggle id="filtered-title" open={open} onClick={() => setOpen(value => !value)}>
            סוננו {storiesCount(stories.length)} לפי רמת הריגוש שבחרת
          </Toggle>
          {open && (
            <>
              <p className="mt-3 max-w-[40rem] text-sm leading-relaxed text-soft">ידיעות כבדות שלא נראו חשובות במיוחד. אפשר לקרוא כל אחת מהן בניסוח מאופק.</p>
              <ul className="mt-2 divide-y divide-rule">
                {stories.map(story => (
                  <FilteredRow key={story.id} story={story} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
      {mutedCount > 0 && (
        <p className={`text-sm text-soft ${stories.length ? 'mt-5' : ''}`}>
          {storiesCount(mutedCount)} מתחומים שהשתקת לא מוצגות.{' '}
          <button type="button" onClick={onEditTopics} className="font-medium text-accent hover:underline hover:underline-offset-4">
            עריכת תחומים
          </button>
        </p>
      )}
    </section>
  )
}
