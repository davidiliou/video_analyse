import { useMemo, useState } from 'react'
import type { PlayingTeam, RugbyEvent } from '@/types/events'
import {
  computeAllPeriodStats,
  formatPercent,
  type PeriodKey,
  type PeriodStats,
  type TeamStats,
} from '@/utils/stats'
import { formatTimestamp } from '@/utils/time'
import {
  exportSummaryCsv,
  exportSummaryJson,
  exportSummaryTxt,
} from '@/utils/exportSummary'
import { exportSummaryPdf } from '@/utils/exportSummaryPdf'

type Props = {
  open: boolean
  events: RugbyEvent[]
  teamNames: Record<PlayingTeam, string>
  videoFileName: string | null
  sessionName?: string
  onClose: () => void
}

function StatRow({
  label,
  left,
  right,
}: {
  label: string
  left: string | number
  right: string | number
}) {
  return (
    <div className="stats-row">
      <span className="stats-row__left">{left}</span>
      <span className="stats-row__label">{label}</span>
      <span className="stats-row__right">{right}</span>
    </div>
  )
}

function EffectivePlayBlock({ stats }: { stats: PeriodStats }) {
  const ep = stats.effectivePlay
  if (ep.segmentCount === 0 && !ep.openSegment) {
    return (
      <p className="modal__hint stats-half-hint">
        Tague « En jeu » / « Arrêté » pour mesurer le temps de jeu effectif.
      </p>
    )
  }

  return (
    <>
      <h3 className="stats-section-title">Temps de jeu effectif</h3>
      <div className="stats-table">
        <div className="stats-row stats-row--phase">
          <span className="stats-row__label stats-row__label--wide">
            Temps effectif
          </span>
          <span className="stats-row__right">
            {formatTimestamp(ep.totalSeconds)}
          </span>
        </div>
        <div className="stats-row stats-row--phase">
          <span className="stats-row__label stats-row__label--wide">
            Nombre de séquences
          </span>
          <span className="stats-row__right">{ep.segmentCount}</span>
        </div>
        <div className="stats-row stats-row--phase">
          <span className="stats-row__label stats-row__label--wide">
            Durée moyenne d’un temps de jeu
          </span>
          <span className="stats-row__right">
            {ep.averageSeconds === null
              ? '—'
              : formatTimestamp(ep.averageSeconds)}
          </span>
        </div>
        {ep.openSegment && (
          <p className="modal__hint stats-half-hint">
            Un segment « En jeu » est encore ouvert (pas de « Arrêté »).
          </p>
        )}
      </div>
    </>
  )
}

function PeriodBody({
  stats,
  teamNames,
}: {
  stats: PeriodStats
  teamNames: Record<PlayingTeam, string>
}) {
  const home = stats.home
  const away = stats.away

  return (
    <>
      <div className="stats-score">
        <div className="stats-score__team">
          <span className="stats-score__name">{teamNames.home}</span>
          <span className="stats-score__points">{stats.score.home}</span>
        </div>
        <span className="stats-score__sep">—</span>
        <div className="stats-score__team stats-score__team--right">
          <span className="stats-score__name">{teamNames.away}</span>
          <span className="stats-score__points">{stats.score.away}</span>
        </div>
      </div>
      <p className="modal__hint stats-score__hint">
        {stats.label}
        {stats.range.start !== null || stats.range.end !== null
          ? ` · ${stats.range.start === null ? '—' : formatTimestamp(stats.range.start)} → ${stats.range.end === null ? '—' : formatTimestamp(stats.range.end)}`
          : ''}
        {' · '}
        {stats.totalEvents} événement{stats.totalEvents > 1 ? 's' : ''}
      </p>

      <EffectivePlayBlock stats={stats} />
      <PeriodTables home={home} away={away} />
    </>
  )
}

