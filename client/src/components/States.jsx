import { RefreshCw } from 'lucide-react'
import { progressText, refreshMessage } from '../lib/copy.js'

export function FeedSkeleton() {
  return (
    <div aria-busy="true" aria-label="טוען חדשות" className="mt-6 space-y-12">
      {[0, 1, 2].map(i => (
        <div key={i} className="space-y-3">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-8 w-full max-w-[34rem]" />
          <div className="skeleton h-5 w-full max-w-[40rem]" />
          <div className="skeleton h-5 w-2/3 max-w-[28rem]" />
        </div>
      ))}
    </div>
  )
}

function Message({ title, children, action }) {
  return (
    <div className="mt-10 max-w-[34rem]">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-[0.9375rem] leading-[1.7] text-soft">{children}</p>
      {action && <div className="mt-4 flex flex-wrap gap-3">{action}</div>}
    </div>
  )
}

const buttonClass = 'rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper'
const ghostClass = 'rounded-xl border border-rule px-4 py-2.5 text-sm font-medium hover:border-faint'

export function ErrorState({ onRetry }) {
  return (
    <Message
      title="לא הצלחנו לטעון את החדשות"
      action={
        <button type="button" onClick={onRetry} className={buttonClass}>
          נסה שוב
        </button>
      }
    >
      בדוק את החיבור לאינטרנט ונסה שוב. אם זה חוזר, השרת כנראה בעדכון ויחזור בעוד כמה דקות.
    </Message>
  )
}

export function EmptyFeed({ refresh }) {
  const { running, progress, message, start } = refresh
  return (
    <Message
      title="עוד לא נאספו ידיעות"
      action={
        <button type="button" onClick={start} disabled={running} className={`${buttonClass} inline-flex items-center gap-2 disabled:opacity-70`}>
          <RefreshCw size={16} aria-hidden="true" className={running ? 'motion-safe:animate-spin' : ''} />
          {running ? 'טוען חדשות' : 'טען חדשות עכשיו'}
        </button>
      }
    >
      {running
        ? `${progressText(progress)}. הריצה הראשונה לוקחת כמה דקות.`
        : message
          ? refreshMessage(message)
          : 'האתר אוסף ומסכם חדשות רק כשמבקשים. הריצה הראשונה לוקחת כמה דקות.'}
    </Message>
  )
}

export function EmptyBrief({ heat, onShowAll, onEditTopics }) {
  return (
    <Message
      title="אין ידיעות שמתאימות להגדרות"
      action={
        <>
          {heat !== 'all' && (
            <button type="button" onClick={onShowAll} className={buttonClass}>
              הצג את כל הרמות
            </button>
          )}
          <button type="button" onClick={onEditTopics} className={ghostClass}>
            עריכת תחומים
          </button>
        </>
      }
    >
      רמת הריגוש או התחומים שבחרת סוננו הכול. אפשר להרחיב אחד מהם.
    </Message>
  )
}

export function DemoBanner() {
  return (
    <div className="mx-auto w-full max-w-[72rem] px-4 sm:px-6">
      <p className="rounded-lg bg-[var(--track)] px-4 py-2.5 text-sm leading-snug">
        <strong className="font-semibold">נתוני הדגמה.</strong> כך האתר נראה, אבל כל הידיעות כאן והמקורות שלהן הומצאו.
      </p>
    </div>
  )
}
