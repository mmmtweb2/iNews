import { CheckCircle2 } from 'lucide-react'
import { formatClock, storiesCount } from '../lib/format.js'

// The end of the brief. It says plainly that there is no more, and shows the promise the product
// keeps: an important story is never hidden, only softened or moved to a list that is named here.
export default function DoneCard({ briefing, onOpenMore }) {
  const { items, usedSec, missedImportant, overflow, filtered, muted } = briefing
  const softened = items.filter(item => item.tone === 'calm').length
  const important = items.filter(item => item.story.importance >= 4).length

  return (
    <section aria-labelledby="done-title" className="story-done mt-2 rounded-2xl bg-raised p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <CheckCircle2 size={26} aria-hidden="true" className="shrink-0 text-accent" />
        <h2 id="done-title" className="font-serif text-2xl font-semibold leading-tight">
          סיימת להיום
        </h2>
      </div>
      <p className="mt-3 text-[1.0625rem] leading-[1.7]">
        הבריף כלל {storiesCount(items.length)}, {formatClock(usedSec)} דקות קריאה. אין כאן עוד שום דבר שמחכה לך, ואין סיבה להמשיך לגלול. ידיעות חדשות יגיעו אחרי הריענון הבא.
      </p>

      <div className="mt-6 border-t border-rule pt-5">
        <h3 className="text-sm font-semibold">הבטחה: ידיעה חשובה לא נעלמת</h3>
        {missedImportant.length === 0 ? (
          <p className="mt-2 text-[0.9375rem] leading-[1.7] text-soft">
            כל הידיעות החשובות שנמצאו מופיעות בבריף{important > 0 ? ` (${important})` : ''}.
            {softened === 1 && ' אחת מהן כבדה, ולכן נכתבה בניסוח מאופק, ומתחתיה מופיעות הכותרות המקוריות של המקורות.'}
            {softened > 1 && ` ${softened} מהן כבדות, ולכן נכתבו בניסוח מאופק, ומתחת לכל אחת מופיעות הכותרות המקוריות של המקורות.`}
          </p>
        ) : (
          <>
            <p className="mt-2 text-[0.9375rem] leading-[1.7] text-soft">
              ידיעות חשובות שלא נכנסו לבריף, כדי שלא תפספס אותן בלי לדעת:
            </p>
            <ul className="mt-3 space-y-2.5 text-[0.9375rem] leading-snug">
              {missedImportant.slice(0, 6).map(story => (
                <li key={story.id}>
                  <span className="font-medium">{story.headline}</span>
                  {story.oneLiner && <span className="text-soft"> {story.oneLiner}</span>}
                </li>
              ))}
            </ul>
            {overflow.length > 0 && (
              <button type="button" onClick={onOpenMore} className="mt-3 text-sm font-medium text-accent hover:underline hover:underline-offset-4">
                הצג את כל מה שלא נכנס
              </button>
            )}
          </>
        )}
        {(filtered.length > 0 || muted.length > 0) && (
          <p className="mt-3 text-[0.8125rem] leading-snug text-soft">
            {filtered.length > 0 && `סוננו ${storiesCount(filtered.length)} כבדות שאינן חשובות במיוחד`}
            {filtered.length > 0 && muted.length > 0 && ', '}
            {muted.length > 0 && `${storiesCount(muted.length)} מתחומים שהשתקת לא מוצגות`}. הן רשומות למטה.
          </p>
        )}
      </div>
    </section>
  )
}
