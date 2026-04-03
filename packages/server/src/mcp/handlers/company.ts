import { BrainFs } from '../../fs/brain-fs.js'
import { scanSkills, scanRules } from '../../fs/skill-scanner.js'
import { appendTasksToExecutionPlan } from '../../engine/task-parser.js'
import crypto from 'crypto'

type McpHandler = (
  params: Record<string, unknown>,
  brainRoot: string,
  brainId?: string,
) => Promise<unknown>

function shortId(): string {
  return crypto.randomUUID().slice(0, 8)
}

async function processIntent(
  description: string,
  brainRoot: string,
  brainId: string,
): Promise<{
  intentId: string
  discussionId: string
  proposalId: string
  decisionId: string
  tasks: string[]
}> {
  const brainFs = new BrainFs(brainRoot)
  const now = new Date().toISOString()
  const intentId = shortId()
  const discussionId = shortId()
  const proposalId = shortId()
  const decisionId = shortId()

  brainFs.writeFile(
    brainId,
    `intents/intent-${intentId}.md`,
    `---
id: ${intentId}
type: intent
status: approved
created: ${now}
---

# Intent: ${description}

${description}
`,
  )

  brainFs.writeFile(
    brainId,
    `discussions/discussion-${discussionId}.md`,
    `---
id: ${discussionId}
type: discussion
intentId: ${intentId}
status: resolved
created: ${now}
---

# Discussion: ${description}

## Director Assessment

Intent accepted for implementation. Proceeding to proposal.
`,
  )

  brainFs.writeFile(
    brainId,
    `proposals/proposal-${proposalId}.md`,
    `---
id: ${proposalId}
type: proposal
intentId: ${intentId}
status: approved
created: ${now}
---

# Proposal: ${description}

## Summary

Implement the intent as described. Agent squad will handle implementation details.

## Rationale

Direct implementation of captured intent.
`,
  )

  brainFs.writeFile(
    brainId,
    `decisions/decision-${decisionId}.md`,
    `---
id: ${decisionId}
type: decision
proposalId: ${proposalId}
outcome: approved
decidedBy: ceo
decidedAt: ${now}
---

# Decision: Approved

Auto-approved in solo-founder mode.
`,
  )

  const tasks = [description]
  appendTasksToExecutionPlan(brainRoot, intentId, tasks)

  return { intentId, discussionId, proposalId, decisionId, tasks }
}

