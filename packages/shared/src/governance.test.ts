import { describe, it, expect } from 'vitest'
import { canTransition, validTransitions, isRejectTransition, validatePolicy } from './governance'

describe('governance transitions', () => {
  it('allows intent -> discussion', () => {
    expect(canTransition('intent', 'discussion')).toBe(true)
  })

  it('blocks intent -> execution', () => {
    expect(canTransition('intent', 'execution')).toBe(false)
  })

  it('allows ceo_review -> shaping (approve)', () => {
    expect(canTransition('ceo_review', 'shaping')).toBe(true)
  })

  it('allows ceo_review -> discussion (reject)', () => {
    expect(canTransition('ceo_review', 'discussion')).toBe(true)
  })

  it('identifies reject transition', () => {
    expect(isRejectTransition('ceo_review', 'discussion')).toBe(true)
    expect(isRejectTransition('ceo_review', 'shaping')).toBe(false)
  })

  it('returns valid transitions for each stage', () => {
    expect(validTransitions('intent')).toEqual(['discussion'])
    expect(validTransitions('discussion')).toEqual(['proposal'])
    expect(validTransitions('ceo_review')).toEqual(['shaping', 'discussion'])
    expect(validTransitions('briefing')).toEqual([])
  })

  it('validates policy with available methods', () => {
    const result = validatePolicy('intent', ['company.intent.capture'])
    expect(result.valid).toBe(true)
    expect(result.missing).toEqual([])
  })

  it('reports missing methods in policy check', () => {
    const result = validatePolicy('intent', [])
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('company.intent.capture')
  })
})
