import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const webOnly = process.env.WEB_ONLY === '1'

export default defineConfig(async () => {
  const plugins = [react()]

  // Electron uniquement en mode desktop (évite d’installer Chromium dans l’image Docker).
  if (!webOnly) {
    const electron = (await import('vite-plugin-electron/simple')).default
    plugins.push(
      electron({
        main: {
          entry: 'electron/main.ts',
        },
        preload: {
          input: 'electron/preload.ts',
        },
        renderer: {},
      }),
    )
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8087',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 8087,
      host: true,
    },
  }
})
