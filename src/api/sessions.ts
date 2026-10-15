import type { AnalysisSession, SessionSummary } from '@/types/session'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Erreur HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function checkApiAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

export function listSessions() {
  return request<SessionSummary[]>('/api/sessions')
}

export function getSession(id: string) {
  return request<AnalysisSession>(`/api/sessions/${encodeURIComponent(id)}`)
}

export function saveSession(session: AnalysisSession) {
  return request<AnalysisSession>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  })
}

export function deleteSession(id: string) {
  return request<void>(`/api/sessions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
