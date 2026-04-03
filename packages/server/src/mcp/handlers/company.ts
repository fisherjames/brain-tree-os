import { BrainFs } from '../../fs/brain-fs.js'
import { scanSkills, scanRules } from '../../fs/skill-scanner.js'
import crypto from 'crypto'

type McpHandler = (
  params: Record<string, unknown>,
  brainRoot: string,
  brainId?: string,
) => Promise<unknown>

export const companyHandlers: Record<string, McpHandler> = {
  'company.intent.capture': async (params, brainRoot, brainId) => {
    const description = (params.description as string) ?? ''
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
    const fs = new BrainFs(brainRoot)
    try {
      fs.writeFile(brainId ?? '', `intents/intent-${id}.md`, content)
    } catch {
      /* brain may not exist */
    }

    return { status: 'ok', intentId: id, description }
  },

  'initiative.propose': async () => {
    return { status: 'ok', message: 'Proposal stub' }
  },

  'initiative.shape': async () => {
    return { status: 'ok', message: 'Shape stub' }
  },

  'initiative.plan': async () => {
    return { status: 'ok', message: 'Plan stub' }
  },

  'initiative.execute': async () => {
    return { status: 'ok', message: 'Execute stub' }
  },

  'initiative.list': async () => {
    return { initiatives: [] }
  },

  'task.list': async () => {
    return { tasks: [] }
  },

  'discussion.open': async () => {
    return { status: 'ok', message: 'Discussion opened' }
  },

  'discussion.respond': async () => {
    return { status: 'ok', message: 'Response recorded' }
  },

  'decision.record': async (params) => {
    return { status: 'ok', outcome: params.outcome }
  },

  'decision.list_pending': async () => {
    return { decisions: [] }
  },

  'briefing.generate': async () => {
    return { status: 'ok', message: 'Briefing generated' }
  },

  'config.get_skills': async (_params, brainRoot) => {
    return { skills: scanSkills(brainRoot) }
  },

  'config.get_rules': async (_params, brainRoot) => {
    return { rules: scanRules(brainRoot) }
  },
}
