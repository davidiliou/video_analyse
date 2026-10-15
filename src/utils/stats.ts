import {
  EFFECTIVE_PLAY_TYPES,
  EVENT_DEFINITIONS,
  MATCH_BOUNDARY_TYPES,
  MATCH_PHASE_DEFINITIONS,
  POINTS_BY_TYPE,
  type EventType,
  type PlayingTeam,
  type RugbyEvent,
} from '@/types/events'

export type TeamStats = {
  team: PlayingTeam
  counts: Record<EventType, number>
  points: number
  essais: number
  transformations: number
  transformationsManquees: number
  penalites: number
  penalitesManquees: number
  enAvants: number
  penalitesSifflees: number
  coupsFrancs: number
  cartonJaune: number
  cartonRouge: number
  toucheGagnee: number
  touchePerdue: number
  meleeGagnee: number
  meleePerdue: number
  ruckGagne: number
  ruckPerdu: number
  toucheWinRate: number | null
  meleeWinRate: number | null
  ruckWinRate: number | null
  foulReasons: Record<string, number>
}

export type MatchPhaseStamp = {
  type: EventType
  label: string
  timestamp: number
}

export type MatchStats = {
  home: TeamStats
  away: TeamStats
  totalEvents: number
  score: { home: number; away: number }
  phases: MatchPhaseStamp[]
}

export type EffectivePlayStats = {
  /** Somme des segments ballon en jeu (secondes). */
  totalSeconds: number
  /** Nombre de segments complets. */
  segmentCount: number
  /** Durée moyenne d’un temps de jeu (secondes), ou null. */
  averageSeconds: number | null
  /** Un segment « en jeu » n’a pas encore été refermé. */
  openSegment: boolean
}

export type PeriodKey = 'first_half' | 'second_half' | 'full'

export type PeriodStats = MatchStats & {
  key: PeriodKey
  label: string
  range: { start: number | null; end: number | null }
  effectivePlay: EffectivePlayStats
}

/** Marqueurs exclus des stats d’équipe. */
const NON_TEAM_TYPES = new Set<EventType>([
  ...MATCH_BOUNDARY_TYPES,
  ...EFFECTIVE_PLAY_TYPES,
])

const AUTO_CLOSE_TYPES = new Set<EventType>([
  'jeu_arrete',
  'fin_mi_temps',
  'fin_match',
])

function emptyCounts(): Record<EventType, number> {
  return Object.fromEntries(
    EVENT_DEFINITIONS.map((d) => [d.type, 0]),
  ) as Record<EventType, number>
}

function winRate(won: number, lost: number): number | null {
  const total = won + lost
  if (total === 0) return null
  return won / total
}

function buildTeamStats(team: PlayingTeam, events: RugbyEvent[]): TeamStats {
  const counts = emptyCounts()
  const foulReasons: Record<string, number> = {}
  let points = 0

  for (const ev of events) {
    if (ev.team !== team) continue
    counts[ev.type] += 1
    points += POINTS_BY_TYPE[ev.type] ?? 0
    if (ev.foulReason) {
      foulReasons[ev.foulReason] = (foulReasons[ev.foulReason] ?? 0) + 1
    }
  }

  const toucheGagnee = counts.touche_gagnee
  const touchePerdue = counts.touche_perdue
  const meleeGagnee = counts.melee_gagnee
  const meleePerdue = counts.melee_perdue
  const ruckGagne = counts.ruck_gagne
  const ruckPerdu = counts.ruck_perdu

  return {
    team,
    counts,
    points,
    essais: counts.essai,
    transformations: counts.transformation,
    transformationsManquees: counts.transformation_manquee,
    penalites: counts.penalite,
    penalitesManquees: counts.penalite_manquee,
    enAvants: counts.en_avant,
    penalitesSifflees: counts.penalite_sifflee,
    coupsFrancs: counts.coup_franc,
    cartonJaune: counts.carton_jaune,
    cartonRouge: counts.carton_rouge,
    toucheGagnee,
    touchePerdue,
    meleeGagnee,
    meleePerdue,
    ruckGagne,
    ruckPerdu,
    toucheWinRate: winRate(toucheGagnee, touchePerdue),
    meleeWinRate: winRate(meleeGagnee, meleePerdue),
    ruckWinRate: winRate(ruckGagne, ruckPerdu),
    foulReasons,
  }
}

function extractPhases(events: RugbyEvent[]): MatchPhaseStamp[] {
  const phases: MatchPhaseStamp[] = []
  for (const def of MATCH_PHASE_DEFINITIONS) {
    const matches = events
      .filter((ev) => ev.type === def.type)
      .sort((a, b) => a.timestamp - b.timestamp)
    const last = matches[matches.length - 1]
    if (last) {
      phases.push({
        type: def.type,
        label: def.label,
        timestamp: last.timestamp,
      })
    }
  }
  return phases
}

function phaseTime(phases: MatchPhaseStamp[], type: EventType): number | null {
  return phases.find((p) => p.type === type)?.timestamp ?? null
}

/**
 * Temps de jeu effectif = somme des intervalles « Ballon en jeu » → « Ballon arrêté ».
 * Un segment ouvert est refermé automatiquement par Fin MT / Fin match,
 * ou par la borne `range.end` si fournie.
 */
