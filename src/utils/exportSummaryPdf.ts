import { jsPDF } from 'jspdf'
import type { PlayingTeam, RugbyEvent } from '@/types/events'
import {
  computeAllPeriodStats,
  formatPercent,
  type PeriodStats,
  type TeamStats,
} from '@/utils/stats'
import { formatTimestamp } from '@/utils/time'

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

type Rgb = [number, number, number]

const COLORS = {
  ink: [25, 32, 40] as Rgb,
  muted: [100, 112, 128] as Rgb,
  line: [220, 226, 232] as Rgb,
  card: [248, 250, 252] as Rgb,
  accent: [26, 138, 128] as Rgb,
  home: [61, 139, 253] as Rgb,
  away: [239, 71, 111] as Rgb,
  white: [255, 255, 255] as Rgb,
}

function setFill(doc: jsPDF, rgb: Rgb) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
}

function setDraw(doc: jsPDF, rgb: Rgb) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2])
}

function setText(doc: jsPDF, rgb: Rgb) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

function drawRoundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: Rgb,
  stroke?: Rgb,
) {
  setFill(doc, fill)
  if (stroke) {
    setDraw(doc, stroke)
    doc.roundedRect(x, y, w, h, r, r, 'FD')
  } else {
    doc.roundedRect(x, y, w, h, r, r, 'F')
  }
}

function truncate(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text
  let t = text
  while (t.length > 1 && doc.getTextWidth(t + '...') > maxWidth) {
    t = t.slice(0, -1)
  }
  return t + '...'
}

