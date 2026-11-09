import Dialog from './Dialog.jsx'
import { TimeControl } from './Controls.jsx'
import { PresetChips } from './DialsPanel.jsx'
import { TopicChips } from './Topics.jsx'

// First visit only. Three choices, all of which can be changed at any time.
export default function Onboarding({ open, onDone, topics, prefs, update }) {
  return (
    <Dialog
      open={open}
      onClose={onDone}
      title="החדשות שלך, בקצב שלך"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button type="button" onClick={onDone} className="flex-1 rounded-xl bg-ink px-4 py-3 text-[0.9375rem] font-medium text-paper">
            הצג את החדשות שלי
          </button>
        </div>
      }
    >
      <p className="text-[0.9375rem] leading-[1.7] text-soft">שלוש בחירות, ואפשר לשנות אותן בכל רגע. בהגדרות יש גם חמישה מחוונים לכוונון מדויק של הסגנון. הכול נשמר רק בדפדפן הזה.</p>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold">כמה זמן יש לך?</p>
        <TimeControl value={prefs.minutes} onChange={minutes => update({ minutes })} />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold">איזה סגנון מתאים לך?</p>
        <PresetChips dials={prefs.dials} onPick={dials => update({ dials })} />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold">מה מעניין אותך?</p>
        <TopicChips topics={topics} prefs={prefs} update={update} />
      </div>
    </Dialog>
  )
}
