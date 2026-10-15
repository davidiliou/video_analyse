import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import { Toolbar } from '@/components/Toolbar'
import { VideoPlayer, type VideoPlayerHandle } from '@/components/VideoPlayer'
import { TaggingPanel } from '@/components/TaggingPanel'
import { EventTimeline } from '@/components/EventTimeline'
import { SessionsModal } from '@/components/SessionsModal'
import { StatsSummary } from '@/components/StatsSummary'
import {
  checkApiAvailable,
  getSession,
  saveSession,
} from '@/api/sessions'
import { exportEventsCsv, exportSessionJson } from '@/utils/export'
import { clearDraft, loadDraft, saveDraft } from '@/utils/draft'
import {
  DEFAULT_TEAM_NAMES,
  type EventType,
  type RugbyEvent,
  type TeamSide,
} from '@/types/events'
import type { AnalysisSession } from '@/types/session'
import { createShortId, createUUID } from '@/utils/id'
import { usePanelLayout } from '@/hooks/usePanelLayout'
import { Splitter } from '@/components/Splitter'
import { readSessionFile } from '@/utils/importSession'

function buildSession(input: {
  id: string | null
  name: string
  videoFileName: string | null
  videoPath?: string | null
  events: RugbyEvent[]
  createdAt?: number
}): AnalysisSession {
  const now = Date.now()
  return {
    id: input.id ?? createUUID(),
    name: input.name,
    videoFileName: input.videoFileName,
    videoPath: input.videoPath ?? null,
    events: input.events,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  }
}

