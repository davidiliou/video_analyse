import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'video-analyse:panel-layout'

type PanelLayout = {
  eventsWidth: number
  taggingHeight: number
  eventsOpen: boolean
  taggingOpen: boolean
}

const DEFAULTS: PanelLayout = {
  eventsWidth: 320,
  taggingHeight: 280,
  eventsOpen: true,
  taggingOpen: true,
}

function load(): PanelLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<PanelLayout>
    return {
      eventsWidth:
        typeof parsed.eventsWidth === 'number'
          ? parsed.eventsWidth
          : DEFAULTS.eventsWidth,
      taggingHeight:
        typeof parsed.taggingHeight === 'number'
          ? parsed.taggingHeight
          : DEFAULTS.taggingHeight,
      eventsOpen:
        typeof parsed.eventsOpen === 'boolean'
          ? parsed.eventsOpen
          : DEFAULTS.eventsOpen,
      taggingOpen:
        typeof parsed.taggingOpen === 'boolean'
          ? parsed.taggingOpen
          : DEFAULTS.taggingOpen,
    }
  } catch {
    return DEFAULTS
  }
}

export function usePanelLayout() {
  const [layout, setLayout] = useState<PanelLayout>(DEFAULTS)

  useEffect(() => {
    setLayout(load())
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
    } catch {
      // ignore
    }
  }, [layout])

  // Sur petit ecran, toujours afficher les evenements (pas de rail lateral).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1100px)')
    const sync = () => {
      if (!mq.matches) {
        setLayout((prev) =>
          prev.eventsOpen ? prev : { ...prev, eventsOpen: true },
        )
      }
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const setEventsWidth = useCallback((width: number) => {
    setLayout((prev) => ({
      ...prev,
      eventsWidth: Math.min(560, Math.max(200, Math.round(width))),
    }))
  }, [])

  const setTaggingHeight = useCallback((height: number) => {
    setLayout((prev) => ({
      ...prev,
      taggingHeight: Math.min(520, Math.max(140, Math.round(height))),
    }))
  }, [])

  const setEventsOpen = useCallback((open: boolean) => {
    setLayout((prev) => ({ ...prev, eventsOpen: open }))
  }, [])

  const setTaggingOpen = useCallback((open: boolean) => {
    setLayout((prev) => ({ ...prev, taggingOpen: open }))
  }, [])

  return {
    ...layout,
    setEventsWidth,
    setTaggingHeight,
    setEventsOpen,
    setTaggingOpen,
  }
}
