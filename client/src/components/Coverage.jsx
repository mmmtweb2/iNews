import { Eye } from 'lucide-react'
import { blindspotText, reachLabel } from '../lib/copy.js'

const LEAN_ORDER = ['left', 'center-left', 'center', 'center-right', 'right']

// Where on the (rated) Israeli media spectrum the outlets that covered this story sit.
// Drawn left-to-right on purpose, so "left" is on the left even in a right-to-left page.
function LeanRail({ sources, leanLabels }) {
  const present = LEAN_ORDER.filter(lean => sources.some(source => source.lean === lean))
  if (!present.length) return null
  const label = `ספקטרום הכיסוי: ${present.map(lean => leanLabels[lean]).join(', ')}`
  return (
    <span dir="ltr" className="inline-flex items-center gap-2 text-xs text-soft" title={label}>
      <span aria-hidden="true">שמאל</span>
      <svg width="64" height="12" viewBox="0 0 64 12" role="img" aria-label={label}>
        <line x1="2" y1="6" x2="62" y2="6" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
        {LEAN_ORDER.map((lean, i) => {
          const on = present.includes(lean)
          return <circle key={lean} cx={4 + i * 14} cy="6" r={on ? 4.5 : 1.8} fill={on ? 'var(--ink)' : 'currentColor'} opacity={on ? 1 : 0.35} />
        })}
      </svg>
      <span aria-hidden="true">ימין</span>
    </span>
  )
}

export default function Coverage({ story, leanLabels }) {
  const seen = new Set()
  const outlets = story.sources.filter(source => (seen.has(source.id) ? false : seen.add(source.id)))
  const shown = outlets.slice(0, 4)
  const extra = outlets.length - shown.length
  const reach = reachLabel(story.coverage?.confidence, outlets.length)

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-soft">
        <LeanRail sources={story.sources} leanLabels={leanLabels} />
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {shown.map(source => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noopener noreferrer" title={source.lean ? leanLabels[source.lean] : undefined} className="underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink">
                {source.name}
                <span className="sr-only"> (נפתח בלשונית חדשה)</span>
              </a>
            </li>
          ))}
          {extra > 0 && <li>ועוד {extra}</li>}
        </ul>
        <span className={reach.single ? 'font-medium text-ink' : ''}>{reach.text}</span>
      </div>
      {story.coverage?.blindspot && (
        <p className="mt-2 flex items-center gap-1.5 text-[0.8125rem] text-soft" title="ההשוואה היא מול המקורות שאנחנו עוקבים אחריהם. ייתכן שהסיקור עוד יגיע.">
          <Eye size={15} aria-hidden="true" className="shrink-0" />
          {blindspotText(story.coverage.blindspot)}
        </p>
      )}
    </div>
  )
}
