import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { Command } from './index.js'

export const end: Command = {
  description: 'End current session with handoff',
  async run() {
    const brianDir = path.join(process.cwd(), 'brian')
    if (!fs.existsSync(brianDir)) {
      console.log('No brain found.')
      return
    }

    const id = crypto.randomUUID().slice(0, 8)
    const now = new Date().toISOString()
    const content = `---
id: ${id}
type: handoff
created: ${now}
---

# Session Handoff ${id}

## Context
_Describe what was accomplished._

## Deliverables
- [ ] _List deliverables_

## Blockers
_None._
`
    const dir = path.join(brianDir, 'handoffs')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, `handoff-${id}.md`), content)
    console.log(`Session ended. Handoff created: handoff-${id}.md`)
  },
}