/** Ligne stats : valeur gauche | libelle | valeur droite (sans chevauchement). */
function row(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  label: string,
  left: string,
  right: string,
  alt: boolean,
) {
  const rowH = 5
  if (alt) {
    setFill(doc, [242, 246, 249])
    doc.rect(x, y - 3.1, w, rowH, 'F')
  }

  const valueW = Math.min(14, w * 0.22)
  const labelX = x + valueW + 1
  const labelW = w - 2 * valueW - 2

  setText(doc, COLORS.home)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(left, x + valueW - 1, y, { align: 'right' })

  setText(doc, COLORS.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.text(truncate(doc, label, labelW), labelX + labelW / 2, y, {
    align: 'center',
  })

  setText(doc, COLORS.away)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(right, x + w - valueW + 1, y)
}

function drawPeriodCard(
  doc: jsPDF,
  period: PeriodStats,
  teamNames: Record<PlayingTeam, string>,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  drawRoundedRect(doc, x, y, w, h, 3, COLORS.card, COLORS.line)

  // Title bar
  setFill(doc, COLORS.accent)
  doc.roundedRect(x, y, w, 10, 3, 3, 'F')
  doc.rect(x, y + 5, w, 5, 'F')
  setText(doc, COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(period.label.toUpperCase(), x + w / 2, y + 6.5, { align: 'center' })

  let cy = y + 14
  setText(doc, COLORS.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.text(rangeLabel(period.range), x + w / 2, cy, { align: 'center' })

  // Score
  cy += 8
  const scoreY = cy
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  setText(doc, COLORS.home)
  doc.text(String(period.score.home), x + w * 0.28, scoreY, { align: 'center' })
  setText(doc, COLORS.muted)
  doc.setFontSize(12)
  doc.text('—', x + w / 2, scoreY - 1, { align: 'center' })
  setText(doc, COLORS.away)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(String(period.score.away), x + w * 0.72, scoreY, { align: 'center' })

  cy += 4
  setText(doc, COLORS.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.text(
    truncate(doc, teamNames.home, w * 0.4),
    x + w * 0.28,
    cy,
    { align: 'center' },
  )
  doc.text(
    truncate(doc, teamNames.away, w * 0.4),
    x + w * 0.72,
    cy,
    { align: 'center' },
  )

  cy += 6
  setDraw(doc, COLORS.line)
  doc.setLineWidth(0.3)
  doc.line(x + 4, cy, x + w - 4, cy)

  const home = period.home
  const away = period.away
  // Meme detail que le resume web (lignes separees pour les transfo).
  const rows: Array<[string, string, string]> = [
    ['Essais', String(home.essais), String(away.essais)],
    ['Transformations', String(home.transformations), String(away.transformations)],
    [
      'Transfo. manquees',
      String(home.transformationsManquees),
      String(away.transformationsManquees),
    ],
    ['Penalites reussies', String(home.penalites), String(away.penalites)],
    [
      'Penalites manquees',
      String(home.penalitesManquees),
      String(away.penalitesManquees),
    ],
    ['En avant', String(home.enAvants), String(away.enAvants)],
    ['Penalites sifflees', String(home.penalitesSifflees), String(away.penalitesSifflees)],
    ['Coups francs', String(home.coupsFrancs), String(away.coupsFrancs)],
    [
      'Touches G/P',
      `${home.toucheGagnee}/${home.touchePerdue}`,
      `${away.toucheGagnee}/${away.touchePerdue}`,
    ],
    [
      '% touches',
      formatPercent(home.toucheWinRate),
      formatPercent(away.toucheWinRate),
    ],
    [
      'Melees G/P',
      `${home.meleeGagnee}/${home.meleePerdue}`,
      `${away.meleeGagnee}/${away.meleePerdue}`,
    ],
    [
      '% melees',
      formatPercent(home.meleeWinRate),
      formatPercent(away.meleeWinRate),
    ],
    [
      'Rucks G/P',
      `${home.ruckGagne}/${home.ruckPerdu}`,
      `${away.ruckGagne}/${away.ruckPerdu}`,
    ],
    ['% rucks', formatPercent(home.ruckWinRate), formatPercent(away.ruckWinRate)],
    [
      'Cartons J/R',
      `${home.cartonJaune}/${home.cartonRouge}`,
      `${away.cartonJaune}/${away.cartonRouge}`,
    ],
  ]

  cy += 5
  // En-tete colonnes equipes
  setText(doc, COLORS.home)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.text('Gauche', x + 12, cy)
  setText(doc, COLORS.away)
  doc.text('Droite', x + w - 12, cy, { align: 'right' })
  cy += 5

  rows.forEach(([label, l, r], i) => {
    row(doc, x + 2, cy, w - 4, label, l, r, i % 2 === 0)
    cy += 5
  })

  setText(doc, COLORS.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.text(
    `${period.totalEvents} événement${period.totalEvents > 1 ? 's' : ''}`,
    x + w / 2,
    y + h - 4,
    { align: 'center' },
  )
}

function topFoulReasons(
  home: TeamStats,
  away: TeamStats,
  teamNames: Record<PlayingTeam, string>,
  limit = 6,
): string[] {
  const merged: Array<{ label: string; n: number }> = []
  for (const [reason, n] of Object.entries(home.foulReasons)) {
    merged.push({ label: `${teamNames.home} — ${reason}`, n })
  }
  for (const [reason, n] of Object.entries(away.foulReasons)) {
    merged.push({ label: `${teamNames.away} — ${reason}`, n })
  }
  return merged
    .sort((a, b) => b.n - a.n)
    .slice(0, limit)
    .map((m) => `${m.label} (${m.n})`)
}

export function exportSummaryPdf(input: {
  events: RugbyEvent[]
  teamNames: Record<PlayingTeam, string>
  videoFileName: string | null
  sessionName?: string
}) {
  const periods = computeAllPeriodStats(input.events)
  const full = periods.find((p) => p.key === 'full')!
  const first = periods.find((p) => p.key === 'first_half')
  const second = periods.find((p) => p.key === 'second_half')

  // A4 paysage — une seule page
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 10

  // Fond
  setFill(doc, COLORS.white)
  doc.rect(0, 0, pageW, pageH, 'F')

  // Bandeau haut
  setFill(doc, [15, 20, 25])
  doc.rect(0, 0, pageW, 22, 'F')
  setFill(doc, COLORS.accent)
  doc.rect(0, 22, pageW, 1.2, 'F')

  setText(doc, COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Analyse Rugby', margin, 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, [160, 175, 190])
  const title =
    input.sessionName ||
    input.videoFileName?.replace(/\.[^.]+$/, '') ||
    'Résumé de match'
  doc.text(truncate(doc, title, pageW - 2 * margin - 60), margin, 16)

  setText(doc, COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(
    `${input.teamNames.home}  vs  ${input.teamNames.away}`,
    pageW - margin,
    10,
    { align: 'right' },
  )
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, [160, 175, 190])
  doc.text(
    `Généré le ${new Date().toLocaleString('fr-FR')}`,
    pageW - margin,
    16,
    { align: 'right' },
  )

  // Phases
  let y = 28
  if (full.phases.length > 0) {
    setText(doc, COLORS.muted)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('TEMPS DE JEU', margin, y)
    y += 4
    const phaseW = (pageW - 2 * margin - 6) / Math.min(full.phases.length, 4)
    full.phases.slice(0, 4).forEach((phase, i) => {
      const px = margin + i * (phaseW + 2)
      drawRoundedRect(doc, px, y, phaseW, 9, 2, COLORS.card, COLORS.line)
      setText(doc, COLORS.ink)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.text(phase.label, px + 3, y + 3.8)
      setText(doc, COLORS.accent)
      doc.setFontSize(8)
      doc.text(formatTimestamp(phase.timestamp), px + phaseW - 3, y + 3.8, {
        align: 'right',
      })
    })
    y += 13
  } else {
    setText(doc, COLORS.muted)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.text(
      'Astuce : tague Fin MT / Début MT pour séparer les mi-temps dans le PDF.',
      margin,
      y + 2,
    )
    y += 8
  }

  // Cartes périodes (1 à 3 colonnes)
  const cards: PeriodStats[] = []
  if (first) cards.push(first)
  if (second) cards.push(second)
  cards.push(full)

  const gap = 4
  const cardsW = pageW - 2 * margin
  const cardW = (cardsW - gap * (cards.length - 1)) / cards.length
  const cardH = pageH - y - margin - 18
  cards.forEach((period, i) => {
    const cx = margin + i * (cardW + gap)
    drawPeriodCard(doc, period, input.teamNames, cx, y, cardW, cardH)
  })

  // Pied : motifs de faute (match entier)
  const foulY = pageH - 14
  setDraw(doc, COLORS.line)
  doc.setLineWidth(0.2)
  doc.line(margin, foulY - 3, pageW - margin, foulY - 3)

  const fouls = topFoulReasons(full.home, full.away, input.teamNames)
  setText(doc, COLORS.muted)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.text('MOTIFS DE FAUTE (MATCH)', margin, foulY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  const foulText =
    fouls.length > 0 ? fouls.join('   ·   ') : 'Aucun motif renseigné'
  doc.text(truncate(doc, foulText, pageW - 2 * margin - 45), margin + 42, foulY)

  setText(doc, [170, 178, 186])
  doc.setFontSize(6)
  doc.text(
    'Score estimé : essai 5 · transformation 2 · pénalité 3',
    pageW - margin,
    foulY,
    { align: 'right' },
  )

  doc.save(`${safeBaseName(input.videoFileName)}_resume_${stamp()}.pdf`)
}
