import type { Command } from './index.js'

export const mission: Command = {
  description: 'Launch Mission Control in browser',
  async run() {
    const open = await import('open')
    console.log('Opening Mission Control...')
    await open.default('http://localhost:5173/brains?tab=mission-control')
  },
}
