import type { Command } from './index.js'

export const codex: Command = {
  description: 'Delegate work to Codex agents',
  async run(args) {
    const task = args.join(' ')
    if (!task) {
      console.log('Usage: brian codex <task description>')
      return
    }
    console.log(`Delegating to Codex: "${task}"`)
    console.log('(Codex integration requires OPENAI_API_KEY)')
  },
}
