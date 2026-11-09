import { storiesCount } from '../lib/format.js'

// What changed since the reader last visited: new stories and stories that were rewritten.
export default function ChangesBar({ summary, only, onToggle, onMarkSeen }) {
  const { added, updated } = summary
  if (!added && !updated) return null
  const parts = []
  if (added) parts.push(`${storiesCount(added)} חדשות`.replace('ידיעה אחת חדשות', 'ידיעה אחת חדשה'))
  if (updated) parts.push(updated === 1 ? 'ידיעה אחת עודכנה' : `${updated} ידיעות עודכנו`)

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl bg-[var(--track)] px-4 py-3 text-sm">
      <p className="leading-snug">
        <strong className="font-semibold">מאז הביקור האחרון: </strong>
        {parts.join(', ')}.
      </p>
      <div className="flex items-center gap-4">
        <button type="button" aria-pressed={only} onClick={onToggle} className="font-medium text-accent hover:underline hover:underline-offset-4">
          {only ? 'הצג את כל הבריף' : 'הצג רק את מה שהשתנה'}
        </button>
        <button type="button" onClick={onMarkSeen} className="text-soft hover:text-ink">
          סמן הכול כנקרא
        </button>
      </div>
    </div>
  )
}
