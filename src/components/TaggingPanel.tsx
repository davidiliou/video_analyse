import { useState } from 'react'
import {
  EVENT_BY_TYPE,
  MATCH_PHASE_DEFINITIONS,
  type EventType,
  type PlayingTeam,
  type RugbyEvent,
  type TeamSide,
} from '@/types/events'
import { formatTimestamp } from '@/utils/time'
import { TeamTagPad } from '@/components/TeamTagPad'
import { FoulReasonModal } from '@/components/FoulReasonModal'

type Props = {
  events: RugbyEvent[]
  currentTime: number
  enabled: boolean
  teamNames: Record<PlayingTeam, string>
  onRenameTeam: (side: PlayingTeam, name: string) => void
  onTag: (type: EventType, team: TeamSide, foulReason?: string) => void
  onSeek: (time: number) => void
  onDelete: (id: string) => void
  onShowStats: () => void
}

function teamLabel(
  team: TeamSide,
  teamNames: Record<PlayingTeam, string>,
): string {
  if (team === 'neutral') return 'Match'
  return teamNames[team] ?? team
}

export function TaggingPanel({
  events,
  currentTime,
  enabled,
  teamNames,
  onRenameTeam,
  onTag,
  onSeek,
  onDelete,
  onShowStats,
}: Props) {
  const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp)
  const [pendingFoul, setPendingFoul] = useState<{
    type: EventType
    team: PlayingTeam
    teamName: string
  } | null>(null)

  const handleTeamTag = (type: EventType, team: PlayingTeam) => {
    const def = EVENT_BY_TYPE[type]
    if (def?.requiresReason) {
      setPendingFoul({ type, team, teamName: teamNames[team] })
      return
    }
    onTag(type, team)
  }

  return (
    <section className="tagging">
      <header className="tagging__header">
        <div>
          <h2 className="tagging__title">Tagging équipes</h2>
          <p className="tagging__subtitle">
            {enabled
              ? `Position : ${formatTimestamp(currentTime)} — clique un bouton pour taguer`
              : 'Ouvre une vidéo pour activer le tagging'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={onShowStats}
          disabled={events.length === 0}
        >
          Voir le résumé
        </button>
      </header>

      <div className="match-phases">
        <h3 className="match-phases__title">Temps de jeu</h3>
        <div className="match-phases__buttons">
          {MATCH_PHASE_DEFINITIONS.map((def) => (
            <button
              key={def.type}
              type="button"
              className="tag-btn"
              style={{ ['--tag-color' as string]: def.color }}
              disabled={!enabled}
              onClick={() => onTag(def.type, 'neutral')}
              title={def.label}
            >
              {def.shortLabel ?? def.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tagging__boards">
        <TeamTagPad
          side="home"
          teamName={teamNames.home}
          enabled={enabled}
          onRename={(name) => onRenameTeam('home', name)}
          onTag={handleTeamTag}
        />
        <TeamTagPad
          side="away"
          teamName={teamNames.away}
          enabled={enabled}
          onRename={(name) => onRenameTeam('away', name)}
          onTag={handleTeamTag}
        />
      </div>

      <div className="tagging__list-wrap">
        {sorted.length === 0 ? (
          <p className="tagging__empty">
            Aucun événement. Utilise les boutons de temps de jeu ou d’équipe.
          </p>
        ) : (
          <ul className="event-list">
            {sorted.map((ev) => {
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

      <FoulReasonModal
        pending={pendingFoul}
        onCancel={() => setPendingFoul(null)}
        onConfirm={(reason) => {
          if (!pendingFoul) return
          onTag(pendingFoul.type, pendingFoul.team, reason)
          setPendingFoul(null)
        }}
      />
    </section>
  )
}
