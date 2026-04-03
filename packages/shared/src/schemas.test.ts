import { describe, it, expect } from 'vitest'
import {
  IntentSchema,
  ProposalSchema,
  DecisionSchema,
  TaskSchema,
  HandoffSchema,
  SquadSchema,
} from './schemas'

describe('schemas', () => {
  it('validates a valid intent', () => {
    const result = IntentSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Test intent',
      author: 'test',
      created: '2026-03-30T00:00:00.000Z',
      status: 'captured',
    })
    expect(result.success).toBe(true)
  })

  it('rejects intent with invalid status', () => {
    const result = IntentSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Test',
      author: 'test',
      created: '2026-03-30T00:00:00.000Z',
      status: 'invalid_status',
    })
    expect(result.success).toBe(false)
  })

  it('validates a valid proposal', () => {
    const result = ProposalSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      intentId: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Test proposal',
      summary: 'summary',
      rationale: 'because',
      status: 'draft',
      created: '2026-03-30T00:00:00.000Z',
      updated: '2026-03-30T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('validates a decision', () => {
    const result = DecisionSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      proposalId: '550e8400-e29b-41d4-a716-446655440001',
      outcome: 'approved',
      rationale: 'looks good',
      decidedBy: 'ceo',
      decidedAt: '2026-03-30T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('validates a task', () => {
    const result = TaskSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      initiativeId: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Do the thing',
      status: 'todo',
      created: '2026-03-30T00:00:00.000Z',
      updated: '2026-03-30T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('validates a handoff', () => {
    const result = HandoffSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      from: 'agent-a',
      to: 'agent-b',
      context: 'completed the work',
      deliverables: ['file.ts'],
      level: 'squad',
      created: '2026-03-30T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('validates a squad', () => {
    const result = SquadSchema.safeParse({
      id: 'core',
      name: 'Core Squad',
      agents: [{ role: 'engineer', skills: ['typescript'], rules: [] }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects handoff with invalid level', () => {
    const result = HandoffSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      from: 'a',
      to: 'b',
      context: 'ctx',
      deliverables: [],
      level: 'invalid',
      created: '2026-03-30T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })
})