export default function App() {
  const playerRef = useRef<VideoPlayerHandle>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const keepEventsOnNextOpen = useRef(false)
  const eventsRef = useRef<RugbyEvent[]>([])

  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [videoPath, setVideoPath] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [events, setEvents] = useState<RugbyEvent[]>([])
  eventsRef.current = events
  const [teamNames, setTeamNames] = useState(DEFAULT_TEAM_NAMES)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState('Analyse')
  const [sessionCreatedAt, setSessionCreatedAt] = useState<number | undefined>()
  const [apiAvailable, setApiAvailable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const {
    eventsWidth,
    taggingHeight,
    eventsOpen,
    taggingOpen,
    setEventsWidth,
    setTaggingHeight,
    setEventsOpen,
    setTaggingOpen,
  } = usePanelLayout()

  const clearObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  useEffect(() => () => clearObjectUrl(), [clearObjectUrl])

  useEffect(() => {
    void checkApiAvailable().then(setApiAvailable)
  }, [])

  useEffect(() => {
    const draft = loadDraft()
    if (!draft || draft.events.length === 0) return
    setSessionId(draft.sessionId)
    setSessionName(draft.sessionName)
    setFileName(draft.videoFileName)
    setEvents(draft.events)
    keepEventsOnNextOpen.current = true
    setStatus(
      draft.videoFileName
        ? `Brouillon restauré — rouvre « ${draft.videoFileName} ».`
        : 'Brouillon restauré — ouvre une vidéo.',
    )
  }, [])

  useEffect(() => {
    if (events.length === 0 && !sessionId) {
      clearDraft()
      return
    }
    saveDraft({
      sessionId,
      sessionName,
      videoFileName: fileName,
      events,
      updatedAt: Date.now(),
    })
  }, [events, sessionId, sessionName, fileName])

  const applyVideo = useCallback(
    (url: string, name: string, path: string | null = null) => {
      setVideoUrl(url)
      setVideoPath(path)
      setPlaying(false)
      setPlaybackRate(1)
      setCurrentTime(0)
      setStatsOpen(false)

      const expectingRestore = keepEventsOnNextOpen.current
      keepEventsOnNextOpen.current = false
      const expectedName = fileName
      const sameFile =
        expectingRestore && (!expectedName || expectedName === name)

      if (sameFile) {
        setFileName(name)
        setStatus(`Vidéo liée — ${events.length} tag(s) conservé(s).`)
      } else {
        setFileName(name)
        setEvents([])
        setSessionId(null)
        setSessionCreatedAt(undefined)
        setSessionName(name.replace(/\.[^.]+$/, '') || 'Analyse')
        setTeamNames(DEFAULT_TEAM_NAMES)
        setStatus(null)
      }
    },
    [fileName, events.length],
  )

  const openVideo = useCallback(async () => {
    if (window.electronAPI?.openVideo) {
      const result = await window.electronAPI.openVideo()
      if (!result) return
      clearObjectUrl()
      applyVideo(result.url, result.name, result.path)
      return
    }
    fileInputRef.current?.click()
  }, [applyVideo, clearObjectUrl])

  const onFileSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return

      clearObjectUrl()
      const url = URL.createObjectURL(file)
      objectUrlRef.current = url
      applyVideo(url, file.name, null)
    },
    [applyVideo, clearObjectUrl],
  )

  const addTag = useCallback(
    (type: EventType, team: TeamSide, foulReason?: string) => {
      const timestamp = playerRef.current?.getCurrentTime() ?? currentTime
      setEvents((prev) => [
        ...prev,
        {
          id: createShortId(),
          type,
          timestamp,
          team,
          foulReason,
          createdAt: Date.now(),
        },
      ])
    },
    [currentTime],
  )

  const seekTo = useCallback((time: number) => {
    playerRef.current?.seek(time)
    setCurrentTime(time)
  }, [])

  const currentSession = useCallback(() => {
    return buildSession({
      id: sessionId,
      name: sessionName || fileName || 'Analyse',
      videoFileName: fileName,
      videoPath,
      events,
      createdAt: sessionCreatedAt,
    })
  }, [sessionId, sessionName, fileName, videoPath, events, sessionCreatedAt])

  const onExportJson = useCallback(() => {
    exportSessionJson(currentSession())
    setStatus('Export JSON téléchargé.')
  }, [currentSession])

  const onExportCsv = useCallback(() => {
    exportEventsCsv(events, fileName)
    setStatus('Export CSV téléchargé.')
  }, [events, fileName])

  const onSaveServer = useCallback(async () => {
    if (!apiAvailable || events.length === 0) return
    setSaving(true)
    setStatus(null)
    try {
      const saved = await saveSession(currentSession())
      setSessionId(saved.id)
      setSessionName(saved.name)
      setSessionCreatedAt(saved.createdAt)
      setStatus(
        `Sauvegardé sur le serveur (${saved.events.length} tag${saved.events.length > 1 ? 's' : ''}).`,
      )
    } catch (err) {
      setStatus(
        err instanceof Error ? err.message : 'Échec de la sauvegarde serveur',
      )
    } finally {
      setSaving(false)
    }
  }, [apiAvailable, events.length, currentSession])

  const applySession = useCallback((session: AnalysisSession, source: string) => {
    setSessionId(session.id)
    setSessionName(session.name)
    setSessionCreatedAt(session.createdAt)
    setFileName(session.videoFileName)
    setVideoPath(session.videoPath ?? null)
    setEvents(session.events)
    setPlaying(false)
    setCurrentTime(0)
    keepEventsOnNextOpen.current = true
    setStatus(
      session.videoFileName
        ? `${source} (${session.events.length} tags) — ouvre « ${session.videoFileName} » pour reprendre.`
        : `${source} (${session.events.length} tags) — ouvre une vidéo pour reprendre.`,
    )
  }, [])

  const onLoadSession = useCallback(
    async (id: string) => {
      const session = await getSession(id)
      applySession(session, 'Session chargée')
    },
    [applySession],
  )

  const onImportJsonFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      try {
        const session = await readSessionFile(file)
        applySession(session, 'JSON importé')
      } catch (err) {
        setStatus(
          err instanceof Error ? err.message : 'Import JSON impossible',
        )
      }
    },
    [applySession],
  )

  return (
    <div className="app">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,.mp4,.m4v,.mov"
        hidden
        onChange={onFileSelected}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={onImportJsonFile}
      />
      <Toolbar
        eventCount={events.length}
        apiAvailable={apiAvailable}
        saving={saving}
        canExport={events.length > 0}
        onOpenVideo={openVideo}
        onClearEvents={() => {
          setEvents([])
          clearDraft()
          setStatus('Tags effacés.')
        }}
        onExportJson={onExportJson}
        onExportCsv={onExportCsv}
        onImportJson={() => jsonInputRef.current?.click()}
        onSaveServer={onSaveServer}
        onOpenSessions={() => setSessionsOpen(true)}
      />
      {status && (
        <div className="status-bar" role="status">
          {status}
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setStatus(null)}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      )}
      <main
        className={`app__main${!eventsOpen ? ' app__main--events-collapsed' : ''}${!taggingOpen ? ' app__main--tagging-collapsed' : ''}`}
      >
        {eventsOpen ? (
          <div
            className="event-timeline-shell"
            style={{ '--events-width': `${eventsWidth}px` } as CSSProperties}
          >
            <EventTimeline
              events={events}
              teamNames={teamNames}
              onSeek={seekTo}
              onDelete={(id) =>
                setEvents((prev) => prev.filter((ev) => ev.id !== id))
              }
              onCollapse={() => setEventsOpen(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            className="panel-rail panel-rail--events"
            onClick={() => setEventsOpen(true)}
            title="Afficher les événements"
          >
            <span>Événements</span>
            <span aria-hidden>⟩</span>
          </button>
        )}

        {eventsOpen && (
          <Splitter
            orientation="vertical"
            onDrag={(delta) => setEventsWidth(eventsWidth + delta)}
          />
        )}

        <div className="app__stage">
          <div className="app__player-wrap">
            <VideoPlayer
              ref={playerRef}
              src={videoUrl}
              fileName={fileName}
              playing={playing}
              playbackRate={playbackRate}
              events={events}
              onPlayingChange={setPlaying}
              onPlaybackRateChange={setPlaybackRate}
              onTimeUpdate={(t) => setCurrentTime(t)}
              onEnded={() => {
                if (eventsRef.current.length > 0) setStatsOpen(true)
              }}
            />
          </div>

          {taggingOpen && (
            <Splitter
              orientation="horizontal"
              onDrag={(delta) => setTaggingHeight(taggingHeight - delta)}
            />
          )}

          {taggingOpen ? (
            <div
              className="app__tagging-wrap"
              style={{ height: taggingHeight }}
            >
              <TaggingPanel
                currentTime={currentTime}
                enabled={Boolean(videoUrl)}
                teamNames={teamNames}
                eventCount={events.length}
                onRenameTeam={(side, name) =>
                  setTeamNames((prev) => ({ ...prev, [side]: name }))
                }
                onTag={addTag}
                onShowStats={() => setStatsOpen(true)}
                onCollapse={() => setTaggingOpen(false)}
              />
            </div>
          ) : (
            <button
              type="button"
              className="panel-rail panel-rail--tagging"
              onClick={() => setTaggingOpen(true)}
              title="Afficher le tagging"
            >
              <span>Tagging</span>
              <span aria-hidden>˄</span>
            </button>
          )}
        </div>
      </main>
      <SessionsModal
        open={sessionsOpen}
        onClose={() => setSessionsOpen(false)}
        onLoad={onLoadSession}
      />
      <StatsSummary
        open={statsOpen}
        events={events}
        teamNames={teamNames}
        videoFileName={fileName}
        sessionName={sessionName}
        onClose={() => setStatsOpen(false)}
      />
    </div>
  )
}
