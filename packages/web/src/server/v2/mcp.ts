import * as path from 'node:path'
import { getBrain } from '../../lib/local-data'
import { readV2Models } from '../../lib/v2/projection'
import { appendEvent, ensureV2Scaffold, nextId, writeRecordMarkdown } from '../../lib/v2/storage'
import type { V2Event, V2Stage } from '../../lib/v2/types'

export const V2_METHODS = new Set([
  'company.intent.capture',
  'initiative.propose',
  'initiative.shape',
  'initiative.plan',
  'initiative.execute',
  'discussion.open',
  'discussion.answer',
  'discussion.escalate',
  'discussion.resolve',
  'decision.record',
  'decision.list_pending',
  'briefing.generate',
  'briefing.publish',
  'workflow.tick',
  'workflow.autopilot.state',
])

export function isV2Method(method: string): boolean {
  return V2_METHODS.has(method)
}

function requireBrain(brainId: string) {
  const brain = getBrain(brainId)
  if (!brain) throw new Error(`brain_not_found:${brainId}`)
  ensureV2Scaffold(brain.path)
  return brain
}

function mapStage(method: string): V2Stage {
  if (method.startsWith('company.intent')) return 'intent'
  if (method.startsWith('initiative.propose')) return 'proposal'
  if (method.startsWith('initiative.shape')) return 'tribe_shaping'
  if (method.startsWith('initiative.plan')) return 'squad_planning'
  if (method.startsWith('initiative.execute')) return 'execution'
  if (method.startsWith('discussion')) return 'leadership_discussion'
  if (method.startsWith('decision')) return 'director_decision'
  return 'execution'
}

function summarizeParams(params: Record<string, unknown>): string {
  if (typeof params.title === 'string' && params.title.trim()) return params.title.trim()
  if (typeof params.message === 'string' && params.message.trim()) return params.message.trim()
  if (typeof params.initiativeId === 'string' && params.initiativeId.trim()) return `initiative=${params.initiativeId.trim()}`
  return 'update'
}

function lifecycleEvent(brainId: string, method: string, params: Record<string, unknown>): V2Event {
  const summary = summarizeParams(params)
  const stage = mapStage(method)
  const actor = (typeof params.actor === 'string' && params.actor.trim()) ? params.actor.trim() : 'project-operator'
  const layer =
    stage === 'director_decision' ? 'director'
      : stage === 'tribe_shaping' ? 'tribe'
        : stage === 'squad_planning' || stage === 'execution' ? 'squad'
          : 'system'

  const kind =
    method === 'company.intent.capture' ? 'initiative_created'
      : method === 'discussion.open' ? 'discussion_opened'
        : method === 'discussion.escalate' ? 'escalation_raised'
          : method === 'discussion.resolve' ? 'task_completed'
            : method === 'decision.record' ? 'decision_recorded'
              : method === 'initiative.plan' ? 'task_planned'
                : method === 'initiative.execute' ? 'task_started'
                  : method === 'briefing.generate' ? 'briefing_generated'
                    : method === 'briefing.publish' ? 'briefing_published'
                      : 'task_completed'

  return appendEvent(brainId, {
    actor,
    layer,
    stage,
    kind,
    initiativeId: typeof params.initiativeId === 'string' ? params.initiativeId : undefined,
    discussionId: typeof params.discussionId === 'string' ? params.discussionId : undefined,
    message: `${method}: ${summary}`,
    refs: typeof params.ref === 'string' ? [params.ref] : [],
  })
}

