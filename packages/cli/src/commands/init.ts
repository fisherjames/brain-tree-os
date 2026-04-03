import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { Command } from './index.js'

export const init: Command = {
  description: 'Initialize a brain in the current repo',
  async run() {
    const cwd = process.cwd()
    const brianDir = path.join(cwd, 'brian')
    const dotBrian = path.join(cwd, '.brian')

    if (fs.existsSync(brianDir)) {
      console.log('Brain directory already exists.')
      return
    }

    fs.mkdirSync(brianDir, { recursive: true })
    fs.mkdirSync(dotBrian, { recursive: true })

    const meta = {
      id: crypto.randomUUID(),
      name: path.basename(cwd),
      description: 'Brian workspace',
      created: new Date().toISOString(),
      version: '2.0.0',
    }
    fs.writeFileSync(path.join(dotBrian, 'brain.json'), JSON.stringify(meta, null, 2) + '\n')
    fs.writeFileSync(
      path.join(brianDir, 'index.md'),
      `# ${meta.name}\n\n> Brain initialized ${meta.created}\n`,
    )
    fs.writeFileSync(
      path.join(brianDir, 'execution-plan.md'),
      '# Execution Plan\n\n_No tasks yet._\n',
    )

    console.log(`Brain initialized: ${meta.name} (${meta.id})`)
  },
}
