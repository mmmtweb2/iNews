import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import Segmented from './Segmented.jsx'

const STATES = [
  { value: 'follow', label: 'עוקב' },
  { value: 'normal', label: 'רגיל' },
  { value: 'mute', label: 'בלי' },
]

function setTopic(update, id, state) {
  update(previous => {
    const topics = { ...previous.topics }
    if (state === 'normal') delete topics[id]
    else topics[id] = state
    return { topics }
  })
}

// Quick pick for first-time setup: tap the topics you care about.
export function TopicChips({ topics, prefs, update }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="תחומי עניין">
      {topics.map(topic => {
        const on = prefs.topics[topic.id] === 'follow'
        return (
          <button
            key={topic.id}
            type="button"
            aria-pressed={on}
            onClick={() => setTopic(update, topic.id, on ? 'normal' : 'follow')}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${on ? 'border-accent bg-accent text-accent-ink' : 'border-rule text-soft hover:border-faint hover:text-ink'}`}
          >
            {topic.label}
          </button>
        )
      })}
    </div>
  )
}

// Full control: follow, leave neutral, or mute each topic.
export function TopicRows({ topics, prefs, update }) {
  return (
    <ul className="divide-y divide-rule">
      {topics.map(topic => (
        <li key={topic.id} className="flex items-center justify-between gap-4 py-2.5">
          <span className="text-[0.9375rem]">{topic.label}</span>
          <div className="w-44 shrink-0">
            <Segmented small label={topic.label} value={prefs.topics[topic.id] || 'normal'} options={STATES} onChange={state => setTopic(update, topic.id, state)} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// Words that should always rank higher: a company, a person, a place.
export function KeywordEditor({ prefs, update }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const word = draft.trim()
    if (!word) return
    update(previous => ({ keywords: [...previous.keywords, word] }))
    setDraft('')
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
          maxLength={30}
          aria-label="מילה למעקב"
          placeholder="למשל: בינה מלאכותית, מכבי, ריבית"
          className="min-w-0 flex-1 rounded-lg border border-rule bg-raised px-3 py-2 text-[0.9375rem] placeholder:text-faint"
        />
        <button type="button" onClick={add} className="inline-flex items-center gap-1 rounded-lg bg-ink px-3.5 text-sm font-medium text-paper">
          <Plus size={16} aria-hidden="true" />
          הוסף
        </button>
      </div>
      {prefs.keywords.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {prefs.keywords.map(word => (
            <li key={word} className="inline-flex items-center gap-1 rounded-full bg-[var(--track)] ps-3 pe-1.5 py-1 text-sm">
              {word}
              <button type="button" aria-label={`הסרת ${word}`} onClick={() => update(previous => ({ keywords: previous.keywords.filter(item => item !== word) }))} className="rounded-full p-1 text-soft hover:text-ink">
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
