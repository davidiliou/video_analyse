import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react'
import { formatTimestamp } from '@/utils/time'
import { EVENT_BY_TYPE, type RugbyEvent } from '@/types/events'

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3] as const

export type VideoPlayerHandle = {
  getCurrentTime: () => number
  seek: (time: number) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
}

type Props = {
  src: string | null
  fileName: string | null
  playing: boolean
  playbackRate: number
  events?: RugbyEvent[]
  onPlayingChange: (playing: boolean) => void
  onPlaybackRateChange: (rate: number) => void
  onTimeUpdate: (time: number, duration: number) => void
  onEnded?: () => void
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(
  function VideoPlayer(
    {
      src,
      fileName,
      playing,
      playbackRate,
      events = [],
      onPlayingChange,
      onPlaybackRateChange,
      onTimeUpdate,
      onEnded,
    },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [duration, setDuration] = useState(0)
    const [displayTime, setDisplayTime] = useState(0)
    const scrubbingRef = useRef(false)

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => videoRef.current?.currentTime ?? 0,
      seek: (time: number) => {
        const v = videoRef.current
        if (!v) return
        v.currentTime = time
        setDisplayTime(time)
        onTimeUpdate(time, v.duration || duration)
      },
      play: () => void videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
      togglePlay: () => {
        const v = videoRef.current
        if (!v) return
        if (v.paused) void v.play()
        else v.pause()
      },
    }))

    useEffect(() => {
      const v = videoRef.current
      if (!v || !src) return
      if (playing && v.paused) void v.play()
      if (!playing && !v.paused) v.pause()
    }, [playing, src])

    useEffect(() => {
      const v = videoRef.current
      if (!v) return
      v.playbackRate = playbackRate
    }, [playbackRate, src])

    useEffect(() => {
      setDuration(0)
      setDisplayTime(0)
    }, [src])

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key !== ' ' || e.repeat) return
        const target = e.target as HTMLElement | null
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
        ) {
          return
        }
        e.preventDefault()
        onPlayingChange(!playing)
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }, [playing, onPlayingChange])

    const seekTo = (time: number) => {
      const v = videoRef.current
      if (!v) return
      const max = v.duration || duration
      const next = Math.min(max || Number.POSITIVE_INFINITY, Math.max(0, time))
      v.currentTime = next
      setDisplayTime(next)
      onTimeUpdate(next, max || 0)
    }

    const seekToRatio = (ratio: number) => {
      if (!duration) return
      seekTo(ratio * duration)
    }

    const skipBy = (delta: number) => {
      seekTo(displayTime + delta)
    }

    if (!src) {
      return (
        <div className="player player--empty">
          <div className="player__placeholder">
            <p className="player__title">Aucune vidéo</p>
            <p className="player__hint">
              Ouvre un fichier MP4 local (H.264) — jusqu’à plusieurs Go.
            </p>
          </div>
        </div>
      )
    }

    const progress = duration > 0 ? (displayTime / duration) * 100 : 0

    return (
      <div className="player">
        <video
          ref={videoRef}
          className="player__video"
          src={src}
          preload="metadata"
          onPlay={() => onPlayingChange(true)}
          onPause={() => onPlayingChange(false)}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget
            setDuration(v.duration || 0)
            v.playbackRate = playbackRate
            onTimeUpdate(v.currentTime, v.duration || 0)
          }}
          onDurationChange={(e) => {
            setDuration(e.currentTarget.duration || 0)
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget
            if (!scrubbingRef.current) {
              setDisplayTime(v.currentTime)
            }
            onTimeUpdate(v.currentTime, v.duration || 0)
          }}
          onEnded={() => {
            onPlayingChange(false)
            onEnded?.()
          }}
          onClick={() => onPlayingChange(!playing)}
        />

        <div className="player__controls">
          <div className="timeline">
            <div className="timeline__track" aria-hidden>
              <div
                className="timeline__progress"
                style={{ width: `${progress}%` }}
              />
              {duration > 0 &&
                events.map((ev) => {
                  const def = EVENT_BY_TYPE[ev.type]
                  const left = (ev.timestamp / duration) * 100
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      className="timeline__marker"
                      style={{
                        left: `${left}%`,
                        background: def?.color ?? '#888',
                      }}
                      title={`${def?.label ?? ev.type} — ${formatTimestamp(ev.timestamp)}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        seekToRatio(ev.timestamp / duration)
                      }}
                    />
                  )
                })}
            </div>
            <input
              type="range"
              className="timeline__slider"
              min={0}
              max={duration || 0}
              step={0.01}
              value={Number.isFinite(displayTime) ? displayTime : 0}
              disabled={!duration}
              aria-label="Timeline"
              onPointerDown={() => {
                scrubbingRef.current = true
              }}
              onPointerUp={() => {
                scrubbingRef.current = false
              }}
              onChange={(e) => {
                const time = Number(e.target.value)
                setDisplayTime(time)
                if (videoRef.current) {
                  videoRef.current.currentTime = time
                }
                onTimeUpdate(time, duration)
              }}
            />
          </div>

          <div className="player__bar">
            <div className="player__transport">
              <button
                type="button"
                className="btn btn--icon btn--skip"
                onClick={() => skipBy(-5)}
                aria-label="Reculer de 5 secondes"
                title="−5 s"
              >
                −5s
              </button>
              <button
                type="button"
                className="btn btn--icon"
                onClick={() => onPlayingChange(!playing)}
                aria-label={playing ? 'Pause' : 'Lecture'}
              >
                {playing ? '❚❚' : '▶'}
              </button>
              <button
                type="button"
                className="btn btn--icon btn--skip"
                onClick={() => skipBy(5)}
                aria-label="Avancer de 5 secondes"
                title="+5 s"
              >
                +5s
              </button>
            </div>

            <span className="player__time" aria-live="off">
              {formatTimestamp(displayTime)}
              <span className="player__time-sep">/</span>
              {formatTimestamp(duration)}
            </span>

            <span className="player__filename" title={fileName ?? undefined}>
              {fileName}
            </span>

            <label className="player__speed">
              <span className="player__speed-label">Vitesse</span>
              <select
                className="player__speed-select"
                value={playbackRate}
                onChange={(e) => onPlaybackRateChange(Number(e.target.value))}
                aria-label="Vitesse de lecture"
              >
                {PLAYBACK_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    ×{rate}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
    )
  },
)
