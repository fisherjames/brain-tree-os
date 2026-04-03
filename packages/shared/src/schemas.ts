import { z } from 'zod'

export const IntentSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  author: z.string().min(1),
  created: z.string().datetime(),
  status: z.enum(['captured', 'discussed', 'proposed', 'approved', 'rejected']),
  tags: z.array(z.string()).default([]),
})

export const ProposalSchema = z.object({
  id: z.string().uuid(),
  intentId: z.string().uuid(),
  title: z.string().min(1),
  summary: z.string(),
  rationale: z.string(),
  risks: z.array(z.string()).default([]),
  status: z.enum(['draft', 'review', 'approved', 'rejected']),
  ceoFeedback: z.string().optional(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
})

export const DecisionSchema = z.object({
  id: z.string().uuid(),
  proposalId: z.string().uuid(),
  outcome: z.enum(['approved', 'rejected']),
  rationale: z.string(),
  feedback: z.string().optional(),
  decidedBy: z.string(),
  decidedAt: z.string().datetime(),
})

export const InitiativeSchema = z.object({
  id: z.string().uuid(),
  proposalId: z.string().uuid(),
  title: z.string().min(1),
  status: z.enum(['shaping', 'planning', 'executing', 'verifying', 'merging', 'complete']),
  branch: z.string().optional(),
  squads: z.array(z.string()).default([]),
  created: z.string().datetime(),
  updated: z.string().datetime(),
})

export const TaskSchema = z.object({
  id: z.string().uuid(),
  initiativeId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().default(''),
  status: z.enum(['todo', 'in_progress', 'done', 'blocked', 'cancelled']),
  assignedSquad: z.string().optional(),
  branch: z.string().optional(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
})

export const DiscussionSchema = z.object({
  id: z.string().uuid(),
  intentId: z.string().uuid().optional(),
  topic: z.string().min(1),
  participants: z.array(z.string()).default([]),
  messages: z
    .array(
      z.object({
        from: z.string(),
        content: z.string(),
        timestamp: z.string().datetime(),
      }),
    )
    .default([]),
  status: z.enum(['open', 'resolved', 'escalated']),
  created: z.string().datetime(),
})

export const BriefingSchema = z.object({
  id: z.string().uuid(),
  initiativeId: z.string().uuid(),
  title: z.string().min(1),
  summary: z.string(),
  outcomes: z.array(z.string()).default([]),
  lessonsLearned: z.array(z.string()).default([]),
  created: z.string().datetime(),
})

export const HandoffSchema = z.object({
  id: z.string().uuid(),
  from: z.string().min(1),
  to: z.string().min(1),
  context: z.string(),
  deliverables: z.array(z.string()),
  blockers: z.array(z.string()).default([]),
  level: z.enum(['squad', 'tribe', 'director']),
  created: z.string().datetime(),
})

export const SquadSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  agents: z.array(
    z.object({
      role: z.string(),
      skills: z.array(z.string()).default([]),
      rules: z.array(z.string()).default([]),
    }),
  ),
  active: z.boolean().default(true),
})

export const ExecutionStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['pending', 'in_progress', 'done', 'blocked', 'skipped']),
  initiativeId: z.string().optional(),
  taskId: z.string().optional(),
})
