import type { Command } from './index.js'

export const start: Command = {
  description: 'Start the Brian viewer',
  async run(_args) {
    const open = await import('open')
    console.log('Starting Brian server...')
    console.log('Open http://localhost:3010 in your browser')
    await open.default('http://localhost:3010')
  },
}
