type Props = {
  eventCount: number
  apiAvailable: boolean
  saving: boolean
  canExport: boolean
  onOpenVideo: () => void
  onClearEvents: () => void
  onExportJson: () => void
  onExportCsv: () => void
  onSaveServer: () => void
  onOpenSessions: () => void
}

export function Toolbar({
  eventCount,
  apiAvailable,
  saving,
  canExport,
  onOpenVideo,
  onClearEvents,
  onExportJson,
  onExportCsv,
  onSaveServer,
  onOpenSessions,
}: Props) {
  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__logo">Analyse Rugby</span>
        <span className="toolbar__badge">MVP</span>
      </div>
      <div className="toolbar__actions">
        <button type="button" className="btn btn--primary" onClick={onOpenVideo}>
          Ouvrir une vidéo…
        </button>
        <button
          type="button"
          className="btn"
          onClick={onExportJson}
          disabled={!canExport}
          title="Télécharger la session en JSON"
        >
          Export JSON
        </button>
        <button
          type="button"
          className="btn"
          onClick={onExportCsv}
          disabled={!canExport}
          title="Télécharger les tags en CSV"
        >
          Export CSV
        </button>
        <button
          type="button"
          className="btn"
          onClick={onSaveServer}
          disabled={!apiAvailable || saving || eventCount === 0}
          title={
            apiAvailable
              ? 'Enregistrer les tags sur le serveur'
              : 'API serveur indisponible'
          }
        >
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        <button
          type="button"
          className="btn"
          onClick={onOpenSessions}
          disabled={!apiAvailable}
          title={
            apiAvailable
              ? 'Charger une session sauvegardée'
              : 'API serveur indisponible'
          }
        >
          Charger…
        </button>
        <button
          type="button"
          className="btn"
          onClick={onClearEvents}
          disabled={eventCount === 0}
        >
          Effacer ({eventCount})
        </button>
      </div>
    </header>
  )
}
