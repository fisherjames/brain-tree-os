import fs from 'fs'
import path from 'path'

interface BrainEntry {
  id: string
  name: string
  description: string
  path: string
}

interface FileEntry {
  path: string
  name: string
  type: 'file' | 'directory'
}

export class BrainFs {
  constructor(private brainRoot: string) {}

  listBrains(): BrainEntry[] {
    const configPath = path.join(this.getConfigDir(), 'brains.json')
    if (!fs.existsSync(configPath)) return []
    try {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      return (data.brains ?? []).filter((b: BrainEntry) => fs.existsSync(b.path))
    } catch {
      return []
    }
  }

  private getConfigDir(): string {
    return path.join(process.env.HOME ?? '/tmp', '.brian')
  }

  getBrainPath(brainId: string): string | null {
    const brains = this.listBrains()
    const entry = brains.find((b) => b.id === brainId)
    if (entry) return entry.path
    if (fs.existsSync(path.join(this.brainRoot, 'brian'))) return this.brainRoot
    return null
  }

  listFiles(brainId: string): FileEntry[] {
    const root = this.getBrainPath(brainId)
    if (!root) return []
    const brainDir = path.join(root, 'brian')
    if (!fs.existsSync(brainDir)) return []
    return this.walkDir(brainDir, brainDir)
  }

  private walkDir(dir: string, root: string): FileEntry[] {
    const entries: FileEntry[] = []
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, item.name)
      const relPath = path.relative(root, fullPath)
      if (item.isDirectory()) {
        entries.push({ path: relPath, name: item.name, type: 'directory' })
        entries.push(...this.walkDir(fullPath, root))
      } else if (item.name.endsWith('.md')) {
        entries.push({ path: relPath, name: item.name, type: 'file' })
      }
    }
    return entries
  }

  readFile(brainId: string, filePath: string): string | null {
    const root = this.getBrainPath(brainId)
    if (!root) return null
    const full = path.join(root, 'brian', filePath)
    if (!fs.existsSync(full)) return null
    return fs.readFileSync(full, 'utf8')
  }

  writeFile(brainId: string, filePath: string, content: string): void {
    const root = this.getBrainPath(brainId)
    if (!root) throw new Error(`Brain ${brainId} not found`)
    const full = path.join(root, 'brian', filePath)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content, 'utf8')
  }

  getSnapshot(brainId: string) {
    const files = this.listFiles(brainId)
    const executionPlan = this.readFile(brainId, 'execution-plan.md')
    return { brainId, files, executionPlan }
  }
}
