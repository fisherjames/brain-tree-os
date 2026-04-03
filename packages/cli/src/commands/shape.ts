import type { Command } from './index.js'

export const shape: Command = {
  description: 'Shape initiative into squads/tasks',
  async run() {
    const res = await fetch('http://localhost:3010/api/mcp/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: crypto.randomUUID(), method: 'initiative.shape', params: {} }),
    }).catch(() => null)

    if (!res?.ok) {
      console.log('Server not running. Start with `brian start` first.')
      return
    }

    const data = await res.json()
    if (data.error) console.log(`Error: ${data.error}`)
    else console.log('Initiative shaped:', JSON.stringify(data.result, null, 2))
  },
}
