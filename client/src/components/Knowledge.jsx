import { formatDate } from '../lib/format.js'

function Group({ title, items, tone }) {
  if (!items || !items.length) return null
  return (
    <div className="min-w-0">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden="true" className={`size-2 rounded-full ${tone}`} />
        {title}
      </h4>
      <ul className="mt-2 list-disc space-y-1.5 ps-5 text-[0.9375rem] leading-[1.7] marker:text-faint">
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

// What is established, what is only claimed, and what nobody knows yet. Kept apart on purpose,
// so a claim never reads like a fact.
export function KnowledgeBlock({ story }) {
  const { known, claimed, unknown } = story
  if (![known, claimed, unknown].some(list => list && list.length)) return null
  return (
    <div className="mt-5 grid max-w-[42rem] gap-5 rounded-xl bg-raised p-4 sm:p-5">
      <Group title="מה ידוע" items={known} tone="bg-accent" />
      <Group title="מה נטען, ועוד לא אושר" items={claimed} tone="bg-heat-3" />
      <Group title="מה עדיין לא ידוע" items={unknown} tone="border-2 border-faint" />
    </div>
  )
}

// How the story changed across refreshes, oldest first. Each step is the write-up as it was then.
export function Timeline({ story, open = false }) {
  const steps = story.timeline || []
  if (steps.length < 2) return null
  return (
    <details className="mt-4 max-w-[42rem]" open={open}>
      <summary className="cursor-pointer text-sm font-medium text-accent">איך הידיעה התפתחה ({steps.length} שלבים)</summary>
      <ol className="mt-3 list-none space-y-4 border-s-2 border-rule ps-4">
        {steps.map((step, index) => (
          <li key={`${step.at}:${index}`} className="relative">
            <span aria-hidden="true" className={`absolute -start-[1.4rem] top-2 size-2.5 rounded-full border-2 ${index === steps.length - 1 ? 'border-accent bg-accent' : 'border-faint bg-paper'}`} />
            <p className="text-xs text-soft">{formatDate(step.at)}{index === steps.length - 1 ? ', העדכני ביותר' : ''}</p>
            <p className="mt-0.5 text-[0.9375rem] font-medium leading-snug">{step.headline}</p>
            {step.summary && <p className="mt-1 text-[0.9375rem] leading-[1.7] text-soft">{step.summary}</p>}
            {step.note && <p className="mt-1 text-[0.8125rem] leading-snug text-soft">{step.note}</p>}
          </li>
        ))}
      </ol>
    </details>
  )
}
