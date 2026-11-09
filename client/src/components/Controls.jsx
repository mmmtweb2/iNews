import Segmented from './Segmented.jsx'
import { MINUTE_OPTIONS } from '../lib/prefs.js'
import { minutesLabel } from '../lib/format.js'

export function TimeControl({ value, onChange }) {
  const options = MINUTE_OPTIONS.map(minutes => ({ value: minutes, label: minutesLabel(minutes) }))
  return <Segmented label="כמה זמן יש לך" value={value} options={options} onChange={onChange} />
}
