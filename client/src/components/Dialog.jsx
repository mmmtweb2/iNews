import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// Native <dialog>: focus trapping, Escape to close and the backdrop come from the browser.
export default function Dialog({ open, onClose, title, children, footer }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onClose={onClose}
      onClick={event => {
        if (event.target === ref.current) onClose()
      }}
    >
      {open && (
        <>
          <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-2 sm:px-6">
            <h2 className="font-serif text-xl font-semibold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="סגירה" className="-m-2 rounded-full p-2 text-soft hover:bg-[var(--track)] hover:text-ink">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
          {footer && <div className="border-t border-rule px-5 py-4 sm:px-6">{footer}</div>}
        </>
      )}
    </dialog>
  )
}
