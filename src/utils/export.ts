import {
  EVENT_BY_TYPE,
  type PlayingTeam,
  type RugbyEvent,
} from '@/types/events'
import { formatTimestamp } from '@/utils/time'
import type { AnalysisSession } from '@/types/session'

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

export function exportSessionJson(session: AnalysisSession) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const filename = `${safeBaseName(session.videoFileName)}_${stamp}.json`
  const blob = new Blob([JSON.stringify(session, null, 2)], {
    type: 'application/json',
  })
  downloadBlob(filename, blob)
}

export function exportEventsCsv(
  events: RugbyEvent[],
  videoFileName: string | null,
  teamNames?: Record<PlayingTeam, string>,
) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const filename = `${safeBaseName(videoFileName)}_${stamp}.csv`
  const header = [
    'id',
    'type',
    'label',
    'foulReason',
    'timestamp',
    'timecode',
    'team',
    'team_name',
    'createdAt',
  ]
  const rows = [...events]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((ev) => {
      const label = EVENT_BY_TYPE[ev.type]?.label ?? ev.type
      const teamName =
        ev.team === 'neutral'
          ? 'Match'
          : (teamNames?.[ev.team] ?? ev.team)
      return [
        ev.id,
        ev.type,
        label,
        ev.foulReason ?? '',
        ev.timestamp.toFixed(3),
        formatTimestamp(ev.timestamp),
        ev.team,
        teamName,
        new Date(ev.createdAt).toISOString(),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    })

  const csv = `\uFEFF${header.join(',')}\n${rows.join('\n')}\n`
  downloadBlob(filename, new Blob([csv], { type: 'text/csv;charset=utf-8' }))
}
