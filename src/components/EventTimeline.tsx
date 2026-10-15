import { useMemo, useState } from 'react'
import {
  EVENT_BY_TYPE,
  type EventType,
  type PlayingTeam,
  type RugbyEvent,
  type TeamSide,
} from '@/types/events'
import { formatTimestamp } from '@/utils/time'
import { EventTypeFilter } from '@/components/EventTypeFilter'

type Props = {
  events: RugbyEvent[]
  teamNames: Record<PlayingTeam, string>
  onSeek: (time: number) => void
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

export function EventTimeline({
  events,
  teamNames,
  onSeek,
  onDelete,
  onCollapse,
}: Props) {
  const [typeFilter, setTypeFilter] = useState<Set<EventType>>(new Set())

  const filtered = useMemo(() => {
    const list =
      typeFilter.size === 0
        ? events
        : events.filter((ev) => typeFilter.has(ev.type))
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
                  <button
                    type="button"
                    className="event-list__seek"
                    onClick={() => onSeek(ev.timestamp)}
                    title="Aller à cet instant"
                  >
                    <span
                      className="event-list__dot"
                      style={{ background: def?.color ?? '#888' }}
                    />
                    <span className="event-list__time">
                      {formatTimestamp(ev.timestamp)}
                    </span>
                    <span className="event-list__label">{label}</span>
                    <span className="event-list__team">
                      {teamLabel(ev.team, teamNames)}
                    </span>
                  </button>
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
