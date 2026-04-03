import { describe, it, expect } from 'vitest'
import { captureFailureBundle, generateRemediationTask } from './verification'

describe('verification', () => {
  it('captures failure bundles from failed gates', () => {
    const results = [
      { name: 'format', ok: true, output: '', retried: false },
      { name: 'lint', ok: false, output: 'lint error', retried: false },
      { name: 'typecheck', ok: false, output: 'ts error', retried: false },
    ]
    const bundles = captureFailureBundle('task-1', results)
    expect(bundles).toHaveLength(2)
    expect(bundles[0].gate).toBe('lint')
    expect(bundles[1].gate).toBe('typecheck')
    expect(bundles[0].taskId).toBe('task-1')
  })

  it('returns empty for all-passing gates', () => {
    const results = [
      { name: 'format', ok: true, output: '', retried: false },
      { name: 'lint', ok: true, output: '', retried: false },
    ]
    const bundles = captureFailureBundle('task-1', results)
    expect(bundles).toHaveLength(0)
  })

  it('generates remediation task markdown', () => {
    const bundle = {
      taskId: 'task-1',
      gate: 'lint',
      output: 'error: unused variable',
      timestamp: '2026-03-30T00:00:00.000Z',
    }
    const md = generateRemediationTask(bundle)
    expect(md).toContain('Remediation: lint failure')
    expect(md).toContain('error: unused variable')
    expect(md).toContain('task-1')
  })
})
