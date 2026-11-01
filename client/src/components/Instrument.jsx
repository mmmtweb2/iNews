import { HeatControl, TimeControl } from './Controls.jsx'
import { HEAT_NOTES } from '../lib/copy.js'
import { storiesCount } from '../lib/format.js'

// The reader's two dials (time and intensity) plus a summary of their topics.
// On wide screens it sits beside the brief; on phones it opens as a sheet.
export default function Instrument({ prefs, update, topics, stats, onEditTopics }) {
  const labels = Object.fromEntries(topics.map(topic => [topic.id, topic.label]))
  const followed = Object.keys(prefs.topics).filter(id => prefs.topics[id] === 'follow' && labels[id])
  const muted = Object.keys(prefs.topics).filter(id => prefs.topics[id] === 'mute' && labels[id])

  return (
    <section aria-label="התאמה אישית" className="rounded-[14px] bg-raised p-5">
      <div>
        <p className="mb-2 text-sm font-semibold">כמה זמן יש לך?</p>
        <TimeControl value={prefs.minutes} onChange={minutes => update({ minutes })} />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold">רמת ריגוש</p>
        <HeatControl value={prefs.heat} onChange={heat => update({ heat })} />
        <p className="mt-2 text-[0.8125rem] leading-snug text-soft">{HEAT_NOTES[prefs.heat]}</p>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">התחומים שלך</p>
          <button type="button" onClick={onEditTopics} className="text-sm font-medium text-accent hover:underline hover:underline-offset-4">
            עריכה
          </button>
        </div>
        {followed.length === 0 && muted.length === 0 && prefs.keywords.length === 0 ? (
          <p className="text-[0.8125rem] leading-snug text-soft">כל התחומים באותה חשיבות. בחר תחומים כדי שהם יעלו בבריף.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5 text-[0.8125rem]">
            {followed.map(id => (
              <li key={id} className="rounded-full bg-accent px-2.5 py-0.5 font-medium text-accent-ink">
                {labels[id]}
              </li>
            ))}
            {prefs.keywords.map(word => (
              <li key={word} className="rounded-full border border-accent px-2.5 py-0.5 font-medium text-accent">
                {word}
              </li>
            ))}
            {muted.map(id => (
              <li key={id} className="rounded-full bg-[var(--track)] px-2.5 py-0.5 text-soft line-through">
                {labels[id]}
              </li>
            ))}
          </ul>
        )}
      </div>

      {stats && (
        <p className="mt-5 border-t border-rule pt-4 text-[0.8125rem] leading-snug text-soft">
          בבריף {storiesCount(stats.shown)} מתוך {stats.total}.{stats.filtered > 0 && ` ${stats.filtered} סוננו לפי רמת הריגוש.`}
        </p>
      )}
    </section>
  )
}
