import type { PlayingTeam, RugbyEvent } from '@/types/events'

const DRAFT_KEY = 'video-analyse:draft'

export type DraftState = {
  sessionId: string | null
  sessionName: string
  videoFileName: string | null
  teamNames?: Record<PlayingTeam, string>
  events: RugbyEvent[]
  updatedAt: number
}

export function saveDraft(draft: DraftState) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // quota / private mode
  }
}

export function loadDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DraftState
    if (!parsed || !Array.isArray(parsed.events)) return null
    return parsed
  } catch {
    return null
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}
