import { SlidersHorizontal } from 'lucide-react'
import { minutesLabel } from '../lib/format.js'
import { HEAT_NAMES } from '../lib/copy.js'

// On phones the two dials live one thumb-tap away, always visible at the bottom.
export default function MobileBar({ prefs, onOpen }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
      <button type="button" onClick={onOpen} className="flex w-full items-center justify-between rounded-xl bg-ink px-4 py-3 text-paper">
        <span className="text-[0.9375rem] font-medium">
          {minutesLabel(prefs.minutes)}, {HEAT_NAMES[prefs.heat]}
        </span>
        <span className="inline-flex items-center gap-2 text-sm">
          <SlidersHorizontal size={16} aria-hidden="true" />
          התאמה
        </span>
      </button>
    </div>
  )
}
