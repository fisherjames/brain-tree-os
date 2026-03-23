#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { spawn } from 'node:child_process'
import * as net from 'node:net'

const CONFIG_DIR = path.join(os.homedir(), '.braintree-os')
const CLAUDE_COMMANDS_DIR = path.join(os.homedir(), '.claude', 'commands')
const SERVER_JSON = path.join(CONFIG_DIR, 'server.json')

const VERSION = '0.1.0'

type AgentMode = 'claude' | 'codex' | 'none'

type InstallResult = {
  agentMode: AgentMode
  commandCount: number
}

function ensureConfigDir() {
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
  const configFile = path.join(CONFIG_DIR, 'brains.json')
  if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, JSON.stringify({ brains: [] }, null, 2) + '\n')
  }
}

function parseAgentMode(args: string[]): AgentMode {
  const inlineArg = args.find(arg => arg.startsWith('--agent='))
  const rawValue = inlineArg ? inlineArg.split('=')[1] : (() => {
    const idx = args.indexOf('--agent')
    return idx >= 0 ? args[idx + 1] : undefined
  })()

  if (!rawValue) return 'claude'
  if (rawValue === 'claude' || rawValue === 'codex' || rawValue === 'none') {
    return rawValue
  }

  throw new Error(`Unsupported agent mode: ${rawValue}`)
}

async function installClaudeCommands(): Promise<number> {
  fs.mkdirSync(CLAUDE_COMMANDS_DIR, { recursive: true })
  const commandsSource = path.join(__dirname, '..', 'commands')
  if (!fs.existsSync(commandsSource)) return 0

  const files = fs.readdirSync(commandsSource).filter(f => f.endsWith('.md'))
  for (const file of files) {
    const dest = path.join(CLAUDE_COMMANDS_DIR, file)
    fs.copyFileSync(path.join(commandsSource, file), dest)
  }
  return files.length
}

async function installAgentIntegration(agentMode: AgentMode): Promise<InstallResult> {
  if (agentMode !== 'claude') {
    return { agentMode, commandCount: 0 }
  }

  const commandCount = await installClaudeCommands()
  return { agentMode, commandCount }
}

async function findFreePort(preferred: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(preferred, () => {
      server.close(() => resolve(preferred))
    })
    server.on('error', () => {
      const server2 = net.createServer()
      server2.listen(0, () => {
        const port = (server2.address() as net.AddressInfo).port
        server2.close(() => resolve(port))
      })
    })
  })
}

async function openBrowser(url: string) {
  try {
    const open = (await import('open')).default
    await open(url)
  } catch {
    // Browser open failed silently, URL is shown in welcome message
  }
}

function saveServerConfig(port: number) {
  fs.writeFileSync(
    SERVER_JSON,
    JSON.stringify({ port, pid: process.pid, startedAt: new Date().toISOString() }, null, 2) + '\n'
  )
}

function cleanupServerConfig() {
  try {
    if (fs.existsSync(SERVER_JSON)) {
      fs.unlinkSync(SERVER_JSON)
    }
  } catch {
    // ignore cleanup errors
  }
}

function showWelcome(port: number, installResult: InstallResult) {
  const url = `http://localhost:${port}/brains`
  console.log('')
  console.log(`  BrainTree OS v${VERSION}`)
  console.log('')

  if (installResult.agentMode === 'claude') {
    console.log(`  > ${installResult.commandCount} commands installed to ~/.claude/commands/`)
  } else if (installResult.agentMode === 'codex') {
    console.log('  > Codex mode selected (no Claude slash commands installed)')
  } else {
    console.log('  > Agent integration skipped (--agent none)')
  }

  console.log(`  > Server running at ${url}`)
  console.log('')
  console.log('  +-------------------------------------------------------------+')
  console.log('  |                                                             |')
  console.log('  |  To create your first brain:                                |')
  console.log('  |                                                             |')
  console.log('  |  1. Open a new terminal                                     |')
  console.log('  |  2. Create a project folder                                 |')
  console.log('  |     mkdir -p ~/brains/my-project                            |')

  if (installResult.agentMode === 'claude') {
    console.log('  |  3. Start Claude Code there                                 |')
    console.log('  |     cd ~/brains/my-project && claude                        |')
    console.log('  |  4. Run the init command                                    |')
    console.log('  |     /init-braintree                                         |')
  } else if (installResult.agentMode === 'codex') {
    console.log('  |  3. Start Codex there                                       |')
    console.log('  |     cd ~/brains/my-project && codex                         |')
    console.log('  |  4. Ask Codex to scaffold a BrainTree brain                 |')
    console.log('  |     (see the Codex section in the README)                   |')
  } else {
    console.log('  |  3. Open your preferred AI tool there                       |')
    console.log('  |  4. Create BRAIN-INDEX.md, CLAUDE.md, Handoffs/, and        |')
    console.log('  |     an execution plan using the BrainTree format            |')
  }

  console.log('  |                                                             |')
  console.log('  |  Your brain will appear at the URL above.                   |')
  console.log('  +-------------------------------------------------------------+')
  console.log('')
  console.log('  Press Ctrl+C to stop the server.')
  console.log('')
}

