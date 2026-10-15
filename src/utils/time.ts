/** Formate un temps en secondes → mm:ss ou hh:mm:ss. */
export function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'

  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

/**
 * Parse un timecode saisi : `mm:ss`, `hh:mm:ss`, ou secondes (`83` / `83.5`).
 * Retourne `null` si invalide.
 */
export function parseTimestamp(input: string): number | null {
  const raw = input.trim().replace(',', '.')
  if (!raw) return null

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? n : null
  }

  const parts = raw.split(':')
  if (parts.length < 2 || parts.length > 3) return null
  if (!parts.every((p) => /^\d+(\.\d+)?$/.test(p))) return null

  const nums = parts.map(Number)
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null

  let seconds = 0
  if (nums.length === 2) {
    const [m, s] = nums
    if (s >= 60) return null
    seconds = m * 60 + s
  } else {
    const [h, m, s] = nums
    if (m >= 60 || s >= 60) return null
    seconds = h * 3600 + m * 60 + s
  }

  return seconds >= 0 ? seconds : null
}
