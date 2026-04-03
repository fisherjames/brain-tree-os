import fs from 'fs'
import path from 'path'
import type { Command } from './index.js'

export const sync: Command = {
  description: 'Synchronize brain registry',
  async run() {
    const cwd = process.cwd()
    const dotBrian = path.join(cwd, '.brian', 'brain.json')

    if (!fs.existsSync(dotBrian)) {
      console.log('No .brian/brain.json found. Run `brian init` first.')
      return
    }

    const meta = JSON.parse(fs.readFileSync(dotBrian, 'utf8'))
    const configDir = path.join(process.env.HOME ?? '/tmp', '.brian')
    const registryPath = path.join(configDir, 'brains.json')

    fs.mkdirSync(configDir, { recursive: true })

    let registry: { brains: Array<Record<string, string>> } = { brains: [] }
    if (fs.existsSync(registryPath)) {
      registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
    }

    const existing = registry.brains.findIndex((b) => b.id === meta.id)
    const entry = {
      id: meta.id,
      name: meta.name,
      description: meta.description,
      path: cwd,
      created: meta.created,
    }

    if (existing >= 0) {
      registry.brains[existing] = entry
    } else {
      registry.brains.push(entry)
    }

    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n')
    console.log(`Brain registry synchronized: ${meta.name} -> ${cwd}`)
  },
}
