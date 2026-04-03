import { watch, type FSWatcher } from 'chokidar'
import path from 'path'
import fs from 'fs'
import { BrainFs } from './brain-fs.js'

export class BrainWatcher {
  private watcher: FSWatcher | null = null
  private brainFs: BrainFs

  constructor(
    private brainRoot: string,
    private brainId: string,
    private onEvent: (event: Record<string, unknown>) => void,
  ) {
    this.brainFs = new BrainFs(brainRoot)
  }

  start() {
    const brainPath = this.brainFs.getBrainPath(this.brainId)
    if (!brainPath) return

    const watchDir = path.join(brainPath, 'brian')
    if (!fs.existsSync(watchDir)) return

    this.watcher = watch(watchDir, {
      ignoreInitial: true,
      ignored: /(^|[/\\])\./,
    })

    const sendUpdate = () => {
      const snapshot = this.brainFs.getSnapshot(this.brainId)
      this.onEvent({ type: 'full-update', ...snapshot })
    }

    this.watcher.on('add', sendUpdate)
    this.watcher.on('change', sendUpdate)
    this.watcher.on('unlink', sendUpdate)

    sendUpdate()
  }

  stop() {
    this.watcher?.close()
    this.watcher = null
  }
}
