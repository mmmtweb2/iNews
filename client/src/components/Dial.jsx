import { DIAL_MAX } from '../lib/dials.js'

// The tone dial's thumb takes the colour of the intensity it picks; the others stay ink.
const TONE_COLOURS = ['var(--h1)', 'var(--h2)', 'var(--h3)', 'var(--h4)', 'var(--h5)']

// One style dial: a five-step slider between two named ends. It is a native range input, so
// arrow keys, Home/End, touch and screen readers all work; the position is announced by name.
export default function Dial({ id, value, onChange, copy }) {
  const inputId = `dial-${id}`
  const noteId = `${inputId}-note`
  return (
    <div className="dial-row">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-semibold">
          {copy.title}
        </label>
        <output htmlFor={inputId} className="text-sm font-medium text-accent">
          {copy.steps[value]}
        </output>
      </div>
      <div className="dial-wrap">
        <div className="dial-ticks" aria-hidden="true">
          {copy.steps.map((step, i) => (
            <span key={step} data-on={i === value} />
          ))}
        </div>
        <input
          id={inputId}
          type="range"
          min={0}
          max={DIAL_MAX}
          step={1}
          value={value}
          onChange={event => onChange(Number(event.target.value))}
          aria-valuetext={copy.steps[value]}
          aria-describedby={noteId}
          className="dial"
          style={id === 'tone' ? { '--thumb': TONE_COLOURS[value] } : undefined}
        />
      </div>
      <div className="flex justify-between text-xs text-soft" aria-hidden="true">
        <span>{copy.ends[0]}</span>
        <span>{copy.ends[1]}</span>
      </div>
      <p id={noteId} className="mt-1.5 min-h-[2.4em] text-[0.8125rem] leading-snug text-soft">
        {copy.notes[value]}
      </p>
    </div>
  )
}
