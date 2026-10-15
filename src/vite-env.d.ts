/// <reference types="vite/client" />

export type OpenedVideo = {
  path: string
  name: string
  url: string
}

declare global {
  interface Window {
    electronAPI?: {
      openVideo: () => Promise<OpenedVideo | null>
    }
  }
}

export {}
