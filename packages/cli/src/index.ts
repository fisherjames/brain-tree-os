#!/usr/bin/env node
import { commands } from './commands/index.js'

const [command = 'start', ...args] = process.argv.slice(2)

async function main() {
  const handler = commands[command]
  if (!handler) {
    console.error(`Unknown command: ${command}`)
    commands.help.run([])
    process.exit(1)
  }
  await handler.run(args)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
