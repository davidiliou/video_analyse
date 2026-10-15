import type { PlayingTeam, RugbyEvent } from '@/types/events'
import {
  computeAllPeriodStats,
  formatPercent,
  type PeriodStats,
  type TeamStats,
} from '@/utils/stats'
import { formatTimestamp } from '@/utils/time'

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function safeBaseName(name: string | null) {
  const base = (name || 'analyse').replace(/\.[^.]+$/, '')
  return base.replace(/[^\w.-]+/g, '_').slice(0, 80) || 'analyse'
}

function stamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
}

function rangeLabel(range: PeriodStats['range']): string {
  const start = range.start === null ? '—' : formatTimestamp(range.start)
  const end = range.end === null ? '—' : formatTimestamp(range.end)
  return `${start} → ${end}`
}

function teamBlock(name: string, t: TeamStats): string[] {
  return [
    `  ${name}`,
    `    Score estimé          : ${t.points}`,
    `    Essais                : ${t.essais}`,
    `    Transformations       : ${t.transformations} (manquées : ${t.transformationsManquees})`,
    `    Pénalités réussies    : ${t.penalites} (manquées : ${t.penalitesManquees})`,
    `    En avant              : ${t.enAvants}`,
    `    Pénalités sifflées    : ${t.penalitesSifflees}`,
    `    Coups francs          : ${t.coupsFrancs}`,
    `    Touches G/P           : ${t.toucheGagnee}/${t.touchePerdue} (${formatPercent(t.toucheWinRate)})`,
    `    Mêlées G/P            : ${t.meleeGagnee}/${t.meleePerdue} (${formatPercent(t.meleeWinRate)})`,
    `    Rucks G/P             : ${t.ruckGagne}/${t.ruckPerdu} (${formatPercent(t.ruckWinRate)})`,
    `    Cartons J/R           : ${t.cartonJaune}/${t.cartonRouge}`,
  ]
}

function periodSection(
  period: PeriodStats,
  teamNames: Record<PlayingTeam, string>,
): string {
  const lines = [
    `## ${period.label}`,
    `Plage : ${rangeLabel(period.range)}`,
    `Score : ${teamNames.home} ${period.score.home} — ${period.score.away} ${teamNames.away}`,
    `Événements : ${period.totalEvents}`,
    '',
    ...teamBlock(teamNames.home, period.home),
    '',
    ...teamBlock(teamNames.away, period.away),
    '',
  ]

  const reasons = [
    ...Object.entries(period.home.foulReasons).map(
      ([r, n]) => `    [${teamNames.home}] ${r} : ${n}`,
    ),
    ...Object.entries(period.away.foulReasons).map(
      ([r, n]) => `    [${teamNames.away}] ${r} : ${n}`,
    ),
  ]
  if (reasons.length > 0) {
    lines.push('  Motifs de faute :', ...reasons, '')
  }

  return lines.join('\n')
}

export function buildSummaryText(input: {
  events: RugbyEvent[]
  teamNames: Record<PlayingTeam, string>
  videoFileName: string | null
  sessionName?: string
}): string {
  const periods = computeAllPeriodStats(input.events)
  const full = periods.find((p) => p.key === 'full')!

  const header = [
    'Résumé d’analyse rugby',
    `Session : ${input.sessionName || input.videoFileName || 'Sans titre'}`,
    `Vidéo   : ${input.videoFileName || '—'}`,
    `Généré  : ${new Date().toLocaleString('fr-FR')}`,
    '',
    'Temps de jeu :',
    ...(full.phases.length > 0
      ? full.phases.map(
          (p) => `  - ${p.label} : ${formatTimestamp(p.timestamp)}`,
        )
      : ['  (aucun marqueur début/fin mi-temps — tague-les pour découper les MT)']),
    '',
  ]

  return `${header.join('\n')}${periods.map((p) => periodSection(p, input.teamNames)).join('\n')}`
}

export function exportSummaryTxt(input: {
  events: RugbyEvent[]
  teamNames: Record<PlayingTeam, string>
  videoFileName: string | null
  sessionName?: string
}) {
  const text = buildSummaryText(input)
  const filename = `${safeBaseName(input.videoFileName)}_resume_${stamp()}.txt`
  downloadBlob(
    filename,
    new Blob([text], { type: 'text/plain;charset=utf-8' }),
  )
}

export function exportSummaryCsv(input: {
  events: RugbyEvent[]
  teamNames: Record<PlayingTeam, string>
  videoFileName: string | null
}) {
  const periods = computeAllPeriodStats(input.events)
  const header = [
    'period',
    'period_label',
    'team',
    'team_name',
    'points',
    'essais',
    'transformations',
    'transformations_manquees',
    'penalites_reussies',
    'penalites_manquees',
    'en_avant',
    'penalites_sifflees',
    'coups_francs',
    'touche_gagnee',
    'touche_perdue',
    'touche_win_pct',
    'melee_gagnee',
    'melee_perdue',
    'melee_win_pct',
    'ruck_gagne',
    'ruck_perdu',
    'ruck_win_pct',
    'carton_jaune',
    'carton_rouge',
  ]

  const rows: string[] = []
  for (const period of periods) {
    for (const side of ['home', 'away'] as const) {
      const t = period[side]
      const pct = (rate: number | null) =>
        rate === null ? '' : String(Math.round(rate * 100))
      rows.push(
        [
          period.key,
          period.label,
          side,
          input.teamNames[side],
          t.points,
          t.essais,
          t.transformations,
          t.transformationsManquees,
          t.penalites,
          t.penalitesManquees,
          t.enAvants,
          t.penalitesSifflees,
          t.coupsFrancs,
          t.toucheGagnee,
          t.touchePerdue,
          pct(t.toucheWinRate),
          t.meleeGagnee,
          t.meleePerdue,
          pct(t.meleeWinRate),
          t.ruckGagne,
          t.ruckPerdu,
          pct(t.ruckWinRate),
          t.cartonJaune,
          t.cartonRouge,
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      )
    }
  }

  const csv = `\uFEFF${header.join(',')}\n${rows.join('\n')}\n`
  const filename = `${safeBaseName(input.videoFileName)}_resume_${stamp()}.csv`
  downloadBlob(filename, new Blob([csv], { type: 'text/csv;charset=utf-8' }))
}

export function exportSummaryJson(input: {
  events: RugbyEvent[]
  teamNames: Record<PlayingTeam, string>
  videoFileName: string | null
  sessionName?: string
}) {
  const periods = computeAllPeriodStats(input.events)
  const sortedEvents = [...input.events].sort((a, b) => a.timestamp - b.timestamp)
  const payload = {
    sessionName: input.sessionName || null,
    videoFileName: input.videoFileName,
    teamNames: input.teamNames,
    generatedAt: new Date().toISOString(),
    eventCount: sortedEvents.length,
    /** Liste complete des tags (y compris transformations ajoutees apres coup). */
    events: sortedEvents,
    periods,
  }
  const filename = `${safeBaseName(input.videoFileName)}_resume_${stamp()}.json`
  downloadBlob(
    filename,
    new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    }),
  )
}
