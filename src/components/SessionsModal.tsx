import { useEffect, useState } from 'react'
import type { SessionSummary } from '@/types/session'
import { deleteSession, listSessions } from '@/api/sessions'

type Props = {
  open: boolean
  onClose: () => void
  onLoad: (id: string) => Promise<void>
}

function formatDate(ms: number) {
  try {
    return new Date(ms).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return String(ms)
  }
}

export function SessionsModal({ open, onClose, onLoad }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    listSessions()
      .then((data) => {
        if (!cancelled) setSessions(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Impossible de lister les sessions')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sessions-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="sessions-title" className="modal__title">
            Sessions sauvegardées
          </h2>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="modal__body">
          {loading && <p className="modal__hint">Chargement…</p>}
          {error && <p className="modal__error">{error}</p>}
          {!loading && !error && sessions.length === 0 && (
            <p className="modal__hint">Aucune session enregistrée sur le serveur.</p>
          )}
          {!loading && sessions.length > 0 && (
            <ul className="session-list">
              {sessions.map((s) => (
                <li key={s.id} className="session-list__item">
                  <div className="session-list__info">
                    <strong className="session-list__name">{s.name}</strong>
                    <span className="session-list__meta">
                      {s.videoFileName || 'Sans vidéo'} · {s.eventCount} tag
                      {s.eventCount > 1 ? 's' : ''} · {formatDate(s.updatedAt)}
                    </span>
                  </div>
                  <div className="session-list__actions">
                    <button
                      type="button"
                      className="btn btn--primary"
                      disabled={busyId === s.id}
                      onClick={async () => {
                        setBusyId(s.id)
                        try {
                          await onLoad(s.id)
                          onClose()
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : 'Chargement impossible',
                          )
                        } finally {
                          setBusyId(null)
                        }
                      }}
                    >
                      Charger
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={busyId === s.id}
                      onClick={async () => {
                        if (
                          !confirm(
                            `Supprimer la session « ${s.name} » ?`,
                          )
                        ) {
                          return
                        }
                        setBusyId(s.id)
                        try {
                          await deleteSession(s.id)
                          setSessions((prev) =>
                            prev.filter((x) => x.id !== s.id),
                          )
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : 'Suppression impossible',
                          )
                        } finally {
                          setBusyId(null)
                        }
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="modal__footer">
          <p className="modal__hint">
            La vidéo n’est pas stockée : rouvre le même fichier après chargement.
          </p>
        </footer>
      </div>
    </div>
  )
}
