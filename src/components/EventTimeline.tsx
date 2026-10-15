import { useMemo, useState, type KeyboardEvent } from 'react'
import {
  EVENT_BY_TYPE,
  type EventType,
  type PlayingTeam,
  type RugbyEvent,
  type TeamSide,
} from '@/types/events'
import { formatTimestamp, parseTimestamp } from '@/utils/time'
import {
  ALL_EVENT_TYPES,
  EventTypeFilter,
} from '@/components/EventTypeFilter'

type Props = {
  events: RugbyEvent[]
  teamNames: Record<PlayingTeam, string>
  onSeek: (time: number) => void
  onUpdateTimestamp: (id: string, timestamp: number) => void
  onDelete: (id: string) => void
  onCollapse?: () => void
}

function teamLabel(
  team: TeamSide,
  teamNames: Record<PlayingTeam, string>,
): string {
  if (team === 'neutral') return 'Match'
  return teamNames[team] ?? team
}

function EventTimeControl({
  timestamp,
  onChange,
  onSeek,
}: {
  timestamp: number
  onChange: (next: number) => void
  onSeek: (time: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(formatTimestamp(timestamp))

  const commit = (raw: string) => {
    const parsed = parseTimestamp(raw)
    setEditing(false)
    if (parsed === null) {
      setDraft(formatTimestamp(timestamp))
      return
    }
    const next = Math.max(0, parsed)
    if (Math.abs(next - timestamp) < 0.001) {
      setDraft(formatTimestamp(timestamp))
      onSeek(timestamp)
      return
    }
    onChange(next)
  }

  const nudge = (delta: number) => {
    onChange(Math.max(0, timestamp + delta))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(draft)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setDraft(formatTimestamp(timestamp))
      setEditing(false)
    }
  }

  return (
    <div
      className="event-list__time-control"
      onClick={(e) => e.stopPropagation()}
      title="Ajuster le timecode (−1s / +1s)"
    >
      <button
        type="button"
        className="event-list__nudge"
        onClick={() => nudge(-1)}
        title="Reculer d’1 seconde"
        aria-label="Reculer d’1 seconde"
      >
        −1s
      </button>
      {editing ? (
        <input
          className="event-list__time-input"
          value={draft}
          autoFocus
          aria-label="Timecode du tag"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={onKeyDown}
        />
      ) : (
        <button
          type="button"
          className="event-list__time"
          title="Cliquer pour saisir un timecode (mm:ss)"
          onClick={() => {
            setDraft(formatTimestamp(timestamp))
            setEditing(true)
            onSeek(timestamp)
          }}
        >
          {formatTimestamp(timestamp)}
        </button>
      )}
      <button
        type="button"
        className="event-list__nudge"
        onClick={() => nudge(1)}
        title="Avancer d’1 seconde"
        aria-label="Avancer d’1 seconde"
      >
        +1s
      </button>
    </div>
  )
}

export function EventTimeline({
  events,
  teamNames,
  onSeek,
  onUpdateTimestamp,
  onDelete,
  onCollapse,
}: Props) {
  const [typeFilter, setTypeFilter] = useState<Set<EventType>>(
    () => new Set(ALL_EVENT_TYPES),
  )

  const filtered = useMemo(() => {
    const list = events.filter((ev) => typeFilter.has(ev.type))
    return [...list].sort((a, b) => b.timestamp - a.timestamp)
  }, [events, typeFilter])

  return (
    <aside className="event-timeline" aria-label="Timeline des événements">
      <header className="event-timeline__header">
        <div className="event-timeline__title-row">
          <h2 className="event-timeline__title">Événements</h2>
          <div className="event-timeline__title-actions">
            <span className="event-timeline__count">
              {filtered.length}
              {filtered.length !== events.length ? ` / ${events.length}` : ''}
            </span>
            {onCollapse && (
              <button
                type="button"
                className="btn btn--ghost panel-toggle"
                onClick={onCollapse}
                title="Masquer le panneau"
                aria-label="Masquer les événements"
              >
                ⟨
              </button>
            )}
          </div>
        </div>
        <EventTypeFilter selected={typeFilter} onChange={setTypeFilter} />
      </header>

      <div className="event-timeline__list-wrap">
        {events.length === 0 ? (
          <p className="event-timeline__empty">
            Aucun événement. Tague pendant la lecture.
          </p>
        ) : filtered.length === 0 ? (
          <p className="event-timeline__empty">
            Aucun événement pour ce filtre.
          </p>
        ) : (
          <ul className="event-list">
            {filtered.map((ev) => {
              const def = EVENT_BY_TYPE[ev.type]
              const label = ev.foulReason
                ? `${def?.label ?? ev.type} — ${ev.foulReason}`
                : (def?.label ?? ev.type)
              return (
                <li key={ev.id} className="event-list__item">
                  <div className="event-list__row">
                    <span
                      className="event-list__dot"
                      style={{ background: def?.color ?? '#888' }}
                    />
                    <EventTimeControl
                      timestamp={ev.timestamp}
                      onSeek={onSeek}
                      onChange={(next) => onUpdateTimestamp(ev.id, next)}
                    />
                    <button
                      type="button"
                      className="event-list__seek"
                      onClick={() => onSeek(ev.timestamp)}
                      title="Aller à cet instant"
                    >
                      <span className="event-list__label">{label}</span>
                      <span className="event-list__team">
                        {teamLabel(ev.team, teamNames)}
                      </span>
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => onDelete(ev.id)}
                    aria-label="Supprimer"
                  >
                    ✕
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
