import { commands, type Command } from './index.js'

export const help: Command = {
  description: 'Show help',
  async run() {
    console.log('\nbrian v2.0.0\n')
    console.log('Usage: brian [command] [options]\n')
    console.log('Commands:')

    const maxLen = Math.max(...Object.keys(commands).map((k) => k.length))
    for (const [name, cmd] of Object.entries(commands)) {
      console.log(`  ${name.padEnd(maxLen + 2)}${cmd.description}`)
    }

    console.log()
  },
}
