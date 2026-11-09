import { ExternalLink } from 'lucide-react'
import StoryItem from './StoryItem.jsx'
import { entryForFollowed } from '../lib/follow.js'
import { timeAgo } from '../lib/format.js'

function Empty({ onBack }) {
  return (
    <div className="mt-10 max-w-[34rem]">
      <h2 className="font-serif text-xl font-semibold">עוד לא סימנת ידיעות</h2>
      <p className="mt-2 text-[0.9375rem] leading-[1.7] text-soft">
        לחיצה על &quot;מעניין אותי&quot; בכל ידיעה שומרת אותה כאן. אחרי כל ריענון נציג את העדכונים שלה ואת הידיעות שקשורות אליה. הסימונים נשמרים רק בדפדפן הזה.
      </p>
      <button type="button" onClick={onBack} className="mt-4 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper">
        חזרה לבריף
      </button>
    </div>
  )
}

// The followed stories, each with what has happened since: changes to the story itself and
// later stories about the same thing. The intensity setting still applies (softened, not hidden).
export default function FollowView({ matches, dials, now, onUnfollow, onBack, ...cardProps }) {
  if (!matches.length) return <Empty onBack={onBack} />

  return (
    <div className="mt-6 space-y-14">
      {matches.map(({ mark, current, updated, related }) => (
        <section key={mark.id} aria-labelledby={`follow-${mark.id}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[0.8125rem] text-soft">סימנת {timeAgo(mark.markedAt, now)}</p>
              <h2 id={`follow-${mark.id}`} className="headline mt-1 text-xl leading-snug">
                {mark.headline}
              </h2>
            </div>
            <button type="button" onClick={() => onUnfollow(mark.id)} className="shrink-0 pt-1 text-sm text-soft hover:text-ink">
              הפסק לעקוב
            </button>
          </div>

          <div className="mt-6 border-s-2 border-rule ps-5 sm:ps-8">
            {updated && current && (
              <div>
                <StoryItem entry={entryForFollowed(current, dials, 'full')} showClock={false} variant="standard" expandTimeline now={now} badge="עודכנה" {...cardProps} />
              </div>
            )}

            {!current && (
              <p className="pb-8 text-[0.9375rem] leading-[1.7] text-soft">
                הידיעה כבר לא בפיד.{' '}
                {mark.url && (
                  <a href={mark.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-accent hover:underline hover:underline-offset-4">
                    לקריאה במקור
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </p>
            )}

            {related.map(({ story, shared, isNew }) => (
              <StoryItem key={story.id} entry={entryForFollowed(story, dials)} showClock={false} variant="compact" now={now} badge={isNew ? 'חדש' : null} note={`קשור כי מופיעים בה: ${shared.join(', ')}`} {...cardProps} />
            ))}

            {!updated && related.length === 0 && (
              <p className="pb-2 text-[0.9375rem] leading-[1.7] text-soft">עוד לא הגיע המשך. אם יתפרסם, הוא יופיע כאן אחרי הריענון הבא.</p>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
