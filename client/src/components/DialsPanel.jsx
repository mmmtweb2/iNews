import Dial from './Dial.jsx'
import { DEFAULT_DIALS, DIAL_IDS, PRESETS, matchPreset } from '../lib/dials.js'
import { DIALS_COPY } from '../lib/copy.js'

// Ready-made combinations of the dials. A chip is lit while the dials match it exactly.
export function PresetChips({ dials, onPick }) {
  const current = matchPreset(dials)
  return (
    <div>
      <ul className="flex flex-wrap gap-1.5" aria-label="סגנונות מוכנים">
        {PRESETS.map(preset => (
          <li key={preset.id}>
            <button
              type="button"
              aria-pressed={current?.id === preset.id}
              onClick={() => onPick(preset.dials)}
              className="preset rounded-full border border-rule px-3 py-1 text-[0.8125rem] font-medium"
            >
              {preset.name}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 min-h-[1.25rem] text-[0.8125rem] leading-snug text-soft" aria-live="polite">
        {current ? current.note : 'סגנון מותאם אישית'}
      </p>
    </div>
  )
}

// The five style dials and the presets above them.
export default function DialsPanel({ dials, onChange }) {
  const custom = !matchPreset(dials)
  return (
    <div>
      <PresetChips dials={dials} onPick={onChange} />
      <div className="mt-5 space-y-5">
        {DIAL_IDS.map(id => (
          <Dial key={id} id={id} value={dials[id]} copy={DIALS_COPY[id]} onChange={value => onChange({ ...dials, [id]: value })} />
        ))}
      </div>
      {custom && (
        <button type="button" onClick={() => onChange(DEFAULT_DIALS)} className="mt-4 text-sm font-medium text-accent hover:underline hover:underline-offset-4">
          חזרה למאוזן
        </button>
      )}
    </div>
  )
}
