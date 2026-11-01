import Dialog from './Dialog.jsx'
import { KeywordEditor, TopicRows } from './Topics.jsx'

export default function TopicsDialog({ open, onClose, topics, prefs, update }) {
  return (
    <Dialog open={open} onClose={onClose} title="התחומים שלך" footer={<button type="button" onClick={onClose} className="w-full rounded-xl bg-ink px-4 py-3 text-[0.9375rem] font-medium text-paper">סיום</button>}>
      <p className="text-sm leading-relaxed text-soft">
        <strong className="font-semibold text-ink">עוקב</strong> מעלה את התחום בבריף. <strong className="font-semibold text-ink">בלי</strong> מסתיר אותו, חוץ מהחדשות הגדולות ביותר.
      </p>
      <div className="mt-3">
        <TopicRows topics={topics} prefs={prefs} update={update} />
      </div>

      <h3 className="mt-7 text-sm font-semibold">מילים שחשוב לך לעקוב אחריהן</h3>
      <p className="mt-1 mb-3 text-sm text-soft">ידיעה שמזכירה אחת מהן תעלה בבריף, גם אם התחום שלה לא נבחר.</p>
      <KeywordEditor prefs={prefs} update={update} />

      <h3 className="mt-7 text-sm font-semibold">תצוגה</h3>
      <label className="mt-2 flex items-start gap-3 text-[0.9375rem]">
        <input type="checkbox" checked={prefs.images} onChange={event => update({ images: event.target.checked })} className="mt-1 size-4 accent-[var(--accent)]" />
        <span>
          הצג תמונה בידיעה הראשונה
          <span className="block text-sm text-soft">תמונות לא מוצגות בידיעות מתוחות או קשות.</span>
        </span>
      </label>

      {prefs.hidden.length > 0 && (
        <p className="mt-7 text-sm text-soft">
          הסתרת {prefs.hidden.length} ידיעות.{' '}
          <button type="button" onClick={() => update({ hidden: [] })} className="font-medium text-accent hover:underline hover:underline-offset-4">
            החזר הכול
          </button>
        </p>
      )}
    </Dialog>
  )
}
