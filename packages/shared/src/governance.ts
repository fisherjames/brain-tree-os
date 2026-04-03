import type { WorkflowStage, PolicyRequirement, VerificationGate } from './types.js'

const TRANSITIONS: Record<WorkflowStage, WorkflowStage[]> = {
  intent: ['discussion'],
  discussion: ['proposal'],
  proposal: ['ceo_review'],
  ceo_review: ['shaping', 'discussion'],
  shaping: ['planning'],
  planning: ['execution'],
  execution: ['verification'],
  verification: ['merge'],
  merge: ['briefing'],
  briefing: [],
}

export function validTransitions(from: WorkflowStage): WorkflowStage[] {
  return TRANSITIONS[from] ?? []
}

export function canTransition(from: WorkflowStage, to: WorkflowStage): boolean {
  return validTransitions(from).includes(to)
}

export function isRejectTransition(from: WorkflowStage, to: WorkflowStage): boolean {
  return from === 'ceo_review' && to === 'discussion'
}

export const VERIFICATION_GATES: VerificationGate[] = [
  { name: 'format', command: 'npm run format', blocking: true, retries: 0 },
  { name: 'lint', command: 'npm run lint', blocking: true, retries: 0 },
  { name: 'typecheck', command: 'npm run typecheck', blocking: true, retries: 0 },
  { name: 'test:unit', command: 'npm run test:unit', blocking: true, retries: 0 },
  { name: 'test:e2e', command: 'npm run test:e2e', blocking: true, retries: 1 },
  { name: 'doctrine-lint', command: 'npm run doctrine-lint', blocking: true, retries: 0 },
]

export const DEFAULT_POLICIES: PolicyRequirement[] = [
  {
    stage: 'intent',
    requiredMcpMethods: ['company.intent.capture'],
    requiredSkills: [],
    requiredRules: [],
  },
  {
    stage: 'discussion',
    requiredMcpMethods: ['discussion.open', 'discussion.respond'],
    requiredSkills: [],
    requiredRules: [],
  },
  {
    stage: 'proposal',
    requiredMcpMethods: ['initiative.propose'],
    requiredSkills: [],
    requiredRules: [],
  },
  {
    stage: 'ceo_review',
    requiredMcpMethods: ['decision.record'],
    requiredSkills: [],
    requiredRules: [],
  },
  {
    stage: 'execution',
    requiredMcpMethods: ['initiative.execute'],
    requiredSkills: [],
    requiredRules: [],
  },
  {
    stage: 'verification',
    requiredMcpMethods: ['team.run_verification_suite'],
    requiredSkills: [],
    requiredRules: [],
  },
  {
    stage: 'merge',
    requiredMcpMethods: ['team.merge_queue_execute'],
    requiredSkills: [],
    requiredRules: [],
  },
  {
    stage: 'briefing',
    requiredMcpMethods: ['briefing.generate'],
    requiredSkills: [],
    requiredRules: [],
  },
]

export function validatePolicy(
  stage: WorkflowStage,
  availableMethods: string[],
): {
  valid: boolean
  missing: string[]
} {
  const policy = DEFAULT_POLICIES.find((p) => p.stage === stage)
  if (!policy) return { valid: true, missing: [] }

  const missing = policy.requiredMcpMethods.filter((m) => !availableMethods.includes(m))
  return { valid: missing.length === 0, missing }
}
