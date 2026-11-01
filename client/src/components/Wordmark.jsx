import { BRAND } from '../brand.js'

export default function Wordmark({ className = 'text-[1.7rem]' }) {
  return (
    <span className={`wordmark ${className}`}>
      <span className="sr-only">{BRAND.name}</span>
      <span aria-hidden="true">
        <span className="wordmark-i">
          ı<span className="wordmark-dot" />
        </span>
        News
      </span>
    </span>
  )
}
