import type { Command } from './index.js'

export const decide: Command = {
  description: 'Record or resolve a decision',
  async run(args) {
    const outcome = args[0]
    if (!outcome || !['approve', 'reject'].includes(outcome)) {
      console.log('Usage: brian decide <approve|reject> [feedback]')
      return
    }

    const feedback = args.slice(1).join(' ')
    const res = await fetch('http://localhost:3010/api/mcp/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        method: 'decision.record',
        params: { outcome: outcome === 'approve' ? 'approved' : 'rejected', feedback },
      }),
    }).catch(() => null)

    if (!res?.ok) {
      console.log('Server not running. Start with `brian start` first.')
      return
    }

    const data = await res.json()
    if (data.error) console.log(`Error: ${data.error}`)
    else console.log(`Decision recorded: ${outcome}`)
  },
}