function upsertInitiative(brainPath: string, payload: { id?: string; title: string; stage: V2Stage; summary?: string }) {
  const id = payload.id || nextId('initiative')
  const rel = path.join('brian', 'initiatives', `${id}.md`)
  writeRecordMarkdown(
    brainPath,
    rel,
    {
      id,
      title: payload.title,
      stage: payload.stage,
      summary: payload.summary ?? '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    `# ${payload.title}\n\n## Stage\n${payload.stage}\n\n## Summary\n${payload.summary ?? ''}`
  )
  return id
}

function createRecord(brainPath: string, kind: 'discussions' | 'decisions' | 'briefings', title: string, data: Record<string, string>) {
  const id = nextId(kind.slice(0, -1))
  const rel = path.join('brian', kind, `${id}.md`)
  writeRecordMarkdown(
    brainPath,
    rel,
    {
      id,
      title,
      ...data,
      at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    `# ${title}\n\n${Object.entries(data).map(([key, value]) => `- ${key}: ${value}`).join('\n')}`
  )
  return { id, rel }
}

export function readV2ApiData(brainId: string) {
  const brain = requireBrain(brainId)
  return readV2Models(brainId, brain.path)
}

export function runV2McpCall(brainId: string, method: string, params: Record<string, unknown>): any {
  const brain = requireBrain(brainId)

  if (method === 'workflow.autopilot.state') {
    return {
      message: 'workflow.autopilot.state',
      autopilot: { active: false, mode: 'manual' },
      ...readV2ApiData(brainId),
    }
  }

  if (method === 'company.intent.capture') {
    const title = typeof params.title === 'string' ? params.title.trim() : 'Untitled intent'
    const initiativeId = upsertInitiative(brain.path, { title, stage: 'intent', summary: String(params.summary ?? '') })
    const event = lifecycleEvent(brainId, method, { ...params, initiativeId })
    return {
      message: `intent_captured:${initiativeId}`,
      event,
      ...readV2ApiData(brainId),
    }
  }

  if (method === 'initiative.propose' || method === 'initiative.shape' || method === 'initiative.plan' || method === 'initiative.execute') {
    const initiativeId = typeof params.initiativeId === 'string' && params.initiativeId.trim()
      ? params.initiativeId.trim()
      : upsertInitiative(brain.path, {
        title: typeof params.title === 'string' ? params.title.trim() : 'Untitled initiative',
        stage: mapStage(method),
        summary: String(params.summary ?? ''),
      })

    const stage = mapStage(method)
    upsertInitiative(brain.path, {
      id: initiativeId,
      title: typeof params.title === 'string' ? params.title.trim() : initiativeId,
      stage,
      summary: String(params.summary ?? ''),
    })

    const event = lifecycleEvent(brainId, method, { ...params, initiativeId })
    return {
      message: `${method}:${initiativeId}`,
      event,
      ...readV2ApiData(brainId),
    }
  }

  if (method === 'discussion.open') {
    const title = typeof params.title === 'string' ? params.title.trim() : 'Untitled discussion'
    const discussion = createRecord(brain.path, 'discussions', title, {
      layer: typeof params.layer === 'string' ? params.layer : 'squad',
      status: 'open',
      initiative_id: typeof params.initiativeId === 'string' ? params.initiativeId : '',
      unresolved_questions: '1',
    })
    const event = lifecycleEvent(brainId, method, { ...params, discussionId: discussion.id })
    return { message: `discussion_opened:${discussion.id}`, event, ...readV2ApiData(brainId) }
  }

  if (method === 'discussion.answer' || method === 'discussion.escalate' || method === 'discussion.resolve') {
    const event = lifecycleEvent(brainId, method, params)
    return { message: method, event, ...readV2ApiData(brainId) }
  }

  if (method === 'decision.record') {
    const title = typeof params.title === 'string' ? params.title.trim() : 'Director decision'
    const decision = createRecord(brain.path, 'decisions', title, {
      initiative_id: typeof params.initiativeId === 'string' ? params.initiativeId : '',
      status: typeof params.status === 'string' ? params.status : 'pending',
      rationale: typeof params.rationale === 'string' ? params.rationale : '',
    })
    const event = lifecycleEvent(brainId, method, { ...params, decisionId: decision.id })
    return { message: `decision_recorded:${decision.id}`, event, ...readV2ApiData(brainId) }
  }

  if (method === 'decision.list_pending') {
    const models = readV2ApiData(brainId)
    return {
      message: 'decision.list_pending',
      pending: models.companyState.pendingDecisions,
      ...models,
    }
  }

  if (method === 'briefing.generate') {
    const models = readV2ApiData(brainId)
    const title = `Director briefing ${new Date().toISOString().slice(0, 10)}`
    const briefing = createRecord(brain.path, 'briefings', title, {
      summary: `Pending decisions: ${models.companyState.pendingDecisions.length}; escalations: ${models.companyState.activeEscalations.length}; execution active: ${models.companyState.executionActive}`,
      published: 'false',
    })
    const event = lifecycleEvent(brainId, method, { ...params, briefingId: briefing.id })
    return { message: `briefing_generated:${briefing.id}`, event, ...readV2ApiData(brainId) }
  }

  if (method === 'briefing.publish') {
    const event = lifecycleEvent(brainId, method, params)
    return { message: 'briefing_published', event, ...readV2ApiData(brainId) }
  }

  if (method === 'workflow.tick') {
    const models = readV2ApiData(brainId)
    const open = models.initiatives.find((initiative) => initiative.status !== 'completed')
    if (!open) {
      return {
        message: 'workflow.tick:no_open_initiative',
        transition: null,
        ...models,
      }
    }

    const stages: V2Stage[] = ['intent', 'proposal', 'leadership_discussion', 'director_decision', 'tribe_shaping', 'squad_planning', 'execution']
    const idx = stages.indexOf(open.stage)
    const nextStage = stages[Math.min(stages.length - 1, idx + 1)]

    if (nextStage !== open.stage) {
      upsertInitiative(brain.path, {
        id: open.id,
        title: open.title,
        stage: nextStage,
        summary: open.summary,
      })
    }
    const event = lifecycleEvent(brainId, 'initiative.execute', {
      initiativeId: open.id,
      title: open.title,
      message: `workflow.tick transitioned ${open.id} ${open.stage} -> ${nextStage}`,
    })
    return {
      message: `workflow.tick:${open.id}:${open.stage}->${nextStage}`,
      transition: { initiativeId: open.id, from: open.stage, to: nextStage },
      event,
      ...readV2ApiData(brainId),
    }
  }

  throw new Error(`unsupported_v2_method:${method}`)
}
