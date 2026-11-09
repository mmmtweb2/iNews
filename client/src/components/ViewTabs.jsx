const TAB = 'relative -mb-px border-b-2 px-3 py-2.5 text-[0.9375rem] font-medium'

export default function ViewTabs({ view, onChange, unread }) {
  const tab = (id, label, extra) => (
    <button type="button" aria-current={view === id ? 'page' : undefined} onClick={() => onChange(id)} className={`${TAB} ${view === id ? 'border-ink text-ink' : 'border-transparent text-soft hover:text-ink'}`}>
      {label}
      {extra}
    </button>
  )
  return (
    <nav aria-label="תצוגה" className="flex gap-2 border-b border-rule">
      {tab('brief', 'הבריף')}
      {tab(
        'following',
        'במעקב',
        unread > 0 && (
          <>
            <span aria-hidden="true" className="ms-2 inline-block min-w-5 rounded-full bg-accent px-1.5 text-center text-xs font-semibold text-accent-ink">
              {unread}
            </span>
            <span className="sr-only"> ({unread} חדשים)</span>
          </>
        ),
      )}
    </nav>
  )
}