export const companyHandlers: Record<string, McpHandler> = {
  'company.intent.capture': async (params, brainRoot, brainId) => {
    const description = (params.description as string) ?? ''
    if (!description.trim()) throw new Error('Intent description is required')

    const result = await processIntent(description, brainRoot, brainId ?? '')
    return {
      status: 'ok',
      intentId: result.intentId,
      description,
      governance: {
        discussionId: result.discussionId,
        proposalId: result.proposalId,
        decisionId: result.decisionId,
      },
      tasksCreated: result.tasks.length,
    }
  },

  'initiative.propose': async (params, brainRoot, brainId) => {
    const intentId = (params.intentId as string) ?? ''
    const title = (params.title as string) ?? 'Untitled'
    const id = shortId()
    const now = new Date().toISOString()
    const brainFs = new BrainFs(brainRoot)

    brainFs.writeFile(
      brainId ?? '',
      `proposals/proposal-${id}.md`,
      `---
id: ${id}
type: proposal
intentId: ${intentId}
status: review
created: ${now}
---

# Proposal: ${title}

${(params.summary as string) ?? title}
`,
    )

    return { status: 'ok', proposalId: id }
  },

  'initiative.shape': async (params, brainRoot, brainId) => {
    const proposalId = (params.proposalId as string) ?? ''
    const brainFs = new BrainFs(brainRoot)
    const files = brainFs.listFiles(brainId ?? '')
    const proposalFile = files.find((f) => f.path.includes(proposalId))
    if (proposalFile) {
      const content = brainFs.readFile(brainId ?? '', proposalFile.path) ?? ''
      const updated = content.replace('status: review', 'status: approved')
      brainFs.writeFile(brainId ?? '', proposalFile.path, updated)
    }
    return { status: 'ok', message: 'Initiative shaped' }
  },

  'initiative.plan': async (params, brainRoot) => {
    const tasks = (params.tasks as string[]) ?? []
    const intentId = (params.intentId as string) ?? shortId()
    if (tasks.length > 0) {
      appendTasksToExecutionPlan(brainRoot, intentId, tasks)
    }
    return { status: 'ok', tasksCreated: tasks.length }
  },

  'initiative.execute': async () => {
    return { status: 'ok', message: 'Use Mission Control to drive execution' }
  },

  'initiative.list': async (_params, brainRoot, brainId) => {
    const brainFs = new BrainFs(brainRoot)
    const files = brainFs.listFiles(brainId ?? '')
    const initiatives: Array<{
      id: string
      title: string
      status: string
      squads: string[]
    }> = []

    for (const f of files) {
      if (!f.path.startsWith('intents/')) continue
      const content = brainFs.readFile(brainId ?? '', f.path)
      if (!content) continue
      const idMatch = content.match(/^id:\s*(.+)$/m)
      const statusMatch = content.match(/^status:\s*(.+)$/m)
      const titleMatch = content.match(/^# Intent:\s*(.+)$/m)
      if (!idMatch) continue
      initiatives.push({
        id: idMatch[1].trim(),
        title: titleMatch?.[1]?.trim() ?? f.name,
        status: statusMatch?.[1]?.trim() ?? 'captured',
        squads: [],
      })
    }

    return { initiatives }
  },

  'task.list': async (_params, brainRoot, brainId) => {
    const brainFs = new BrainFs(brainRoot)
    const files = brainFs.listFiles(brainId ?? '')
    return {
      tasks: files
        .filter((f) => f.path.startsWith('tasks/'))
        .map((f) => ({ path: f.path, name: f.name })),
    }
  },

  'discussion.open': async (params, brainRoot, brainId) => {
    const topic = (params.topic as string) ?? 'Untitled'
    const id = shortId()
    const now = new Date().toISOString()
    const brainFs = new BrainFs(brainRoot)

    brainFs.writeFile(
      brainId ?? '',
      `discussions/discussion-${id}.md`,
      `---
id: ${id}
type: discussion
status: open
created: ${now}
---

# Discussion: ${topic}
`,
    )

    return { status: 'ok', discussionId: id }
  },

  'discussion.respond': async (params, brainRoot, brainId) => {
    const discussionId = (params.discussionId as string) ?? ''
    const message = (params.message as string) ?? ''
    const from = (params.from as string) ?? 'agent'
    const brainFs = new BrainFs(brainRoot)
    const files = brainFs.listFiles(brainId ?? '')
    const file = files.find((f) => f.path.includes(discussionId))
    if (file) {
      const content = brainFs.readFile(brainId ?? '', file.path) ?? ''
      const now = new Date().toISOString()
      const updated = content + `\n## ${from} (${now})\n\n${message}\n`
      brainFs.writeFile(brainId ?? '', file.path, updated)
    }
    return { status: 'ok' }
  },

  'decision.record': async (params, brainRoot, brainId) => {
    const proposalId = (params.proposalId as string) ?? ''
    const outcome = (params.outcome as string) ?? 'approved'
    const id = shortId()
    const now = new Date().toISOString()
    const brainFs = new BrainFs(brainRoot)

    brainFs.writeFile(
      brainId ?? '',
      `decisions/decision-${id}.md`,
      `---
id: ${id}
type: decision
proposalId: ${proposalId}
outcome: ${outcome}
decidedBy: ceo
decidedAt: ${now}
---

# Decision: ${outcome === 'approved' ? 'Approved' : 'Rejected'}

${(params.rationale as string) ?? `CEO ${outcome} the proposal.`}
`,
    )

    return { status: 'ok', decisionId: id, outcome }
  },

  'decision.list_pending': async (_params, brainRoot, brainId) => {
    const brainFs = new BrainFs(brainRoot)
    const files = brainFs.listFiles(brainId ?? '')
    const decisions: Array<{
      id: string
      proposalId: string
      title: string
      summary: string
      status: string
    }> = []

    for (const f of files) {
      if (!f.path.startsWith('decisions/')) continue
      const content = brainFs.readFile(brainId ?? '', f.path)
      if (!content) continue
      const idMatch = content.match(/^id:\s*(.+)$/m)
      const outcomeMatch = content.match(/^outcome:\s*(.+)$/m)
      const proposalIdMatch = content.match(/^proposalId:\s*(.+)$/m)
      const titleMatch = content.match(/^# Decision:\s*(.+)$/m)
      if (!idMatch) continue
      decisions.push({
        id: idMatch[1].trim(),
        proposalId: proposalIdMatch?.[1]?.trim() ?? '',
        title: titleMatch?.[1]?.trim() ?? f.name,
        summary: outcomeMatch?.[1]?.trim() ?? '',
        status: outcomeMatch?.[1]?.trim() ?? 'review',
      })
    }

    return { decisions }
  },

  'briefing.generate': async (params, brainRoot, brainId) => {
    const id = shortId()
    const now = new Date().toISOString()
    const title = (params.title as string) ?? 'Session Briefing'
    const summary = (params.summary as string) ?? 'No summary provided.'
    const brainFs = new BrainFs(brainRoot)

    brainFs.writeFile(
      brainId ?? '',
      `briefings/briefing-${id}.md`,
      `---
id: ${id}
type: briefing
created: ${now}
---

# ${title}

${summary}
`,
    )

    return { status: 'ok', briefingId: id }
  },

  'config.get_skills': async (_params, brainRoot) => {
    return { skills: scanSkills(brainRoot) }
  },

  'config.get_rules': async (_params, brainRoot) => {
    return { rules: scanRules(brainRoot) }
  },
}
