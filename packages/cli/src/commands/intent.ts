import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { Command } from './index.js'

export const intent: Command = {
  description: 'Capture a new intent',
  async run(args) {
    const description = args.join(' ')
    if (!description) {
      console.log('Usage: brian intent <description>')
      return
    }

    const brianDir = path.join(process.cwd(), 'brian')
    if (!fs.existsSync(brianDir)) {
      console.log('No brain found. Run `brian init` first.')
      return
    }

    const id = crypto.randomUUID().slice(0, 8)
    const now = new Date().toISOString()
    const content = `---
id: ${id}
type: intent
status: captured
created: ${now}
---

# Intent: ${description}

${description}
`
    const dir = path.join(brianDir, 'intents')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, `intent-${id}.md`), content)
    console.log(`Intent captured: ${id}`)
  },
}
