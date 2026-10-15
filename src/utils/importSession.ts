import {
  DEFAULT_TEAM_NAMES,
  type RugbyEvent,
  type EventType,
  type PlayingTeam,
  type TeamSide,
} from '@/types/events'
import type { AnalysisSession } from '@/types/session'

const TEAM_SIDES = new Set(['home', 'away', 'neutral'])

function isEvent(value: unknown): value is RugbyEvent {
  if (!value || typeof value !== 'object') return false
  const ev = value as Record<string, unknown>
  return (
    typeof ev.id === 'string' &&
    typeof ev.type === 'string' &&
    typeof ev.timestamp === 'number' &&
    typeof ev.team === 'string' &&
    TEAM_SIDES.has(ev.team) &&
    typeof ev.createdAt === 'number'
  )
}

/**
 * Accepte :
 * - export session (Export JSON) : { id, name, videoFileName, events, ... }
 * - export résumé JSON : { events, sessionName?, videoFileName?, ... }
 */
export function parseSessionJson(raw: string): AnalysisSession {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Fichier JSON invalide')
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Format de session non reconnu')
  }

  const obj = data as Record<string, unknown>
  const eventsRaw = obj.events
  if (!Array.isArray(eventsRaw)) {
    throw new Error('Aucune liste « events » dans le fichier')
  }

  const events: RugbyEvent[] = []
  for (const item of eventsRaw) {
    if (!isEvent(item)) {
      throw new Error('Un événement du fichier a un format incorrect')
    }
    events.push({
      id: item.id,
      type: item.type as EventType,
      timestamp: item.timestamp,
      team: item.team as TeamSide,
      foulReason: typeof item.foulReason === 'string' ? item.foulReason : undefined,
      note: typeof item.note === 'string' ? item.note : undefined,
      createdAt: item.createdAt,
    })
  }

  const now = Date.now()
  const videoFileName =
    typeof obj.videoFileName === 'string'
      ? obj.videoFileName
      : null

  const name =
    (typeof obj.name === 'string' && obj.name) ||
    (typeof obj.sessionName === 'string' && obj.sessionName) ||
    videoFileName?.replace(/\.[^.]+$/, '') ||
    'Session importée'

  const teamNames = parseTeamNames(obj.teamNames)

  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : cryptoRandomId(),
    name,
    videoFileName,
    videoPath: typeof obj.videoPath === 'string' ? obj.videoPath : null,
    teamNames,
    events,
    createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : now,
    updatedAt: typeof obj.updatedAt === 'number' ? obj.updatedAt : now,
  }
}

function parseTeamNames(
  value: unknown,
): Record<PlayingTeam, string> {
  if (!value || typeof value !== 'object') return { ...DEFAULT_TEAM_NAMES }
  const obj = value as Record<string, unknown>
  const home =
    typeof obj.home === 'string' && obj.home.trim()
      ? obj.home.trim()
      : DEFAULT_TEAM_NAMES.home
  const away =
    typeof obj.away === 'string' && obj.away.trim()
      ? obj.away.trim()
      : DEFAULT_TEAM_NAMES.away
  return { home, away }
}

function cryptoRandomId(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (typeof c?.randomUUID === 'function') {
    try {
      return c.randomUUID()
    } catch {
      // fall through
    }
  }
  return `import-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export async function readSessionFile(file: File): Promise<AnalysisSession> {
  const text = await file.text()
  return parseSessionJson(text)
}
