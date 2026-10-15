import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 8087)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data')
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions')
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '../dist')

async function ensureDirs() {
  await fs.mkdir(SESSIONS_DIR, { recursive: true })
}

function sessionPath(id) {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!safe || safe !== id) {
    throw Object.assign(new Error('Identifiant invalide'), { status: 400 })
  }
  return path.join(SESSIONS_DIR, `${safe}.json`)
}

function toSummary(session) {
  return {
    id: session.id,
    name: session.name,
    videoFileName: session.videoFileName ?? null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    eventCount: Array.isArray(session.events) ? session.events.length : 0,
  }
}

function validateSession(body) {
  if (!body || typeof body !== 'object') {
    throw Object.assign(new Error('Corps invalide'), { status: 400 })
  }
  if (!Array.isArray(body.events)) {
    throw Object.assign(new Error('events doit être un tableau'), { status: 400 })
  }
  return body
}

const app = express()
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/sessions', async (_req, res, next) => {
  try {
    await ensureDirs()
    const files = await fs.readdir(SESSIONS_DIR)
    const sessions = []
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const raw = await fs.readFile(path.join(SESSIONS_DIR, file), 'utf8')
        sessions.push(toSummary(JSON.parse(raw)))
      } catch {
        // ignore corrupt files
      }
    }
    sessions.sort((a, b) => b.updatedAt - a.updatedAt)
    res.json(sessions)
  } catch (err) {
    next(err)
  }
})

app.get('/api/sessions/:id', async (req, res, next) => {
  try {
    const file = sessionPath(req.params.id)
    const raw = await fs.readFile(file, 'utf8')
    res.json(JSON.parse(raw))
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'Session introuvable' })
      return
    }
    next(err)
  }
})

app.post('/api/sessions', async (req, res, next) => {
  try {
    await ensureDirs()
    const body = validateSession(req.body)
    const now = Date.now()
    const id = typeof body.id === 'string' && body.id ? body.id : randomUUID()
    // Re-validate id for filesystem safety
    sessionPath(id)

    let createdAt = typeof body.createdAt === 'number' ? body.createdAt : now
    try {
      const existing = JSON.parse(await fs.readFile(sessionPath(id), 'utf8'))
      createdAt = existing.createdAt ?? createdAt
    } catch {
      // new session
    }

    const session = {
      id,
      name:
        typeof body.name === 'string' && body.name.trim()
          ? body.name.trim()
          : body.videoFileName || 'Analyse sans titre',
      videoFileName: body.videoFileName ?? null,
      videoPath: body.videoPath ?? null,
      events: body.events,
      createdAt,
      updatedAt: now,
    }

    await fs.writeFile(sessionPath(id), JSON.stringify(session, null, 2), 'utf8')
    res.status(201).json(session)
  } catch (err) {
    next(err)
  }
})

app.delete('/api/sessions/:id', async (req, res, next) => {
  try {
    await fs.unlink(sessionPath(req.params.id))
    res.status(204).end()
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'Session introuvable' })
      return
    }
    next(err)
  }
})

app.use(express.static(STATIC_DIR))
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()
  if (req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(STATIC_DIR, 'index.html'), (err) => {
    if (err) next(err)
  })
})

app.use((err, _req, res, _next) => {
  const status = err.status || 500
  console.error(err)
  res.status(status).json({ error: err.message || 'Erreur serveur' })
})

await ensureDirs()
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Analyse Rugby — http://0.0.0.0:${PORT}`)
  console.log(`Données : ${DATA_DIR}`)
})
