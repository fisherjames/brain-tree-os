import type { Command } from './index.js'

export const brief: Command = {
  description: 'Generate briefing',
  async run() {
    const res = await fetch('http://localhost:3010/api/mcp/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: crypto.randomUUID(), method: 'briefing.generate', params: {} }),
    }).catch(() => null)

    if (!res?.ok) {
      console.log('Server not running. Start with `brian start` first.')
      return
    }

    const data = await res.json()
    if (data.error) console.log(`Error: ${data.error}`)
    else console.log('Briefing generated:', JSON.stringify(data.result, null, 2))
  },
}