function PeriodTables({ home, away }: { home: TeamStats; away: TeamStats }) {
  return (
    <>
      <h3 className="stats-section-title">Score</h3>
      <div className="stats-table">
        <StatRow label="Essais" left={home.essais} right={away.essais} />
        <StatRow
          label="Transformations"
          left={home.transformations}
          right={away.transformations}
        />
        <StatRow
          label="Transformations manquées"
          left={home.transformationsManquees}
          right={away.transformationsManquees}
        />
        <StatRow
          label="Pénalités réussies"
          left={home.penalites}
          right={away.penalites}
        />
        <StatRow
          label="Pénalités manquées"
          left={home.penalitesManquees}
          right={away.penalitesManquees}
        />
      </div>

      <h3 className="stats-section-title">Fautes</h3>
      <div className="stats-table">
        <StatRow label="En avant" left={home.enAvants} right={away.enAvants} />
        <StatRow
          label="Pénalités sifflées"
          left={home.penalitesSifflees}
          right={away.penalitesSifflees}
        />
        <StatRow
          label="Coups francs"
          left={home.coupsFrancs}
          right={away.coupsFrancs}
        />
      </div>

      <h3 className="stats-section-title">Conquête</h3>
      <div className="stats-table">
        <StatRow
          label="Touches gagnées"
          left={home.toucheGagnee}
          right={away.toucheGagnee}
        />
        <StatRow
          label="Touches perdues"
          left={home.touchePerdue}
          right={away.touchePerdue}
        />
        <StatRow
          label="% touches"
          left={formatPercent(home.toucheWinRate)}
          right={formatPercent(away.toucheWinRate)}
        />
        <StatRow
          label="Mêlées gagnées"
          left={home.meleeGagnee}
          right={away.meleeGagnee}
        />
        <StatRow
          label="Mêlées perdues"
          left={home.meleePerdue}
          right={away.meleePerdue}
        />
        <StatRow
          label="% mêlées"
          left={formatPercent(home.meleeWinRate)}
          right={formatPercent(away.meleeWinRate)}
        />
        <StatRow
          label="Rucks gagnés"
          left={home.ruckGagne}
          right={away.ruckGagne}
        />
        <StatRow
          label="Rucks perdus"
          left={home.ruckPerdu}
          right={away.ruckPerdu}
        />
        <StatRow
          label="% rucks"
          left={formatPercent(home.ruckWinRate)}
          right={formatPercent(away.ruckWinRate)}
        />
      </div>

      <h3 className="stats-section-title">Discipline</h3>
      <div className="stats-table">
        <StatRow
          label="Cartons jaunes"
          left={home.cartonJaune}
          right={away.cartonJaune}
        />
        <StatRow
          label="Cartons rouges"
          left={home.cartonRouge}
          right={away.cartonRouge}
        />
      </div>
    </>
  )
}

export function StatsSummary({
  open,
  events,
  teamNames,
  videoFileName,
  sessionName,
  onClose,
}: Props) {
  const periods = useMemo(() => computeAllPeriodStats(events), [events])
  const [tab, setTab] = useState<PeriodKey>('full')

  if (!open) return null

  const active = periods.find((p) => p.key === tab) ?? periods[0]
  const full = periods.find((p) => p.key === 'full')!
  const hasHalfMarkers =
    periods.some((p) => p.key === 'first_half') ||
    periods.some((p) => p.key === 'second_half')

  // Toujours repartir des events du rendu courant (evite un export stale).
  const getExportInput = () => ({
    events,
    teamNames,
    videoFileName,
    sessionName,
  })

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal modal--stats"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="stats-title" className="modal__title">
            Résumé de l’analyse
          </h2>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="modal__body">
          <div className="stats-tabs" role="tablist" aria-label="Période">
            {periods.map((p) => (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={active.key === p.key}
                className={`stats-tab${active.key === p.key ? ' stats-tab--active' : ''}`}
                onClick={() => setTab(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {!hasHalfMarkers && (
            <p className="modal__hint stats-half-hint">
              Tag « Fin MT » et « Début MT » pour obtenir les stats par mi-temps.
            </p>
          )}

          {full.phases.length > 0 && active.key === 'full' && (
            <>
              <h3 className="stats-section-title">Bornes du match</h3>
              <div className="stats-table">
                {full.phases.map((phase) => (
                  <div key={phase.type} className="stats-row stats-row--phase">
                    <span className="stats-row__label stats-row__label--wide">
                      {phase.label}
                    </span>
                    <span className="stats-row__right">
                      {formatTimestamp(phase.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <PeriodBody stats={active} teamNames={teamNames} />
        </div>

        <footer className="modal__footer modal__footer--stats">
          <div className="stats-export">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => exportSummaryPdf(getExportInput())}
            >
              Télécharger PDF
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => exportSummaryTxt(getExportInput())}
            >
              TXT
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => exportSummaryCsv(getExportInput())}
            >
              CSV
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => exportSummaryJson(getExportInput())}
            >
              JSON
            </button>
          </div>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Fermer
          </button>
        </footer>
      </div>
    </div>
  )
}
