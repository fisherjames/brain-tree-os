import { z } from 'zod'
import {
  IntentSchema,
  ProposalSchema,
  DecisionSchema,
  InitiativeSchema,
  TaskSchema,
  DiscussionSchema,
  BriefingSchema,
  HandoffSchema,
  SquadSchema,
  ExecutionStepSchema,
} from './schemas.js'

export type Intent = z.infer<typeof IntentSchema>
export type Proposal = z.infer<typeof ProposalSchema>
export type Decision = z.infer<typeof DecisionSchema>
export type Initiative = z.infer<typeof InitiativeSchema>
export type Task = z.infer<typeof TaskSchema>
export type Discussion = z.infer<typeof DiscussionSchema>
export type Briefing = z.infer<typeof BriefingSchema>
export type Handoff = z.infer<typeof HandoffSchema>
export type Squad = z.infer<typeof SquadSchema>
export type ExecutionStep = z.infer<typeof ExecutionStepSchema>

export type WorkflowStage =
  | 'intent'
  | 'discussion'
  | 'proposal'
  | 'ceo_review'
  | 'shaping'
  | 'planning'
  | 'execution'
  | 'verification'
  | 'merge'
  | 'briefing'

export interface McpCallMessage {
  type: 'mcp.call'
  id: string
  method: string
  params: Record<string, unknown>
  brainId?: string
}

export interface McpResultMessage {
  type: 'mcp.result'
  id: string
  result?: unknown
  error?: string
}

export interface McpEventMessage {
  type: 'mcp.event'
  event: string
  data: unknown
}

export interface SubscribeMessage {
  type: 'subscribe'
  brainId: string
}

export type WsClientMessage = McpCallMessage | SubscribeMessage

export type WsServerMessage =
  | McpResultMessage
  | McpEventMessage
  | { type: 'full-update'; brainId: string; files: unknown[]; executionPlan: string | null }
  | { type: 'error'; message: string }

export interface PolicyRequirement {
  stage: WorkflowStage
  requiredMcpMethods: string[]
  requiredSkills: string[]
  requiredRules: string[]
}

export interface VerificationGate {
  name: 'format' | 'lint' | 'typecheck' | 'test:unit' | 'test:e2e' | 'doctrine-lint'
  command: string
  blocking: boolean
  retries: number
}

export interface FailureBundle {
  taskId: string
  gate: string
  output: string
  timestamp: string
  remediationTask?: string
}

export interface BrainMeta {
  id: string
  name: string
  description: string
  created: string
  version: string
}
