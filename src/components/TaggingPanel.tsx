import { useState } from 'react'
import {
  EVENT_BY_TYPE,
  MATCH_PHASE_DEFINITIONS,
  type EventType,
  type PlayingTeam,
  type TeamSide,
} from '@/types/events'
import { formatTimestamp } from '@/utils/time'
import { TeamTagPad } from '@/components/TeamTagPad'
import { FoulReasonModal } from '@/components/FoulReasonModal'

type Props = {
  currentTime: number
  enabled: boolean
  teamNames: Record<PlayingTeam, string>
  eventCount: number
  onRenameTeam: (side: PlayingTeam, name: string) => void
  onTag: (type: EventType, team: TeamSide, foulReason?: string) => void
  onShowStats: () => void
  onCollapse?: () => void
}

export function TaggingPanel({
  currentTime,
  enabled,
  teamNames,
  eventCount,
  onRenameTeam,
  onTag,
  onShowStats,
  onCollapse,
}: Props) {
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
        <div className="tagging__header-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={onShowStats}
            disabled={eventCount === 0}
          >
            Voir le résumé
          </button>
          {onCollapse && (
            <button
              type="button"
              className="btn btn--ghost panel-toggle"
              onClick={onCollapse}
              title="Masquer le tagging"
              aria-label="Masquer le tagging"
            >
              ˅
            </button>
          )}
        </div>
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
