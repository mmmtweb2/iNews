// A radio group drawn as a track with a sliding thumb. Arrow keys move the choice.
export default function Segmented({ label, value, options, onChange, small = false }) {
  const index = Math.max(0, options.findIndex(option => option.value === value))

  const onKeyDown = event => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    let step = 0
    if (event.key === 'ArrowLeft') step = rtl ? 1 : -1
    if (event.key === 'ArrowRight') step = rtl ? -1 : 1
    if (event.key === 'ArrowDown') step = 1
    if (event.key === 'ArrowUp') step = -1
    if (!step) return
    event.preventDefault()
    const next = options[(index + step + options.length) % options.length]
    onChange(next.value)
    event.currentTarget.querySelector(`[data-index="${options.indexOf(next)}"]`)?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={`seg ${small ? 'seg-sm' : ''}`} style={{ '--n': options.length, '--i': index }}>
      <span className="seg-thumb" aria-hidden="true" />
      {options.map((option, i) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          tabIndex={option.value === value ? 0 : -1}
          data-index={i}
          data-on={option.value === value}
          className="seg-option"
          onClick={() => onChange(option.value)}
        >
          {option.content ?? option.label}
        </button>
      ))}
    </div>
  )
}
