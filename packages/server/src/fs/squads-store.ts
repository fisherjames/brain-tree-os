import fs from 'fs'
import path from 'path'
import { SquadSchema } from '@brian/shared'
import type { Squad } from '@brian/shared'

export class SquadsStore {
  private filePath: string

  constructor(brainRoot: string) {
    this.filePath = path.join(brainRoot, '.brian', 'squads.json')
  }

  list(): Squad[] {
    if (!fs.existsSync(this.filePath)) return []
    try {
      const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
      return (raw.squads ?? []).map((s: unknown) => SquadSchema.parse(s))
    } catch {
      return []
    }
  }

  get(id: string): Squad | null {
    return this.list().find((s) => s.id === id) ?? null
  }

  upsert(squad: Squad): Squad {
    const parsed = SquadSchema.parse(squad)
    const squads = this.list()
    const idx = squads.findIndex((s) => s.id === parsed.id)
    if (idx >= 0) {
      squads[idx] = parsed
    } else {
      squads.push(parsed)
    }
    this.save(squads)
    return parsed
  }

  remove(id: string): boolean {
    const squads = this.list()
    const filtered = squads.filter((s) => s.id !== id)
    if (filtered.length === squads.length) return false
    this.save(filtered)
    return true
  }

  setActive(id: string, active: boolean): Squad | null {
    const squads = this.list()
    const squad = squads.find((s) => s.id === id)
    if (!squad) return null
    squad.active = active
    this.save(squads)
    return squad
  }

  private save(squads: Squad[]) {
    const dir = path.dirname(this.filePath)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.filePath, JSON.stringify({ squads }, null, 2) + '\n', 'utf8')
  }
}
