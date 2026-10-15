import { useEffect, useId, useRef, useState } from 'react'
import { EVENT_DEFINITIONS, type EventType } from '@/types/events'

type Props = {
  /** Set vide = tous les types affichés. */
  selected: Set<EventType>
  onChange: (next: Set<EventType>) => void
}

const ALL_TYPES = EVENT_DEFINITIONS.map((d) => d.type)

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

  const allSelected = selected.size === 0 || selected.size === ALL_TYPES.length
  const label = allSelected
    ? 'Tous les types'
    : selected.size === 1
      ? (EVENT_DEFINITIONS.find((d) => selected.has(d.type))?.label ?? '1 type')
      : `${selected.size} types`

  const toggle = (type: EventType) => {
    const base =
      selected.size === 0 ? new Set<EventType>(ALL_TYPES) : new Set(selected)
    if (base.has(type)) base.delete(type)
    else base.add(type)
    if (base.size === 0 || base.size === ALL_TYPES.length) {
      onChange(new Set())
      return
    }
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
              onClick={() => onChange(new Set())}
            >
              Tout
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
              const checked = allSelected || selected.has(def.type)
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
