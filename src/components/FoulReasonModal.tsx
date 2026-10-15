import { useEffect, useId, useState } from 'react'
import {
  EVENT_BY_TYPE,
  FOUL_REASONS,
  type EventType,
  type PlayingTeam,
} from '@/types/events'

type PendingFoul = {
  type: EventType
  team: PlayingTeam
  teamName: string
}

type Props = {
  pending: PendingFoul | null
  onCancel: () => void
  onConfirm: (reason: string) => void
}

export function FoulReasonModal({ pending, onCancel, onConfirm }: Props) {
  const selectId = useId()
  const [reason, setReason] = useState<string>(FOUL_REASONS[0])

  useEffect(() => {
    if (pending) setReason(FOUL_REASONS[0])
  }, [pending])

  if (!pending) return null

  const def = EVENT_BY_TYPE[pending.type]

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal modal--foul"
        role="dialog"
        aria-modal="true"
        aria-labelledby="foul-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="foul-title" className="modal__title">
            {def?.label ?? 'Faute'} — {pending.teamName}
          </h2>
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            ✕
          </button>
        </header>

        <div className="modal__body">
          <label className="foul-form__label" htmlFor={selectId}>
            Motif de la faute
          </label>
          <select
            id={selectId}
            className="foul-form__select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          >
            {FOUL_REASONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <p className="modal__hint">
            La sanction est attribuée à l’équipe fautive ({pending.teamName}).
          </p>
        </div>

        <footer className="modal__footer">
          <button type="button" className="btn" onClick={onCancel}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onConfirm(reason)}
          >
            Valider
          </button>
        </footer>
      </div>
    </div>
  )
}