function showHelp() {
  console.log(`
  brain-tree-os v${VERSION} - Open source brain viewer

  Usage:
    brain-tree-os                      Start the server and open browser
    brain-tree-os status              Show registered brains
    brain-tree-os help                Show this help

  Options:
    --port <number>                   Custom port (default: 3000)
    --no-open                         Don't auto-open browser
    --agent <claude|codex|none>       Choose integration mode (default: claude)
`)
}

function showStatus(agentMode: AgentMode) {
  const configFile = path.join(CONFIG_DIR, 'brains.json')
  if (!fs.existsSync(configFile)) {
    console.log('  No brains registered yet.')
    if (agentMode === 'claude') {
      console.log('  Run /init-braintree in Claude Code to create your first brain.')
    } else if (agentMode === 'codex') {
      console.log('  Start BrainTree with --agent codex and ask Codex to scaffold your brain files.')
    } else {
      console.log('  Create a BrainTree folder with BRAIN-INDEX.md, CLAUDE.md, and Handoffs/ to get started.')
    }
    return
  }
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
  const brains = config.brains || []
  if (brains.length === 0) {
    console.log('  No brains registered yet.')
    if (agentMode === 'claude') {
      console.log('  Run /init-braintree in Claude Code to create your first brain.')
    } else if (agentMode === 'codex') {
      console.log('  Start BrainTree with --agent codex and ask Codex to scaffold your brain files.')
    } else {
      console.log('  Create a BrainTree folder with BRAIN-INDEX.md, CLAUDE.md, and Handoffs/ to get started.')
    }
    return
  }
  console.log(`  Registered brains (${brains.length}):`)
  for (const brain of brains) {
    console.log(`    ${brain.name} -> ${brain.path}`)
  }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('help') || args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }

  let agentMode: AgentMode
  try {
    agentMode = parseAgentMode(args)
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    showHelp()
    process.exit(1)
    return
  }

  if (args.includes('status')) {
    showStatus(agentMode)
    return
  }

  const noOpen = args.includes('--no-open')
  const portIdx = args.indexOf('--port')
  const preferredPort = portIdx >= 0 ? parseInt(args[portIdx + 1], 10) : 3000

  ensureConfigDir()

  const installResult = await installAgentIntegration(agentMode)
  const port = await findFreePort(preferredPort)
  saveServerConfig(port)

  const webDir = path.join(__dirname, '..', '..', 'web')
  const serverScript = path.join(webDir, 'src', 'server', 'custom-server.ts')

  const isBuilt = fs.existsSync(path.join(webDir, '.next'))

  let child: ReturnType<typeof spawn>

  if (isBuilt) {
    const serverDist = path.join(webDir, 'dist', 'server', 'custom-server.js')
    if (fs.existsSync(serverDist)) {
      child = spawn('node', [serverDist], {
        env: { ...process.env, PORT: String(port), NODE_ENV: 'production' },
        stdio: 'inherit',
        cwd: webDir,
      })
    } else {
      child = spawn('npx', ['next', 'start', '-p', String(port)], {
        env: { ...process.env, PORT: String(port) },
        stdio: 'inherit',
        cwd: webDir,
      })
    }
  } else {
    child = spawn('npx', ['tsx', serverScript], {
      env: { ...process.env, PORT: String(port), NODE_ENV: 'development' },
      stdio: 'inherit',
      cwd: webDir,
    })
  }

  child.on('error', (err) => {
    cleanupServerConfig()
    console.error('Failed to start server:', err.message)
    process.exit(1)
  })

  setTimeout(() => {
    showWelcome(port, installResult)
    if (!noOpen) openBrowser(`http://localhost:${port}/brains`)
  }, 2000)

  const cleanup = () => {
    cleanupServerConfig()
    child.kill('SIGINT')
    setTimeout(() => process.exit(0), 1000)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  child.on('exit', (code) => {
    cleanupServerConfig()
    process.exit(code ?? 0)
  })
}

main().catch((err) => {
  cleanupServerConfig()
  console.error(err)
  process.exit(1)
})
