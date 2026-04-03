import type { Command } from './index.js'

export const verify: Command = {
  description: 'Run verification suite',
  async run() {
    console.log('Running verification suite...')
    const res = await fetch('http://localhost:3010/api/mcp/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        method: 'team.run_verification_suite',
        params: {},
      }),
    }).catch(() => null)

    if (!res?.ok) {
      console.log('Server not running. Start with `brian start` first.')
      return
    }

    const data = await res.json()
    if (data.error) {
      console.log(`Verification error: ${data.error}`)
      return
    }

    const gates = data.result?.gates ?? []
    for (const gate of gates) {
      const status = gate.ok ? 'PASS' : 'FAIL'
      console.log(`  [${status}] ${gate.name}`)
    }

    const allPass = gates.every((g: { ok: boolean }) => g.ok)
    console.log(allPass ? '\nAll gates passed.' : '\nSome gates failed.')
    process.exit(allPass ? 0 : 1)
  },
}
