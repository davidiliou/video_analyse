import type { RugbyEvent } from './events'

/** Session d’analyse persistée (sans la vidéo binaire). */
export interface AnalysisSession {
  id: string
  name: string
  videoFileName: string | null
  /** Chemin local (Electron uniquement). */
  videoPath?: string | null
  events: RugbyEvent[]
  createdAt: number
  updatedAt: number
}

export type SessionSummary = Pick<
  AnalysisSession,
  'id' | 'name' | 'videoFileName' | 'createdAt' | 'updatedAt'
> & { eventCount: number }
