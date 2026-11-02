/**
 * Touches laissées au dialogue (défilement, validation, boutons).
 * Tout le reste est un raccourci global potentiel (lecture, tagging).
 */
const DIALOG_NAVIGATION_KEYS = new Set([
  'Tab',
  'Enter',
  ' ',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
])

/** Vrai tant que le mode d’emploi suspend les raccourcis globaux. */
export function globalShortcutsSuspended(): boolean {
  return document.body?.dataset.blockGlobalShortcuts === '1'
}

export function isDialogNavigationKey(key: string): boolean {
  return DIALOG_NAVIGATION_KEYS.has(key)
}

/**
 * Pose un drapeau lu par les raccourcis (lecture, tagging) et empêche
 * les touches hors navigation d’atteindre les écouteurs en phase bulle.
 * Échap ferme la fenêtre. Espace reste disponible pour les boutons,
 * mais les écouteurs globaux doivent consulter `globalShortcutsSuspended`.
 */
export function suspendGlobalShortcuts(onEscape: () => void): () => void {
  const previous = document.body.dataset.blockGlobalShortcuts
  document.body.dataset.blockGlobalShortcuts = '1'

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onEscape()
      return
    }
    if (!isDialogNavigationKey(event.key)) {
      event.stopPropagation()
    }
  }

  window.addEventListener('keydown', onKey, true)
  return () => {
    window.removeEventListener('keydown', onKey, true)
    if (previous === undefined) {
      delete document.body.dataset.blockGlobalShortcuts
    } else {
      document.body.dataset.blockGlobalShortcuts = previous
    }
  }
}