export function computeEffectivePlay(
  events: RugbyEvent[],
  range?: { start: number | null; end: number | null },
): EffectivePlayStats {
  const rangeStart = range?.start ?? null
  const rangeEnd = range?.end ?? null

  const relevant = events
    .filter((ev) => {
      if (
        ev.type !== 'jeu_repris' &&
        !AUTO_CLOSE_TYPES.has(ev.type)
      ) {
        return false
      }
      if (rangeStart !== null && ev.timestamp < rangeStart) return false
      if (rangeEnd !== null && ev.timestamp > rangeEnd) return false
      return true
    })
    .sort(
      (a, b) =>
        a.timestamp - b.timestamp || a.createdAt - b.createdAt,
    )

  let openAt: number | null = null
  const segments: number[] = []

  for (const ev of relevant) {
    if (ev.type === 'jeu_repris') {
      if (openAt === null) openAt = ev.timestamp
      continue
    }
    if (AUTO_CLOSE_TYPES.has(ev.type) && openAt !== null) {
      const dur = ev.timestamp - openAt
      if (dur > 0) segments.push(dur)
      openAt = null
    }
  }

  if (openAt !== null && rangeEnd !== null && rangeEnd > openAt) {
    segments.push(rangeEnd - openAt)
    openAt = null
  }

  const totalSeconds = segments.reduce((sum, d) => sum + d, 0)
  const segmentCount = segments.length

  return {
    totalSeconds,
    segmentCount,
    averageSeconds: segmentCount > 0 ? totalSeconds / segmentCount : null,
    openSegment: openAt !== null,
  }
}

export function computeMatchStats(events: RugbyEvent[]): MatchStats {
  // Les marqueurs de phase / chrono ne comptent pas dans les stats d'équipe.
  const playing = events.filter((ev) => !NON_TEAM_TYPES.has(ev.type))
  const home = buildTeamStats('home', playing)
  const away = buildTeamStats('away', playing)
  const phases = extractPhases(events)

  return {
    home,
    away,
    totalEvents: playing.length,
    score: { home: home.points, away: away.points },
    phases,
  }
}

/** Découpe les événements en 1re / 2e mi-temps via les tags de temps de jeu. */
export function splitEventsByHalf(events: RugbyEvent[]): {
  firstHalf: RugbyEvent[]
  secondHalf: RugbyEvent[]
  ranges: {
    first: { start: number | null; end: number | null }
    second: { start: number | null; end: number | null }
  }
  phases: MatchPhaseStamp[]
} {
  const phases = extractPhases(events)
  const debut = phaseTime(phases, 'debut_match')
  const finMt = phaseTime(phases, 'fin_mi_temps')
  const debutMt = phaseTime(phases, 'debut_mi_temps')
  const fin = phaseTime(phases, 'fin_match')

  const firstStart = debut ?? 0
  const firstEnd = finMt ?? debutMt
  const secondStart = debutMt ?? finMt
  const secondEnd = fin

  const isPlayingEvent = (ev: RugbyEvent) => !NON_TEAM_TYPES.has(ev.type)

  const firstHalf = events.filter((ev) => {
    if (!isPlayingEvent(ev)) return false
    if (firstEnd === null) {
      // Pas de marqueur de fin de MT : toute la partie « jeu » avant 2e MT éventuelle
      if (secondStart !== null) return ev.timestamp < secondStart
      return ev.timestamp >= firstStart
    }
    return ev.timestamp >= firstStart && ev.timestamp <= firstEnd
  })

  const secondHalf =
    secondStart === null
      ? []
      : events.filter((ev) => {
          if (!isPlayingEvent(ev)) return false
          if (secondEnd === null) return ev.timestamp >= secondStart
          return ev.timestamp >= secondStart && ev.timestamp <= secondEnd
        })

  return {
    firstHalf,
    secondHalf,
    ranges: {
      first: { start: debut, end: firstEnd },
      second: { start: secondStart, end: secondEnd },
    },
    phases,
  }
}

export function computeAllPeriodStats(events: RugbyEvent[]): PeriodStats[] {
  const full = computeMatchStats(events)
  const { firstHalf, secondHalf, ranges, phases } = splitEventsByHalf(events)

  const fullRange = {
    start: phaseTime(phases, 'debut_match'),
    end: phaseTime(phases, 'fin_match'),
  }

  const periods: PeriodStats[] = [
    {
      ...full,
      key: 'full',
      label: 'Match entier',
      range: fullRange,
      phases,
      effectivePlay: computeEffectivePlay(events, fullRange),
    },
  ]

  if (ranges.first.end !== null || firstHalf.length > 0) {
    const stats = computeMatchStats(firstHalf)
    periods.push({
      ...stats,
      key: 'first_half',
      label: '1re mi-temps',
      range: ranges.first,
      phases,
      effectivePlay: computeEffectivePlay(events, ranges.first),
    })
  }

  if (ranges.second.start !== null || secondHalf.length > 0) {
    const stats = computeMatchStats(secondHalf)
    periods.push({
      ...stats,
      key: 'second_half',
      label: '2e mi-temps',
      range: ranges.second,
      phases,
      effectivePlay: computeEffectivePlay(events, ranges.second),
    })
  }

  return periods
}

export function formatPercent(rate: number | null): string {
  if (rate === null) return '—'
  return `${Math.round(rate * 100)} %`
}
