import { contextBridge, ipcRenderer } from 'electron'

export type OpenedVideo = {
  path: string
  name: string
  url: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  openVideo: (): Promise<OpenedVideo | null> =>
    ipcRenderer.invoke('dialog:openVideo'),
})
