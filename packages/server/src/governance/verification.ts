import { execFileSync } from 'child_process'
import { VERIFICATION_GATES } from '@brian/shared'
import type { FailureBundle } from '@brian/shared'

export interface GateResult {
  name: string
  ok: boolean
  output: string
  retried: boolean
}

export function runVerificationSuite(repoRoot: string): GateResult[] {
  return VERIFICATION_GATES.map((gate) => runGate(repoRoot, gate.name, gate.retries))
}

function runGate(repoRoot: string, name: string, maxRetries: number): GateResult {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const output = execFileSync('npm', ['run', name], {
        cwd: repoRoot,
        encoding: 'utf8',
        timeout: 120_000,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      return { name, ok: true, output, retried: attempt > 0 }
    } catch (error) {
      if (attempt === maxRetries) {
        const output = error instanceof Error ? error.message : 'unknown error'
        return { name, ok: false, output, retried: attempt > 0 }
      }
    }
  }
  return { name, ok: false, output: 'unreachable', retried: false }
}

export function captureFailureBundle(taskId: string, results: GateResult[]): FailureBundle[] {
  return results
    .filter((r) => !r.ok)
    .map((r) => ({
      taskId,
      gate: r.name,
      output: r.output,
      timestamp: new Date().toISOString(),
    }))
}

export function generateRemediationTask(bundle: FailureBundle): string {
  return `---
type: task
status: todo
gate: ${bundle.gate}
created: ${bundle.timestamp}
---

# Remediation: ${bundle.gate} failure

The \`${bundle.gate}\` verification gate failed for task ${bundle.taskId}.

## Error Output
\`\`\`
${bundle.output.slice(0, 2000)}
\`\`\`

## Action Required
Fix the issues reported above and re-run verification.
`
}
