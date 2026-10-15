import { app, BrowserWindow, dialog, ipcMain, protocol, net } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
    },
  },
])

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'Analyse Rugby',
    backgroundColor: '#0f1419',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // Stream large local MP4s without loading them into memory.
  protocol.handle('local-media', (request) => {
    const parsed = new URL(request.url)
    const filePath = decodeURIComponent(parsed.searchParams.get('path') ?? '')
    if (!filePath) {
      return new Response('Missing path', { status: 400 })
    }
    return net.fetch(pathToFileURL(filePath).href)
  })

  ipcMain.handle('dialog:openVideo', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Ouvrir une vidéo',
      filters: [
        { name: 'Vidéo MP4', extensions: ['mp4', 'm4v', 'mov'] },
        { name: 'Tous les fichiers', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    const fileName = path.basename(filePath)

    return {
      path: filePath,
      name: fileName,
      url: `local-media://video/?path=${encodeURIComponent(filePath)}`,
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
