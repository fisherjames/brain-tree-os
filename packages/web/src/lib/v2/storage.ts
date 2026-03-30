import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import type { V2Event } from './types'

const V2_DIRS = [
  path.join('brian', 'org'),
  path.join('brian', 'initiatives'),
  path.join('brian', 'discussions'),
  path.join('brian', 'decisions'),
  path.join('brian', 'proposals'),
  path.join('brian', 'briefings'),
  path.join('brian', 'tasks'),
] as const

const V2_INDEXES: Array<[string, string]> = [
  [path.join('brian', 'org', 'index.md'), '# org\n\n> Part of [[index]]\n\n'],
  [path.join('brian', 'initiatives', 'index.md'), '# initiatives\n\n> Part of [[index]]\n\n'],
  [path.join('brian', 'discussions', 'index.md'), '# discussions\n\n> Part of [[index]]\n\n'],
  [path.join('brian', 'decisions', 'index.md'), '# decisions\n\n> Part of [[index]]\n\n'],
  [path.join('brian', 'proposals', 'index.md'), '# proposals\n\n> Part of [[index]]\n\n'],
  [path.join('brian', 'briefings', 'index.md'), '# briefings\n\n> Part of [[index]]\n\n'],
  [path.join('brian', 'tasks', 'index.md'), '# tasks\n\n> Part of [[index]]\n\n'],
]

function writeIfMissing(filePath: string, content: string) {
  if (fs.existsSync(filePath)) return
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
}

export function ensureV2Scaffold(brainPath: string): void {
  for (const dir of V2_DIRS) {
    fs.mkdirSync(path.join(brainPath, dir), { recursive: true })
  }
  for (const [rel, content] of V2_INDEXES) {
    writeIfMissing(path.join(brainPath, rel), content)
  }
}

export function eventLogPath(brainId: string): string {
  return path.join(os.homedir(), '.brian', 'state', brainId, 'events.ndjson')
}

export function appendEvent(brainId: string, event: Omit<V2Event, 'id' | 'at'> & { id?: string; at?: string }): V2Event {
  const enriched: V2Event = {
    ...event,
    id: event.id ?? crypto.randomUUID(),
    at: event.at ?? new Date().toISOString(),
  }
  const file = eventLogPath(brainId)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.appendFileSync(file, `${JSON.stringify(enriched)}\n`, 'utf8')
  return enriched
}

export function readEvents(brainId: string): V2Event[] {
  const file = eventLogPath(brainId)
  if (!fs.existsSync(file)) return []
  const lines = fs.readFileSync(file, 'utf8').split('\n').map((line) => line.trim()).filter(Boolean)
  const events: V2Event[] = []
  for (const line of lines) {
    try {
      events.push(JSON.parse(line) as V2Event)
    } catch {
      // Keep parsing resilient to partial writes.
    }
  }
  return events
}

export function parseFrontmatter(content: string): Record<string, string> {
  const lines = content.split('\n')
  if (lines[0]?.trim() !== '---') return {}
  const out: Record<string, string> = {}
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.trim() === '---') break
    const idx = line.indexOf(':')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    out[key] = value
  }
  return out
}

export function writeRecordMarkdown(
  brainPath: string,
  relPath: string,
  frontmatter: Record<string, string>,
  body: string
): string {
  const fm = [
    '---',
    ...Object.entries(frontmatter).map(([k, v]) => `${k}: ${v}`),
    '---',
    '',
  ].join('\n')
  const fullPath = path.join(brainPath, relPath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, `${fm}${body.trim()}\n`, 'utf8')
  return fullPath
}

export function listMarkdownRecords(brainPath: string, relDir: string): Array<{ relPath: string; content: string }> {
  const dir = path.join(brainPath, relDir)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.md') && file !== 'index.md')
    .sort()
    .map((file) => {
      const relPath = path.join(relDir, file)
      const content = fs.readFileSync(path.join(brainPath, relPath), 'utf8')
      return { relPath, content }
    })
}

export function nextId(prefix: string): string {
  const short = crypto.randomUUID().slice(0, 8)
  return `${prefix}-${short}`
}
