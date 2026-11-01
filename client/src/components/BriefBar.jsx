import { formatClock } from '../lib/format.js'

// The brief as a strip: one segment per story, as long as the story takes to read.
// It stays on screen while you read, and fills in as you move down the page.
export default function BriefBar({ items, usedSec, budgetSec, activeId }) {
  const activeIndex = items.findIndex(item => item.story.id === activeId)

  return (
    <div className="brief-bar">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-xl font-semibold">הבריף שלך</h2>
        <p className="text-sm text-soft">
          <span className="font-semibold tabular-nums text-ink">{formatClock(usedSec)}</span>
          {budgetSec ? (
            <>
              {' '}
              מתוך <span className="tabular-nums">{formatClock(budgetSec)}</span>
            </>
          ) : (
            ' דקות קריאה'
          )}
        </p>
      </div>
      {items.length > 0 && (
        <nav aria-label="מפת הבריף" className="strip">
          {items.map((item, index) => {
            const state = activeIndex < 0 ? 'idle' : index < activeIndex ? 'read' : index === activeIndex ? 'active' : 'idle'
            return (
              <a key={item.story.id} href={`#story-${item.story.id}`} className="strip-hit" style={{ flexGrow: item.costSec }} data-state={state} title={item.story.headline} aria-label={item.story.headline}>
                <span className="strip-seg" />
              </a>
            )
          })}
        </nav>
      )}
    </div>
  )
}
