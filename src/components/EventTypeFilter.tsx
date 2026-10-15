import { useEffect, useId, useRef, useState } from 'react'
import { EVENT_DEFINITIONS, type EventType } from '@/types/events'

type Props = {
  /** Types cochés. Set vide = aucun événement affiché. */
  selected: Set<EventType>
  onChange: (next: Set<EventType>) => void
}

export const ALL_EVENT_TYPES = EVENT_DEFINITIONS.map((d) => d.type)

export function EventTypeFilter({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const allSelected = selected.size === ALL_EVENT_TYPES.length
  const noneSelected = selected.size === 0
  const label = allSelected
    ? 'Tous les types'
    : noneSelected
      ? 'Aucun type'
      : selected.size === 1
        ? (EVENT_DEFINITIONS.find((d) => selected.has(d.type))?.label ??
          '1 type')
        : `${selected.size} types`

  const toggle = (type: EventType) => {
    const base = new Set(selected)
    if (base.has(type)) base.delete(type)
    else base.add(type)
    onChange(base)
  }

  return (
    <div className="type-filter" ref={rootRef}>
      <button
        type="button"
        className="type-filter__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="type-filter__label">{label}</span>
        <span className="type-filter__caret" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          className="type-filter__panel"
          id={listId}
          role="listbox"
          aria-multiselectable="true"
        >
          <div className="type-filter__actions">
            <button
              type="button"
              className="btn btn--ghost type-filter__action"
              onClick={() => onChange(new Set(ALL_EVENT_TYPES))}
            >
              Tous
            </button>
            <button
              type="button"
              className="btn btn--ghost type-filter__action"
              onClick={() => onChange(new Set())}
            >
              Rien
            </button>
            <button
              type="button"
              className="btn btn--ghost type-filter__action"
              onClick={() => setOpen(false)}
            >
              OK
            </button>
          </div>
          <ul className="type-filter__list">
            {EVENT_DEFINITIONS.map((def) => {
              const checked = selected.has(def.type)
              return (
                <li key={def.type}>
                  <label className="type-filter__option">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(def.type)}
                    />
                    <span
                      className="type-filter__swatch"
                      style={{ background: def.color }}
                    />
                    <span>{def.label}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
