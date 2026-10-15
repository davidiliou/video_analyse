/** Types d'événements rugby taguables par bouton (MVP manuel). */
export type EventType =
  | 'debut_match'
  | 'fin_mi_temps'
  | 'debut_mi_temps'
  | 'fin_match'
  | 'touche_gagnee'
  | 'touche_perdue'
  | 'melee_gagnee'
  | 'melee_perdue'
  | 'ruck_gagne'
  | 'ruck_perdu'
  | 'essai'
  | 'transformation'
  | 'transformation_manquee'
  | 'penalite'
  | 'penalite_manquee'
  | 'en_avant'
  | 'penalite_sifflee'
  | 'coup_franc'
  | 'carton_jaune'
  | 'carton_rouge'

/** Gauche = home, droite = away, phases de match = neutral. */
export type PlayingTeam = 'home' | 'away'
export type TeamSide = PlayingTeam | 'neutral'

export interface RugbyEvent {
  id: string
  type: EventType
  /** Timestamp vidéo en secondes. */
  timestamp: number
  team: TeamSide
  /** Motif de faute (pénalité sifflée / coup franc). */
  foulReason?: string
  note?: string
  createdAt: number
}

export interface EventDefinition {
  type: EventType
  label: string
  /** Libellé court pour les carrés. */
  shortLabel?: string
  color: string
  /** Groupe d’affichage dans le pad. */
  group: 'match' | 'conquete' | 'score' | 'faute' | 'discipline'
  /** Demande un motif via liste déroulante. */
  requiresReason?: boolean
}

/**
 * Motifs courants de sanction (World Rugby / vocabulaire arbitres FR).
 * Utilisés pour pénalité sifflée et coup franc.
 */
export const FOUL_REASONS = [
  'Ballon gardé au sol',
  'Non libération du ballon',
  'Pas de dégagement (roll away)',
  'Entrée latérale',
  'Mains dans le ruck',
  'Hors-jeu',
  'Plaquage haut',
  'Plaquage sans bras',
  'Plaquage dangereux',
  'Plaquage tardif',
  'Plaquage anticipé',
  'Neck roll / torsion du cou',
  'Plaquage cathédrale',
  'Obstruction',
  'Jeu déloyal',
  'Contestations / protestations',
  'Écroulement de mêlée',
  'Engagement anticipé (mêlée)',
  'Non respect des 10 m',
  'Coup de pied dangereux',
  'Saisie du cou / tête',
  'Joueur au sol jouant le ballon',
  'Autre',
] as const

export type FoulReason = (typeof FOUL_REASONS)[number]

export const EVENT_DEFINITIONS: EventDefinition[] = [
  {
    type: 'debut_match',
    label: 'Début du match',
    shortLabel: 'Début match',
    color: '#90be6d',
    group: 'match',
  },
  {
    type: 'fin_mi_temps',
    label: 'Fin mi-temps',
    shortLabel: 'Fin MT',
    color: '#f4a261',
    group: 'match',
  },
  {
    type: 'debut_mi_temps',
    label: 'Début mi-temps',
    shortLabel: 'Début MT',
    color: '#e9c46a',
    group: 'match',
  },
  {
    type: 'fin_match',
    label: 'Fin du match',
    shortLabel: 'Fin match',
    color: '#e76f51',
    group: 'match',
  },
  { type: 'touche_gagnee', label: 'Touche gagnée', color: '#9b5de5', group: 'conquete' },
  { type: 'touche_perdue', label: 'Touche perdue', color: '#6c4a8a', group: 'conquete' },
  { type: 'melee_gagnee', label: 'Mêlée gagnée', color: '#ef476f', group: 'conquete' },
  { type: 'melee_perdue', label: 'Mêlée perdue', color: '#a33a52', group: 'conquete' },
  { type: 'ruck_gagne', label: 'Ruck gagné', color: '#3d8bfd', group: 'conquete' },
  { type: 'ruck_perdu', label: 'Ruck perdu', color: '#2a5f9e', group: 'conquete' },
  { type: 'essai', label: 'Essai', color: '#2ec4b6', group: 'score' },
  {
    type: 'transformation',
    label: 'Transformation',
    shortLabel: 'Transfo',
    color: '#4cc9f0',
    group: 'score',
  },
  {
    type: 'transformation_manquee',
    label: 'Transformation manquée',
    shortLabel: 'Transfo ✗',
    color: '#5b8fa8',
    group: 'score',
  },
  {
    type: 'penalite',
    label: 'Pénalité réussie',
    shortLabel: 'Péna. ✓',
    color: '#f0a202',
    group: 'score',
  },
  {
    type: 'penalite_manquee',
    label: 'Pénalité manquée',
    shortLabel: 'Péna. ✗',
    color: '#b07d2a',
    group: 'score',
  },
  {
    type: 'en_avant',
    label: 'En avant',
    color: '#06d6a0',
    group: 'faute',
  },
  {
    type: 'penalite_sifflee',
    label: 'Pénalité',
    shortLabel: 'Pénalité',
    color: '#ff6b35',
    group: 'faute',
    requiresReason: true,
  },
  {
    type: 'coup_franc',
    label: 'Coup franc',
    color: '#118ab2',
    group: 'faute',
    requiresReason: true,
  },
  { type: 'carton_jaune', label: 'Carton jaune', color: '#ffd166', group: 'discipline' },
  { type: 'carton_rouge', label: 'Carton rouge', color: '#e63946', group: 'discipline' },
]

export const MATCH_PHASE_DEFINITIONS = EVENT_DEFINITIONS.filter(
  (d) => d.group === 'match',
)

export const EVENT_BY_TYPE = Object.fromEntries(
  EVENT_DEFINITIONS.map((d) => [d.type, d]),
) as Record<EventType, EventDefinition>

/** Points rugby associés aux événements de score. */
export const POINTS_BY_TYPE: Partial<Record<EventType, number>> = {
  essai: 5,
  transformation: 2,
  penalite: 3,
}

export const DEFAULT_TEAM_NAMES: Record<PlayingTeam, string> = {
  home: 'Équipe gauche',
  away: 'Équipe droite',
}
