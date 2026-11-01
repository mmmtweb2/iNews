import { HEAT_LABELS } from '../lib/format.js'

// Five bars that grow with intensity (like signal strength). The word is shown
// next to it for heavier stories, so colour is never the only signal.
export default function HeatGlyph({ level, showLabel = false, className = '' }) {
  const label = HEAT_LABELS[level]
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} style={{ '--heat': `var(--h${level})` }}>
      <svg viewBox="0 0 20 14" width="20" height="14" role={showLabel ? undefined : 'img'} aria-label={showLabel ? undefined : `רמת ריגוש: ${label}`} aria-hidden={showLabel ? 'true' : undefined}>
        {[0, 1, 2, 3, 4].map(i => {
          const height = 3 + i * 2.5
          const on = i < level
          return <rect key={i} x={i * 4} y={14 - height} width="2.6" height={height} rx="1" fill={on ? 'var(--heat)' : 'currentColor'} opacity={on ? 1 : 0.22} />
        })}
      </svg>
      {showLabel && <span className="font-medium" style={{ color: 'var(--heat)' }}>{label}</span>}
    </span>
  )
}
