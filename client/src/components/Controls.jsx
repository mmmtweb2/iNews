import Segmented from './Segmented.jsx'
import HeatGlyph from './HeatGlyph.jsx'
import { MINUTE_OPTIONS } from '../lib/prefs.js'
import { minutesLabel } from '../lib/format.js'
import { HEAT_NAMES } from '../lib/copy.js'

export function TimeControl({ value, onChange }) {
  const options = MINUTE_OPTIONS.map(minutes => ({ value: minutes, label: minutesLabel(minutes) }))
  return <Segmented label="כמה זמן יש לך" value={value} options={options} onChange={onChange} />
}

const HEAT_GLYPH_LEVEL = { calm: 1, balanced: 3, all: 5 }

export function HeatControl({ value, onChange }) {
  const options = ['calm', 'balanced', 'all'].map(heat => ({
    value: heat,
    content: (
      <>
        <HeatGlyph level={HEAT_GLYPH_LEVEL[heat]} className="shrink-0" />
        {HEAT_NAMES[heat]}
      </>
    ),
  }))
  return <Segmented label="רמת ריגוש" value={value} options={options} onChange={onChange} />
}
