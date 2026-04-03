const MEMU_URL = process.env.MEMU_URL ?? 'http://localhost:8000'

interface MemuResponse {
  ok: boolean
  data?: unknown
  error?: string
}

async function memuFetch(path: string, body?: unknown): Promise<MemuResponse> {
  try {
    const res = await fetch(`${MEMU_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    return { ok: res.ok, data }
  } catch {
    return { ok: false, error: 'memU server not reachable' }
  }
}

export async function memorize(content: string, source: string): Promise<MemuResponse> {
  return memuFetch('/memorize', { content, source })
}

export async function retrieve(query: string): Promise<MemuResponse> {
  return memuFetch('/retrieve', { query })
}

export async function clearMemory(): Promise<MemuResponse> {
  return memuFetch('/clear', {})
}

export async function isMemuAvailable(): Promise<boolean> {
  const res = await memuFetch('/health')
  return res.ok
}
