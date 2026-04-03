import { isMemuAvailable, memorize } from './client.js'
import { watch, type FSWatcher } from 'chokidar'
import fs from 'fs'

let watcher: FSWatcher | null = null
let memuOnline = false

export async function startMemuIngestion(brainDir: string) {
  memuOnline = await isMemuAvailable()
  if (!memuOnline) {
    console.log('memU server not available - using filesystem fallback')
    return
  }

  console.log('memU connected - starting autonomous ingestion')

  watcher = watch(brainDir, {
    ignoreInitial: false,
    ignored: /(^|[/\\])\./,
  })

  watcher.on('add', (filePath) => ingestFile(filePath))
  watcher.on('change', (filePath) => ingestFile(filePath))
}

async function ingestFile(filePath: string) {
  if (!filePath.endsWith('.md')) return
  if (!memuOnline) return

  try {
    const content = fs.readFileSync(filePath, 'utf8')
    await memorize(content, filePath)
  } catch {
    /* swallow ingestion failures gracefully */
  }
}

export function stopMemuIngestion() {
  watcher?.close()
  watcher = null
}
