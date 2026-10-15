import {
  EVENT_DEFINITIONS,
  EVENT_BY_TYPE,
  type EventDefinition,
  type EventType,
  type PlayingTeam,
} from '@/types/events'

type Props = {
  side: PlayingTeam
  teamName: string
  enabled: boolean
  onRename: (name: string) => void
  onTag: (type: EventType, team: PlayingTeam) => void
}

const GROUPS: Array<{ id: EventDefinition['group']; title: string }> = [
  { id: 'conquete', title: 'Conquête' },
  { id: 'score', title: 'Score' },
  { id: 'faute', title: 'Faute' },
  { id: 'discipline', title: 'Discipline' },
]

export function TeamTagPad({
  side,
  teamName,
  enabled,
  onRename,
  onTag,
}: Props) {
  return (
    <section className={`team-pad team-pad--${side}`}>
      <header className="team-pad__header">
        <input
          className="team-pad__name"
          value={teamName}
          onChange={(e) => onRename(e.target.value)}
          aria-label={side === 'home' ? 'Nom équipe gauche' : 'Nom équipe droite'}
        />
        <span className="team-pad__side">
          {side === 'home' ? 'Gauche' : 'Droite'}
        </span>
      </header>

      {GROUPS.map((group) => (
        <div key={group.id} className="team-pad__group">
          <h3 className="team-pad__group-title">{group.title}</h3>
          <div className="team-pad__buttons">
            {EVENT_DEFINITIONS.filter((d) => d.group === group.id).map((def) => (
              <button
                key={def.type}
                type="button"
                className="tag-btn"
                style={{ ['--tag-color' as string]: def.color }}
                disabled={!enabled}
                title={
                  EVENT_BY_TYPE[def.type].requiresReason
                    ? `${def.label} (choisir le motif)`
                    : def.label
                }
                onClick={() => onTag(def.type, side)}
              >
                {def.shortLabel ?? def.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
