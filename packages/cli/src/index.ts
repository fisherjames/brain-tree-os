#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import * as crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import * as net from 'node:net'
import * as readline from 'node:readline/promises'

const CONFIG_DIR = path.join(os.homedir(), '.braintree-os')
const BRAINS_JSON = path.join(CONFIG_DIR, 'brains.json')
const SERVER_JSON = path.join(CONFIG_DIR, 'server.json')

const VERSION = '0.2.0'

type BrainEntry = {
  id: string
  name: string
  description: string
  path: string
  created: string
}

type BrainsConfig = {
  brains: BrainEntry[]
}

type BrainMeta = {
  id: string
  name: string
  description: string
  created: string
  version: string
}

type BrainStep = {
  id: string
  phase: number
  title: string
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked'
  dependencies: string[]
}

type InitPreset = 'core' | 'codex-team'

type InitOptions = {
  name: string
  description: string
  preset: InitPreset
  linkExistingDocs: boolean
  addPackageScripts: boolean
}

function ensureConfigDir() {
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
  if (!fs.existsSync(BRAINS_JSON)) {
    fs.writeFileSync(BRAINS_JSON, JSON.stringify({ brains: [] }, null, 2) + '\n')
  }
}

function readBrainsConfig(): BrainsConfig {
  ensureConfigDir()
  try {
    const parsed = JSON.parse(fs.readFileSync(BRAINS_JSON, 'utf8'))
    return { brains: Array.isArray(parsed.brains) ? parsed.brains : [] }
  } catch {
    return { brains: [] }
  }
}

function writeBrainsConfig(config: BrainsConfig) {
  ensureConfigDir()
  fs.writeFileSync(BRAINS_JSON, JSON.stringify(config, null, 2) + '\n')
}

function parseOption(args: string[], name: string): string | undefined {
  const inline = args.find(arg => arg.startsWith(`${name}=`))
  if (inline) return inline.slice(name.length + 1)
  const idx = args.indexOf(name)
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1]
  return undefined
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(name) || args.some(arg => arg.startsWith(`${name}=`))
}

function isoNow(): string {
  return new Date().toISOString()
}

function humanNow(): string {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function resolveProjectName(brainRoot: string, explicitName?: string): string {
  if (explicitName && explicitName.trim()) return explicitName.trim()

  const packageJsonPath = path.join(brainRoot, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      if (typeof packageJson.name === 'string' && packageJson.name.trim()) {
        return packageJson.name.trim()
      }
    } catch {
      // ignore invalid package.json
    }
  }

  return path.basename(brainRoot)
}

function resolveProjectDescription(brainRoot: string, explicitDescription?: string): string {
  if (explicitDescription && explicitDescription.trim()) return explicitDescription.trim()

  const packageJsonPath = path.join(brainRoot, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      if (typeof packageJson.description === 'string' && packageJson.description.trim()) {
        return packageJson.description.trim()
      }
    } catch {
      // ignore invalid package.json
    }
  }

  return 'Codex-first BrainTree workspace for this project.'
}

function findBrainRoot(startDir: string): string | null {
  let current = path.resolve(startDir)
  while (true) {
    if (
      fs.existsSync(path.join(current, 'BRAIN-INDEX.md')) ||
      fs.existsSync(path.join(current, '.braintree', 'brain.json'))
    ) {
      return current
    }

    const parent = path.dirname(current)
    if (parent === current) return null
    current = parent
  }
}

function readBrainMeta(brainRoot: string): BrainMeta | null {
  const metaPath = path.join(brainRoot, '.braintree', 'brain.json')
  if (!fs.existsSync(metaPath)) return null

  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8')) as BrainMeta
  } catch {
    return null
  }
}

function registerBrain(entry: BrainEntry) {
  const config = readBrainsConfig()
  const existing = config.brains.findIndex(brain => brain.id === entry.id || brain.path === entry.path)
  if (existing >= 0) {
    config.brains[existing] = entry
  } else {
    config.brains.push(entry)
  }
  writeBrainsConfig(config)
}

function writeFileIfMissing(filePath: string, content: string) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content)
  }
}

function updateFileIfExists(filePath: string, updater: (content: string) => string) {
  if (!fs.existsSync(filePath)) return
  const current = fs.readFileSync(filePath, 'utf8')
  const updated = updater(current)
  if (updated !== current) {
    fs.writeFileSync(filePath, updated)
  }
}

function readJsonIfExists(filePath: string): any | null {
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function hasPackageJson(brainRoot: string): boolean {
  return fs.existsSync(path.join(brainRoot, 'package.json'))
}

function detectScripts(brainRoot: string): string[] {
  const packageJsonPath = path.join(brainRoot, 'package.json')
  if (!fs.existsSync(packageJsonPath)) return []

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    return typeof packageJson.scripts === 'object' && packageJson.scripts
      ? Object.keys(packageJson.scripts).slice(0, 6)
      : []
  } catch {
    return []
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function findMarkdownFiles(root: string): string[] {
  const files: string[] = []

  function walk(dir: string) {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry.name === 'node_modules') continue
      if (entry.name.startsWith('.')) continue

      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  }

  walk(root)
  return files
}

function findExecutionPlanPath(brainRoot: string): string | null {
  const directCandidates = [
    path.join(brainRoot, 'Execution-Plan.md'),
    path.join(brainRoot, 'Execution-Plan', 'Execution-Plan.md'),
    path.join(brainRoot, 'Execution_Plan', 'Execution_Plan.md'),
  ]

  for (const candidate of directCandidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  const matches = findMarkdownFiles(brainRoot).filter(file => {
    const lower = path.basename(file).toLowerCase()
    return lower === 'execution-plan.md' || lower === 'execution_plan.md'
  })

  return matches[0] ?? null
}

function normalizeStatus(raw: string): BrainStep['status'] {
  const value = raw.trim().toLowerCase().replace(/\s+/g, '_')
  if (value.startsWith('complete')) return 'completed'
  if (value.startsWith('in_progress') || value.startsWith('in-progress') || value.startsWith('inprogress')) {
    return 'in_progress'
  }
  if (value.startsWith('blocked')) return 'blocked'
  return 'not_started'
}

function parseDependencies(raw: string): string[] {
  if (!raw || raw.trim().toLowerCase() === 'none') return []
  return raw
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
}

function parseExecutionPlanSteps(content: string): BrainStep[] {
  const steps: BrainStep[] = []
  const lines = content.split('\n')
  let currentPhase = 0
  let current: BrainStep | null = null
  let phaseStepCounter = 0

  function pushCurrent() {
    if (current) {
      steps.push(current)
      current = null
    }
  }

  for (const line of lines) {
    const phaseMatch = line.match(/^##\s+Phase\s+(\d+)/i)
    if (phaseMatch) {
      pushCurrent()
      currentPhase = Number(phaseMatch[1])
      phaseStepCounter = 0
      continue
    }

    const explicitStepMatch = line.match(/^#{2,5}\s+Step\s+([\d.]+[a-z]?)\s*:\s*(.+)$/i)
    if (explicitStepMatch) {
      pushCurrent()
      current = {
        id: explicitStepMatch[1],
        phase: currentPhase,
        title: explicitStepMatch[2].trim(),
        status: 'not_started',
        dependencies: [],
      }
      continue
    }

    const headingMatch = line.match(/^###\s+(.+)$/)
    if (headingMatch) {
      pushCurrent()
      const heading = headingMatch[1].trim()
      const prefixedMatch = heading.match(/^([A-Za-z]+-\d+(?:\.\d+)?)\s+(.*)$/)
      const numberedMatch = heading.match(/^(\d+(?:\.\d+)?)\s+(.*)$/)
      phaseStepCounter += 1

      current = {
        id: prefixedMatch?.[1] ?? numberedMatch?.[1] ?? `${currentPhase}.${phaseStepCounter}`,
        phase: currentPhase,
        title: (prefixedMatch?.[2] ?? numberedMatch?.[2] ?? heading).trim(),
        status: 'not_started',
        dependencies: [],
      }
      continue
    }

    if (!current) continue

    const statusMatch = line.match(/^-+\s+\*\*Status\*\*:\s*(.+)$/i)
    if (statusMatch) {
      current.status = normalizeStatus(statusMatch[1])
      continue
    }

    const dependencyMatch = line.match(/^-+\s+\*\*Dependencies\*\*:\s*(.+)$/i)
    if (dependencyMatch) {
      current.dependencies = parseDependencies(dependencyMatch[1])
    }
  }

  pushCurrent()
  return steps
}

function readExecutionPlanSteps(brainRoot: string): { path: string; steps: BrainStep[] } | null {
  const executionPlanPath = findExecutionPlanPath(brainRoot)
  if (!executionPlanPath) return null

  try {
    const content = fs.readFileSync(executionPlanPath, 'utf8')
    return { path: executionPlanPath, steps: parseExecutionPlanSteps(content) }
  } catch {
    return null
  }
}

function resolveFolderContext(
  brainRoot: string,
  candidates: Array<{ dir: string; index: string; name: string }>
): { dir: string; indexPath: string; indexName: string } | null {
  for (const candidate of candidates) {
    const indexPath = path.join(brainRoot, candidate.dir, candidate.index)
    if (fs.existsSync(indexPath)) {
      return {
        dir: path.dirname(indexPath),
        indexPath,
        indexName: candidate.name,
      }
    }
  }
  return null
}

function ensureLinkedNote(
  directory: string,
  indexPath: string,
  indexName: string,
  fileName: string,
  title: string,
  body: string
): string {
  const notePath = path.join(directory, fileName)

  writeFileIfMissing(
    notePath,
    `# ${title}\n\n> Part of [[${indexName}]]\n\n${body.trim()}\n`
  )

  updateFileIfExists(indexPath, content => {
    const link = `- [[${fileName.replace('.md', '')}]]`
    return content.includes(link) ? content : `${content.trimEnd()}\n${link}\n`
  })

  return notePath
}

function printSteps(label: string, steps: BrainStep[]) {
  if (steps.length === 0) return
  console.log(`  ${label}:`)
  for (const step of steps) {
    console.log(`  - ${step.id}: ${step.title}`)
  }
  console.log('')
}

function updateExecutionPlanStepStatus(executionPlanPath: string, stepId: string, status: BrainStep['status']) {
  updateFileIfExists(executionPlanPath, content => {
    const lines = content.split('\n')
    let inTarget = false
    let updated = false

    for (let i = 0; i < lines.length; i += 1) {
      const explicit = lines[i].match(/^#{2,5}\s+Step\s+([\d.]+[a-z]?)\s*:/i)
      const prefixed = lines[i].match(/^###\s+([A-Za-z]+-\d+(?:\.\d+)?)\s+/)
      const numbered = lines[i].match(/^###\s+(\d+(?:\.\d+)?)\s+/)

      if (explicit || prefixed || numbered) {
        const candidateId = explicit?.[1] ?? prefixed?.[1] ?? numbered?.[1] ?? ''
        inTarget = candidateId === stepId
      }

      if (inTarget && lines[i].match(/^-+\s+\*\*Status\*\*:/i)) {
        lines[i] = `- **Status**: ${status}`
        updated = true
        inTarget = false
      }
    }

    return updated ? `${lines.join('\n')}\n` : content
  })
}

function commandPromptSummary(brainRoot: string) {
  console.log(`  Brain root: ${brainRoot}`)
  console.log('  Codex slash commands you can use inside the chat:')
  console.log('  - /init      Generate or refresh AGENTS.md instructions')
  console.log('  - /plan      Switch the current chat into planning mode')
  console.log('  - /resume    Resume an old Codex conversation transcript')
  console.log('  - /status    Show Codex session configuration and token usage')
  console.log('')
  console.log('  BrainTree workflow commands live in the shell:')
  console.log('  - brain-tree-os init')
  console.log('  - brain-tree-os resume')
  console.log('  - brain-tree-os wrap-up')
  console.log('  - brain-tree-os status')
  console.log('  - brain-tree-os notes <scope>')
  console.log('  - brain-tree-os plan <step>')
  console.log('  - brain-tree-os sprint')
  console.log('  - brain-tree-os sync')
  console.log('  - brain-tree-os feature <name>')
  console.log('')
}

async function runInherited(command: string, args: string[], cwd: string = process.cwd()): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: process.env,
    })

    child.on('error', reject)
    child.on('exit', code => resolve(code ?? 0))
  })
}

function managedMarkdownRelativePaths(): string[] {
  return [
    'BRAIN-INDEX.md',
    'AGENTS.md',
    'Execution-Plan.md',
    path.join('01_Product', 'Product.md'),
    path.join('01_Product', 'Project-Goals.md'),
    path.join('01_Product', 'Current-Scope.md'),
    path.join('02_Engineering', 'Engineering.md'),
    path.join('02_Engineering', 'Architecture.md'),
    path.join('02_Engineering', 'Codebase-Map.md'),
    path.join('03_Operations', 'Operations.md'),
    path.join('03_Operations', 'Runbook.md'),
    path.join('03_Operations', 'Workflow.md'),
    path.join('Agents', 'Agents.md'),
    path.join('Agents', 'Project-Operator.md'),
    path.join('Assets', 'Assets.md'),
    path.join('Templates', 'Templates.md'),
    path.join('Templates', 'Handoff-Template.md'),
    path.join('Handoffs', 'Handoffs.md'),
    path.join('Handoffs', 'handoff-000.md'),
  ]
}

async function askText(rl: readline.Interface, prompt: string, defaultValue: string): Promise<string> {
  const answer = (await rl.question(`${prompt} [${defaultValue}]: `)).trim()
  return answer || defaultValue
}

async function askPreset(rl: readline.Interface, defaultPreset: InitPreset): Promise<InitPreset> {
  const answer = (await rl.question(`Preset ([c]ore / [t]eam) [${defaultPreset === 'codex-team' ? 'team' : 'core'}]: `)).trim().toLowerCase()
  if (!answer) return defaultPreset
  if (answer === 'c' || answer === 'core') return 'core'
  if (answer === 't' || answer === 'team' || answer === 'codex-team') return 'codex-team'
  return defaultPreset
}

async function askYesNo(rl: readline.Interface, prompt: string, defaultValue: boolean): Promise<boolean> {
  const hint = defaultValue ? 'Y/n' : 'y/N'
  const answer = (await rl.question(`${prompt} [${hint}]: `)).trim().toLowerCase()
  if (!answer) return defaultValue
  return answer === 'y' || answer === 'yes'
}

async function resolveInitOptions(brainRoot: string, args: string[]): Promise<InitOptions> {
  const defaultName = resolveProjectName(brainRoot, parseOption(args, '--name'))
  const defaultDescription = resolveProjectDescription(brainRoot, parseOption(args, '--description'))
  const explicitPreset = parseOption(args, '--preset')
  const defaultPreset: InitPreset = explicitPreset === 'core' || explicitPreset === 'codex-team'
    ? explicitPreset
    : 'codex-team'

  const explicitLinkExistingDocs = hasFlag(args, '--link-existing-docs')
    ? true
    : hasFlag(args, '--no-link-existing-docs')
      ? false
      : undefined

  const explicitAddPackageScripts = hasFlag(args, '--package-scripts')
    ? true
    : hasFlag(args, '--no-package-scripts')
      ? false
      : undefined

  const canAddPackageScripts = hasPackageJson(brainRoot)
  const shouldPrompt = !hasFlag(args, '--yes') && Boolean(process.stdin.isTTY && process.stdout.isTTY)

  if (!shouldPrompt) {
    return {
      name: defaultName,
      description: defaultDescription,
      preset: defaultPreset,
      linkExistingDocs: explicitLinkExistingDocs ?? defaultPreset === 'codex-team',
      addPackageScripts: canAddPackageScripts && (explicitAddPackageScripts ?? defaultPreset === 'codex-team'),
    }
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    console.log('')
    console.log('  BrainTree init wizard')
    console.log('')
    const name = await askText(rl, 'Brain name', defaultName)
    const description = await askText(rl, 'Description', defaultDescription)
    const preset = await askPreset(rl, defaultPreset)
    const linkExistingDocs = explicitLinkExistingDocs ?? await askYesNo(
      rl,
      'Link existing markdown docs into the brain',
      preset === 'codex-team'
    )
    const addPackageScripts = canAddPackageScripts
      ? explicitAddPackageScripts ?? await askYesNo(
          rl,
          'Add package.json brain helper scripts',
          preset === 'codex-team'
        )
      : false

    console.log('')

    return { name, description, preset, linkExistingDocs, addPackageScripts }
  } finally {
    rl.close()
  }
}

function importableMarkdownFiles(brainRoot: string): string[] {
  const excludedDirs = new Set([
    '.braintree',
    '01_Product',
    '02_Engineering',
    '03_Operations',
    '04_Operations',
    'Agents',
    'Assets',
    'Templates',
    'Handoffs',
    'Commands',
    'node_modules',
  ])
  const managed = new Set(managedMarkdownRelativePaths())

  return findMarkdownFiles(brainRoot)
    .map(file => path.relative(brainRoot, file))
    .filter(relative => {
      if (managed.has(relative)) return false
      const firstSegment = relative.split(path.sep)[0]
      return !excludedDirs.has(firstSegment)
    })
    .sort()
}

function injectPackageScripts(brainRoot: string, preset: InitPreset) {
  if (!hasPackageJson(brainRoot)) return
  const packageJsonPath = path.join(brainRoot, 'package.json')
  const packageJson = readJsonIfExists(packageJsonPath)
  if (!packageJson || typeof packageJson !== 'object') return

  const scripts = typeof packageJson.scripts === 'object' && packageJson.scripts ? packageJson.scripts : {}
  const additions: Record<string, string> = {
    'brain:viewer': 'brain-tree-os',
    'brain:resume': 'brain-tree-os resume',
    'brain:status': 'brain-tree-os status',
    'brain:sync': 'brain-tree-os sync',
    'brain:wrap': 'brain-tree-os wrap-up',
    'brain:notes': 'brain-tree-os notes',
    'brain:plan': 'brain-tree-os plan',
    'brain:feature': 'brain-tree-os feature',
  }

  if (preset === 'codex-team') {
    additions['brain:start'] = 'brain-tree-os resume && codex'
    additions['brain:end'] = 'brain-tree-os wrap-up && codex "Fill the newest handoff in Handoffs/, update the relevant brain notes, and update Execution-Plan.md if progress changed."'
  }

  let changed = false
  for (const [key, value] of Object.entries(additions)) {
    if (!scripts[key]) {
      scripts[key] = value
      changed = true
    }
  }

  if (!changed) return
  packageJson.scripts = scripts
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
}

function linkExistingDocs(brainRoot: string) {
  const docs = importableMarkdownFiles(brainRoot)
  if (docs.length === 0) return

  const basenames = new Map<string, number>()
  for (const relative of docs) {
    const base = path.basename(relative, '.md')
    basenames.set(base, (basenames.get(base) || 0) + 1)
  }

  const existingDocsPath = path.join(brainRoot, '03_Operations', 'Existing-Docs.md')
  const lines = [
    '# Existing Docs',
    '',
    '> Part of [[Operations]]',
    '',
    'Imported markdown docs that already existed in the repository before the brain scaffold was created.',
    '',
    '## Linked Files',
  ]

  for (const relative of docs) {
    const base = path.basename(relative, '.md')
    const unique = basenames.get(base) === 1
    lines.push(unique ? `- [[${base}]] - \`${relative}\`` : `- \`${relative}\``)

    const filePath = path.join(brainRoot, relative)
    const current = fs.readFileSync(filePath, 'utf8')
    if (current.includes('> Part of [[')) continue

    const titleMatch = current.match(/^(# .+\n)/)
    if (titleMatch) {
      const updated = current.replace(titleMatch[1], `${titleMatch[1]}\n> Part of [[Existing-Docs]]\n\n`)
      fs.writeFileSync(filePath, updated)
    } else {
      fs.writeFileSync(filePath, `> Part of [[Existing-Docs]]\n\n${current}`)
    }
  }
  lines.push('')

  writeFileIfMissing(existingDocsPath, `${lines.join('\n')}\n`)
  updateFileIfExists(path.join(brainRoot, '03_Operations', 'Operations.md'), content => {
    const link = '- [[Existing-Docs]]'
    return content.includes(link) ? content : `${content.trimEnd()}\n${link}\n`
  })
}

function createBrainScaffold(brainRoot: string, options: InitOptions): BrainMeta {
  const created = isoNow()
  const id = crypto.randomUUID()
  const scripts = detectScripts(brainRoot)
  const scriptList = scripts.length > 0 ? scripts.map(script => `- \`${script}\``).join('\n') : '- Add your common project commands here'
  const preset = options.preset
  const hasCommands = preset === 'codex-team'
  const name = options.name
  const description = options.description
  const meta: BrainMeta = {
    id,
    name,
    description,
    created,
    version: '1.0.0',
  }

  writeFileIfMissing(
    path.join(brainRoot, '.braintree', 'brain.json'),
    JSON.stringify(meta, null, 2) + '\n'
  )

  writeFileIfMissing(
    path.join(brainRoot, 'BRAIN-INDEX.md'),
    `# ${name}

> ${description}

## Folders
- [[Product]] - goals, scope, users, and roadmap notes
- [[Engineering]] - architecture, codebase structure, and technical decisions
- [[Operations]] - runbooks, workflows, release notes, and maintenance tasks
${hasCommands ? '- [[Commands]] - repeatable Codex start, planning, note-sync, and wrap-up loops\n' : ''}- [[Agents]] - Codex-facing operating rules and reusable role notes
- [[Handoffs]] - session continuity notes
- [[Templates]] - reusable templates for future sessions
- [[Assets]] - screenshots, PDFs, diagrams, and reference files

## Root Files
- [[AGENTS]] - Codex instructions for this repository
- [[Execution-Plan]] - build order, status, and next priorities

## Session Log
- [[handoff-000]] - Brain initialized on ${created.slice(0, 10)}
`
  )

  writeFileIfMissing(
    path.join(brainRoot, 'AGENTS.md'),
    `# ${name} Agent Guide

> Part of [[BRAIN-INDEX]]

## Session Start
- Read [[BRAIN-INDEX]], [[Execution-Plan]], and the latest entry in [[Handoffs]] before making non-trivial changes.
- Open the relevant folder index before changing code or docs.
${hasCommands ? '- Open [[Commands]] and the relevant role note in [[Agents]] when using the richer Codex workflow layer.\n' : ''}- Prefer small, verifiable edits over speculative rewrites.

## Working Rules
- Keep project-specific decisions in the brain files, not only in chat history.
- Update the matching brain note when architecture, priorities, or risks change.
- Use \`brain-tree-os notes "<scope>"\` after changing a top-level or workflow note so downstream notes do not drift.
- End meaningful sessions with a new handoff note and execution plan updates.

## Verification
- Run the narrowest realistic check for the files you changed.
- If verification is incomplete, record the gap in the handoff.
`
  )

  writeFileIfMissing(
    path.join(brainRoot, 'Execution-Plan.md'),
    `# Execution Plan

> Part of [[BRAIN-INDEX]]

## Phase 1 - Brain Setup

### EP-1 Brain scaffold
- **Status**: completed
- **Goal**: Create the BrainTree structure and register this project with the viewer.

## Phase 2 - Current Project Work

### EP-2 Inspect the existing codebase
- **Status**: not_started
- **Goal**: Summarize the real architecture, current priorities, and active risks for this project.

### EP-3 Replace placeholder notes with project-specific notes
- **Status**: not_started
- **Goal**: Refine the product, engineering, and operations notes from the actual repository.

### EP-4 Link existing docs and workflows into the brain
- **Status**: not_started
- **Goal**: Pull the existing repo docs and routines into the brain so Codex sees the real operating context.

### EP-5 Start the next meaningful task
- **Status**: not_started
- **Goal**: Use the updated brain to drive the next real code change.
`
  )

  writeFileIfMissing(
    path.join(brainRoot, '01_Product', 'Product.md'),
    `# Product

> Part of [[BRAIN-INDEX]]

This area tracks the user-facing purpose of the project, the scope, and the current priorities.

## Key Files
- [[Project-Goals]]
- [[Current-Scope]]
`
  )

  writeFileIfMissing(
    path.join(brainRoot, '01_Product', 'Project-Goals.md'),
    `# Project Goals

> Part of [[Product]]

- Replace this note with the real goals of the existing project.
- Capture who the user is, what problem the project solves, and what "done" looks like.
`
  )

  writeFileIfMissing(
    path.join(brainRoot, '01_Product', 'Current-Scope.md'),
    `# Current Scope

> Part of [[Product]]

- Record the features already implemented.
- Record what is intentionally deferred.
- Record any obvious mismatch between the current codebase and the intended product shape.
`
  )

  writeFileIfMissing(
    path.join(brainRoot, '02_Engineering', 'Engineering.md'),
    `# Engineering

> Part of [[BRAIN-INDEX]]

This area tracks the real code structure, runtime model, and implementation constraints.

## Key Files
- [[Architecture]]
- [[Codebase-Map]]
`
  )

  writeFileIfMissing(
    path.join(brainRoot, '02_Engineering', 'Architecture.md'),
    `# Architecture

> Part of [[Engineering]]

- Replace this with the real runtime architecture of the project.
- Note the main entry points, services, frameworks, and persistence model.
`
  )

  writeFileIfMissing(
    path.join(brainRoot, '02_Engineering', 'Codebase-Map.md'),
    `# Codebase Map

> Part of [[Engineering]]

## Important Commands
${scriptList}

## Important Paths
- Replace this with the real directories and files that matter most.
`
  )

  writeFileIfMissing(
    path.join(brainRoot, '03_Operations', 'Operations.md'),
    `# Operations

> Part of [[BRAIN-INDEX]]

This area tracks how to run the project, verify changes, and keep session continuity intact.

## Key Files
- [[Runbook]]
- [[Workflow]]
- [[Existing-Docs]]
`
  )

  writeFileIfMissing(
    path.join(brainRoot, '03_Operations', 'Existing-Docs.md'),
    `# Existing Docs

> Part of [[Operations]]

Imported markdown docs from the repository should be linked here when you run init with doc linking enabled.
`
  )

  writeFileIfMissing(
    path.join(brainRoot, '03_Operations', 'Runbook.md'),
    `# Runbook

> Part of [[Operations]]

- Replace this with the real setup, run, test, and deploy commands for the project.
- Capture any environment prerequisites or local services.
${options.addPackageScripts ? '\n## Helper Commands\n- `pnpm brain:viewer`\n- `pnpm brain:resume`\n- `pnpm brain:status`\n- `pnpm brain:sync`\n- `pnpm brain:wrap`\n- `pnpm brain:notes -- "<scope>"`\n' : ''}
`
  )

  writeFileIfMissing(
    path.join(brainRoot, '03_Operations', 'Workflow.md'),
    `# Workflow

> Part of [[Operations]]

${hasCommands
  ? `1. Read [[BRAIN-INDEX]], [[AGENTS]], [[Execution-Plan]], and the latest handoff.
2. Use [[Commands]] for the canonical session workflow loops.
3. Open the relevant area note before editing code or docs.
4. Use \`brain-tree-os notes "<scope>"\` after changing a top-level or workflow note.
5. Create a new handoff before ending a meaningful session.`
  : `1. Read [[BRAIN-INDEX]], [[AGENTS]], [[Execution-Plan]], and the latest handoff.
2. Inspect the relevant area before editing code.
3. Make a narrow, testable change.
4. Update the brain files and create a new handoff before ending the session.`}
`
  )

  if (hasCommands) {
    writeFileIfMissing(
      path.join(brainRoot, 'Commands', 'Commands.md'),
      `# Commands

> Part of [[BRAIN-INDEX]]

This folder defines the repeatable Codex workflow layer for the repository.

## Key Files
- [[Start-Loop]]
- [[Plan-Loop]]
- [[Notes-Loop]]
- [[Team-Board]]
- [[End-Loop]]
`
    )

    writeFileIfMissing(
      path.join(brainRoot, 'Commands', 'Start-Loop.md'),
      `# Start Loop

> Part of [[Commands]]

## Canonical Start
\`\`\`bash
brain-tree-os resume
codex
${options.addPackageScripts ? 'pnpm brain:start' : ''}
\`\`\`

## Sequence
1. Read the core brain files shown by \`brain-tree-os resume\`.
2. Open the relevant note index and role note before non-trivial work.
3. Keep the work scoped and update the brain when decisions change.
`
    )

    writeFileIfMissing(
      path.join(brainRoot, 'Commands', 'Plan-Loop.md'),
      `# Plan Loop

> Part of [[Commands]]

## Canonical Planning
\`\`\`bash
brain-tree-os plan EP-2
${options.addPackageScripts ? 'pnpm brain:plan -- EP-2' : ''}
\`\`\`

## Sequence
1. Use \`brain-tree-os plan\` to create a linked planning note from [[Execution-Plan]].
2. Use Codex \`/plan\` inside the chat to refine that step into an implementation sequence.
3. Record decisions and verification before editing code.
`
    )

    writeFileIfMissing(
      path.join(brainRoot, 'Commands', 'Notes-Loop.md'),
      `# Notes Loop

> Part of [[Commands]]

## Canonical Reconciliation
\`\`\`bash
brain-tree-os notes "Product"
${options.addPackageScripts ? 'pnpm brain:notes -- "Product"' : ''}
\`\`\`

## Sequence
1. Run \`brain-tree-os notes "<scope>"\` after changing a top-level or workflow note.
2. Let Codex reconcile only the downstream notes that are now stale.
3. Run \`brain-tree-os sync\` after the update if you want an explicit graph check.
`
    )

    writeFileIfMissing(
      path.join(brainRoot, 'Commands', 'Team-Board.md'),
      `# Team Board

> Part of [[BRAIN-INDEX]]

This note is a viewer-facing placeholder for projects that later add repo-local orchestration or parallel work tracking.

## Phase 99 - Team Board

### Step 99.1: No active team workflow configured
- **Status**: not_started
- Add repo-local orchestration only if the project genuinely needs it.
`
    )

    writeFileIfMissing(
      path.join(brainRoot, 'Commands', 'End-Loop.md'),
      `# End Loop

> Part of [[Commands]]

## Canonical Wrap-Up
\`\`\`bash
brain-tree-os wrap-up
${options.addPackageScripts ? 'pnpm brain:end' : ''}
\`\`\`

## Sequence
1. Create the next handoff note.
2. Fill it with what changed, verification, risks, and the next step.
3. Update [[Execution-Plan]] if progress changed.
4. If you use the generated \`pnpm brain:end\` helper, remember it opens a fresh Codex launch rather than writing into a live existing session.
`
    )
  }

  writeFileIfMissing(
    path.join(brainRoot, 'Agents', 'Agents.md'),
    `# Agents

> Part of [[BRAIN-INDEX]]

Codex-specific operating notes live here.

## Key Files
- [[Project-Operator]]
${hasCommands ? '- [[Founder-CEO]]\n- [[Product-Lead]]\n- [[Growth-Marketing]]\n- [[Frontend-Engineer]]\n- [[Backend-Engineer]]\n- [[Mobile-Engineer]]\n- [[DevOps-Release]]\n' : ''}`
  )

  writeFileIfMissing(
    path.join(brainRoot, 'Agents', 'Project-Operator.md'),
    `# Project Operator

> Part of [[Agents]]

## Purpose
Use this agent note for routine implementation work in Codex.

## Instructions
- Read the current brain state before coding.
- Prefer targeted edits and explicit verification.
- Keep decisions in the repository brain, not only in session memory.
`
  )

  if (hasCommands) {
    const roleNotes: Array<[string, string, string]> = [
      ['Founder-CEO.md', 'Founder / CEO', 'Use this note when shaping direction, priorities, positioning, or business tradeoffs. Keep the output high-level, explicit about tradeoffs, and tied back to the actual product constraints.'],
      ['Product-Lead.md', 'Product Lead', 'Use this note for scope shaping, requirement clarity, rollout planning, and user-facing tradeoffs. Convert vague ideas into concrete acceptance criteria before coding starts.'],
      ['Growth-Marketing.md', 'Growth / Marketing', 'Use this note for messaging, landing pages, funnels, lifecycle copy, or launch planning. Keep claims honest and tie messaging to the real product behavior.'],
      ['Frontend-Engineer.md', 'Frontend Engineer', 'Use this note for web UI, design systems, rendering behavior, and browser-facing user flows. Preserve existing UX patterns unless the product direction clearly changed.'],
      ['Backend-Engineer.md', 'Backend Engineer', 'Use this note for APIs, data contracts, services, and persistence concerns. Be explicit about schema, error handling, and contract drift risks.'],
      ['Mobile-Engineer.md', 'Mobile Engineer', 'Use this note for native or mobile-specific UI, device behavior, and performance-sensitive flows. Keep verification grounded in the platform reality.'],
      ['DevOps-Release.md', 'DevOps / Release', 'Use this note for build pipelines, environment setup, deploys, observability, or operational safety work. Prefer reversible changes and clear rollback guidance.'],
    ]

    for (const [fileName, title, body] of roleNotes) {
      writeFileIfMissing(
        path.join(brainRoot, 'Agents', fileName),
        `# ${title}

> Part of [[Agents]]

## Purpose
${body}

## Instructions
- Read the relevant brain notes before changing implementation details.
- Keep decisions explicit in the repository brain when workflows or priorities shift.
- Prefer the narrowest realistic verification for the work in this role.
`
      )
    }
  }

  writeFileIfMissing(
    path.join(brainRoot, 'Assets', 'Assets.md'),
    `# Assets

> Part of [[BRAIN-INDEX]]

Store screenshots, diagrams, PDFs, and other external reference material here.
`
  )

  writeFileIfMissing(
    path.join(brainRoot, 'Templates', 'Templates.md'),
    `# Templates

> Part of [[BRAIN-INDEX]]

## Key Files
- [[Handoff-Template]]
`
  )

  writeFileIfMissing(
    path.join(brainRoot, 'Templates', 'Handoff-Template.md'),
    `# Handoff Template

> Part of [[Templates]]

## Session

## Summary

## Files Updated

## Verification

## Open Risks

## Recommended Next Step
`
  )

  writeFileIfMissing(
    path.join(brainRoot, 'Handoffs', 'Handoffs.md'),
    `# Handoffs

> Part of [[BRAIN-INDEX]]

## Session History
- [[handoff-000]] - Brain initialized
`
  )

  writeFileIfMissing(
    path.join(brainRoot, 'Handoffs', 'handoff-000.md'),
    `# handoff-000

> Part of [[Handoffs]]

## Session
${humanNow()}

## Summary
Initialized a Codex-first BrainTree brain for this existing project.

## Files Updated
- Added the BrainTree scaffold and registration metadata.

## Verification
- Brain files created
- Brain registered in ~/.braintree-os/brains.json

## Open Risks
- Placeholder notes still need to be replaced with project-specific content.

## Recommended Next Step
Inspect the real repository and replace the placeholder notes in [[Product]], [[Engineering]], and [[Operations]].
`
  )

  if (options.addPackageScripts) {
    injectPackageScripts(brainRoot, preset)
  }

  if (options.linkExistingDocs) {
    linkExistingDocs(brainRoot)
  }

  return meta
}

function formatViewerUrl(brainId: string): string | null {
  if (!fs.existsSync(SERVER_JSON)) return null
  try {
    const server = JSON.parse(fs.readFileSync(SERVER_JSON, 'utf8'))
    if (server && server.port) {
      return `http://localhost:${server.port}/brains/${brainId}`
    }
  } catch {
    return null
  }
  return null
}

function printStatus(brainRoot?: string) {
  if (brainRoot) {
    const meta = readBrainMeta(brainRoot)
    if (meta) {
      console.log(`  Brain: ${meta.name}`)
      console.log(`  Path: ${brainRoot}`)
      const viewerUrl = formatViewerUrl(meta.id)
      if (viewerUrl) console.log(`  Viewer: ${viewerUrl}`)
      return
    }
  }

  const config = readBrainsConfig()
  if (config.brains.length === 0) {
    console.log('  No brains registered yet.')
    console.log('  Run `brain-tree-os init` inside an existing project to create one.')
    return
  }

  console.log(`  Registered brains (${config.brains.length}):`)
  for (const brain of config.brains) {
    console.log(`    ${brain.name} -> ${brain.path}`)
  }
}

function printResume(brainRoot: string) {
  const handoffDir = path.join(brainRoot, 'Handoffs')
  const latestHandoff = fs.existsSync(handoffDir)
    ? fs.readdirSync(handoffDir)
        .filter(file => /^handoff-.*\.md$/.test(file))
        .sort()
        .at(-1)
    : null

  console.log('')
  console.log('  Resume this brain by reading:')
  console.log(`  - ${path.join(brainRoot, 'BRAIN-INDEX.md')}`)
  console.log(`  - ${path.join(brainRoot, 'AGENTS.md')}`)
  console.log(`  - ${path.join(brainRoot, 'Execution-Plan.md')}`)
  if (fs.existsSync(path.join(brainRoot, 'Commands', 'Commands.md'))) {
    console.log(`  - ${path.join(brainRoot, 'Commands', 'Commands.md')}`)
  }
  if (latestHandoff) {
    console.log(`  - ${path.join(handoffDir, latestHandoff)}`)
  }
  console.log('')
  console.log('  Then inspect the relevant folder index before editing code.')
  console.log('')
}

function buildNotesPrompt(brainRoot: string, scope: string): string {
  const commandsPath = path.join(brainRoot, 'Commands', 'Commands.md')
  const commandsText = fs.existsSync(commandsPath)
    ? ` Also read ${commandsPath}.`
    : ''

  return [
    `Reconcile the BrainTree notes in ${brainRoot} after changes to "${scope}".`,
    `Read ${path.join(brainRoot, 'BRAIN-INDEX.md')}, ${path.join(brainRoot, 'AGENTS.md')}, ${path.join(brainRoot, 'Execution-Plan.md')}, and the latest handoff in ${path.join(brainRoot, 'Handoffs')}.${commandsText}`,
    `Treat "${scope}" as the authoritative changed note, area, or workflow input.`,
    'Update only the downstream brain notes whose assumptions, priorities, workflows, or command references are now stale.',
    'Keep wikilinks valid, preserve the existing structure, and avoid changing product code unless a note references a stale path or command.',
    'End with a concise summary of which notes changed and whether any manual follow-up is still needed.',
  ].join(' ')
}

function createWrapUp(brainRoot: string): string {
  const handoffDir = path.join(brainRoot, 'Handoffs')
  fs.mkdirSync(handoffDir, { recursive: true })

  const existing = fs.readdirSync(handoffDir)
    .filter(file => /^handoff-\d+\.md$/.test(file))
    .map(file => Number(file.match(/^handoff-(\d+)\.md$/)?.[1] || '0'))

  const next = String((existing.length > 0 ? Math.max(...existing) : 0) + 1).padStart(3, '0')
  const fileName = `handoff-${next}.md`
  const handoffPath = path.join(handoffDir, fileName)

  writeFileIfMissing(
    handoffPath,
    `# ${fileName.replace('.md', '')}

> Part of [[Handoffs]]

## Session
${humanNow()}

## Summary

## Files Updated

## Verification

## Open Risks

## Recommended Next Step
`
  )

  const handoffsIndex = path.join(handoffDir, 'Handoffs.md')
  writeFileIfMissing(
    handoffsIndex,
    '# Handoffs\n\n> Part of [[BRAIN-INDEX]]\n\n## Session History\n'
  )

  updateFileIfExists(handoffsIndex, content => {
    const entry = `- [[${fileName.replace('.md', '')}]] - Session wrap-up`
    return content.includes(entry) ? content : content.trimEnd() + '\n' + entry + '\n'
  })

  return handoffPath
}

async function findFreePort(preferred: number): Promise<number> {
  return new Promise(resolve => {
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
    if (fs.existsSync(SERVER_JSON)) fs.unlinkSync(SERVER_JSON)
  } catch {
    // ignore cleanup errors
  }
}

function showWelcome(port: number) {
  const url = `http://localhost:${port}/brains`
  console.log('')
  console.log(`  BrainTree OS v${VERSION}`)
  console.log('')
  console.log('  > Codex-first workflow enabled')
  console.log(`  > Server running at ${url}`)
  console.log('')
  console.log('  +-------------------------------------------------------------+')
  console.log('  |                                                             |')
  console.log('  |  To create a brain for an existing project:                 |')
  console.log('  |                                                             |')
  console.log('  |  1. Open that project in a terminal                         |')
  console.log('  |  2. Run: brain-tree-os init                                 |')
  console.log('  |  3. Run: brain-tree-os resume                               |')
  console.log('  |  4. Open Codex in the project                               |')
  console.log('  |  5. Optional in Codex: /plan or /status                     |')
  console.log('  |                                                             |')
  console.log('  |  The brain will appear in the viewer automatically.         |')
  console.log('  +-------------------------------------------------------------+')
  console.log('')
  console.log('  Press Ctrl+C to stop the server.')
  console.log('')
}

function showHelp() {
  console.log(`
  brain-tree-os v${VERSION} - Codex-first brain viewer and workflow

  Usage:
    brain-tree-os                    Start the viewer
    brain-tree-os init              Create a BrainTree scaffold in the current project
    brain-tree-os resume            Show the files to read before working
    brain-tree-os wrap-up           Create the next handoff template
    brain-tree-os status            Show the current brain or all registered brains
    brain-tree-os notes <scope>     Reconcile downstream notes after top-level edits
    brain-tree-os plan [step]       Create a step plan note for an execution-plan step
    brain-tree-os sprint            Create a sprint note from ready and in-progress work
    brain-tree-os sync              Scan the brain for broken links and disconnected files
    brain-tree-os feature <name>    Create a feature spec note inside the brain
    brain-tree-os codex             Show the Codex slash-command mapping for BrainTree
    brain-tree-os help              Show this help

  Viewer options:
    --port <number>                 Custom port (default: 3000)
    --no-open                       Don't auto-open browser

  Init options:
    --name <text>                   Override the brain name
    --description <text>            Override the brain description
    --preset <core|codex-team>      Choose the scaffold depth (default: codex-team)
    --yes                           Accept init defaults without prompts
    --link-existing-docs            Link existing markdown docs into the brain
    --no-link-existing-docs         Skip linking existing markdown docs
    --package-scripts               Add package.json brain helper scripts when possible
    --no-package-scripts            Skip package.json helper scripts
`)
}

async function startViewer(args: string[]) {
  const noOpen = hasFlag(args, '--no-open')
  const preferredPort = Number(parseOption(args, '--port') || '3000')

  ensureConfigDir()

  const port = await findFreePort(preferredPort)
  saveServerConfig(port)

  const webDir = path.join(__dirname, '..', '..', 'web')
  const serverScript = path.join(webDir, 'src', 'server', 'custom-server.ts')
  const serverDist = path.join(webDir, 'dist', 'server', 'custom-server.js')
  const isBuilt = fs.existsSync(path.join(webDir, '.next'))

  let child: ReturnType<typeof spawn>

  if (isBuilt && fs.existsSync(serverDist)) {
    child = spawn('node', [serverDist], {
      env: { ...process.env, PORT: String(port), NODE_ENV: 'production' },
      stdio: 'inherit',
      cwd: webDir,
    })
  } else if (isBuilt) {
    child = spawn('npx', ['next', 'start', '-p', String(port)], {
      env: { ...process.env, PORT: String(port) },
      stdio: 'inherit',
      cwd: webDir,
    })
  } else {
    child = spawn('npx', ['tsx', serverScript], {
      env: { ...process.env, PORT: String(port), NODE_ENV: 'development' },
      stdio: 'inherit',
      cwd: webDir,
    })
  }

  child.on('error', err => {
    cleanupServerConfig()
    console.error('Failed to start server:', err.message)
    process.exit(1)
  })

  setTimeout(() => {
    showWelcome(port)
    if (!noOpen) openBrowser(`http://localhost:${port}/brains`)
  }, 2000)

  const cleanup = () => {
    cleanupServerConfig()
    child.kill('SIGINT')
    setTimeout(() => process.exit(0), 1000)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  child.on('exit', code => {
    cleanupServerConfig()
    process.exit(code ?? 0)
  })
}

function commandArgs(allArgs: string[], command: string): string[] {
  return allArgs[0] === command ? allArgs.slice(1) : allArgs
}

async function main() {
  const allArgs = process.argv.slice(2)
  const command = allArgs[0] && !allArgs[0].startsWith('-') ? allArgs[0] : 'start'
  const args = commandArgs(allArgs, command)

  if (command === 'help' || hasFlag(args, '--help') || hasFlag(args, '-h')) {
    showHelp()
    return
  }

  if (command === 'start') {
    await startViewer(args)
    return
  }

  if (command === 'status') {
    printStatus(findBrainRoot(process.cwd()) || undefined)
    return
  }

  if (command === 'init') {
    const existingBrain = findBrainRoot(process.cwd())
    if (existingBrain) {
      console.log(`  Brain already exists at ${existingBrain}`)
      console.log('  Run `brain-tree-os resume` to continue working with it.')
      return
    }

    const brainRoot = process.cwd()
    const initOptions = await resolveInitOptions(brainRoot, args)
    const meta = createBrainScaffold(brainRoot, initOptions)

    registerBrain({
      id: meta.id,
      name: meta.name,
      description: meta.description,
      path: brainRoot,
      created: meta.created,
    })

    console.log(`  Brain created for ${meta.name}`)
    console.log(`  Path: ${brainRoot}`)
    const viewerUrl = formatViewerUrl(meta.id)
    if (viewerUrl) {
      console.log(`  Viewer: ${viewerUrl}`)
    } else {
      console.log('  Start `brain-tree-os` to open the viewer.')
    }
    console.log(`  Preset: ${initOptions.preset}`)
    if (initOptions.addPackageScripts) {
      console.log('  Package scripts: added helper `brain:*` scripts to package.json')
    }
    if (initOptions.linkExistingDocs) {
      console.log('  Existing docs: linked into 03_Operations/Existing-Docs.md where possible')
    }
    console.log('  Next: run `brain-tree-os resume`, then open Codex in this project.')
    return
  }

  if (command === 'resume') {
    const brainRoot = findBrainRoot(process.cwd())
    if (!brainRoot) {
      console.log('  No brain found in this directory tree.')
      console.log('  Run `brain-tree-os init` inside an existing project to create one.')
      return
    }

    printResume(brainRoot)
    return
  }

  if (command === 'wrap-up') {
    const brainRoot = findBrainRoot(process.cwd())
    if (!brainRoot) {
      console.log('  No brain found in this directory tree.')
      console.log('  Run `brain-tree-os init` first.')
      return
    }

    const handoffPath = createWrapUp(brainRoot)
    console.log(`  Created handoff template: ${handoffPath}`)
    console.log('  Fill it in, then update Execution-Plan.md before ending the session.')
    return
  }

  if (command === 'notes') {
    const brainRoot = findBrainRoot(process.cwd())
    if (!brainRoot) {
      console.log('  No brain found in this directory tree.')
      console.log('  Run `brain-tree-os init` first.')
      return
    }

    const scope = args.join(' ').trim()
    if (!scope) {
      console.log('  Usage: brain-tree-os notes "<scope>"')
      return
    }

    const exitCode = await runInherited('codex', ['exec', '--full-auto', '--ephemeral', buildNotesPrompt(brainRoot, scope)], brainRoot)
    if (exitCode !== 0) {
      process.exit(exitCode)
    }
    console.log('  Reconciliation finished. Run `brain-tree-os sync` if you want an explicit graph check.')
    return
  }

  if (command === 'plan') {
    const brainRoot = findBrainRoot(process.cwd())
    if (!brainRoot) {
      console.log('  No brain found in this directory tree.')
      console.log('  Run `brain-tree-os init` first.')
      return
    }

    const executionPlan = readExecutionPlanSteps(brainRoot)
    if (!executionPlan || executionPlan.steps.length === 0) {
      console.log('  No parseable execution plan found.')
      console.log('  Keep using Codex `/plan`, but add an Execution-Plan.md if you want BrainTree step planning.')
      return
    }

    const stepArg = args[0]
    const completedIds = new Set(
      executionPlan.steps.filter(step => step.status === 'completed').map(step => step.id)
    )
    const readySteps = executionPlan.steps.filter(step => {
      if (step.status !== 'not_started') return false
      return step.dependencies.every(dep => completedIds.has(dep))
    })
    const inProgressSteps = executionPlan.steps.filter(step => step.status === 'in_progress')

    if (!stepArg) {
      console.log('')
      printSteps('In progress', inProgressSteps)
      printSteps('Ready to plan', readySteps)
      console.log('  Next:')
      console.log('  - Run `brain-tree-os plan <step-id>` to create a linked plan note.')
      console.log('  - In Codex, use `/plan` for the conversation-level planning pass.')
      console.log('')
      return
    }

    const step = executionPlan.steps.find(candidate => candidate.id.toLowerCase() === stepArg.toLowerCase())
    if (!step) {
      console.log(`  Step not found: ${stepArg}`)
      return
    }

    const operations = resolveFolderContext(brainRoot, [
      { dir: '03_Operations', index: 'Operations.md', name: 'Operations' },
      { dir: '04_Operations', index: 'Operations.md', name: 'Operations' },
      { dir: 'Operations', index: 'Operations.md', name: 'Operations' },
    ])

    if (!operations) {
      console.log('  No Operations index found to attach the plan note.')
      return
    }

    const fileName = `Plan-${slugify(step.id)}.md`
    const planPath = ensureLinkedNote(
      operations.dir,
      operations.indexPath,
      operations.indexName,
      fileName,
      `Plan ${step.id}`,
      `## Step\n- **ID**: ${step.id}\n- **Title**: ${step.title}\n- **Phase**: ${step.phase}\n- **Dependencies**: ${step.dependencies.length > 0 ? step.dependencies.join(', ') : 'none'}\n\n## Goal\n${step.title}\n\n## Suggested Codex Prompt\nUse \`/plan\` in Codex with this request:\n\n\`/plan Propose an implementation plan for ${step.id}: ${step.title}. Read BRAIN-INDEX.md, AGENTS.md, Execution-Plan.md, and this note first.\`\n\n## Tasks\n- [ ] Inspect the relevant notes and code paths\n- [ ] Break the work into concrete changes\n- [ ] Decide verification before editing\n- [ ] Record decisions and risks\n\n## Verification\n- Add the exact checks to run before execution starts.\n`
    )

    updateExecutionPlanStepStatus(executionPlan.path, step.id, 'in_progress')

    console.log(`  Created step plan: ${planPath}`)
    console.log('  Next in Codex: run `/plan` and reference this note plus Execution-Plan.md.')
    return
  }

  if (command === 'sprint') {
    const brainRoot = findBrainRoot(process.cwd())
    if (!brainRoot) {
      console.log('  No brain found in this directory tree.')
      console.log('  Run `brain-tree-os init` first.')
      return
    }

    const executionPlan = readExecutionPlanSteps(brainRoot)
    if (!executionPlan || executionPlan.steps.length === 0) {
      console.log('  No parseable execution plan found.')
      return
    }

    const completedIds = new Set(
      executionPlan.steps.filter(step => step.status === 'completed').map(step => step.id)
    )
    const inProgress = executionPlan.steps.filter(step => step.status === 'in_progress')
    const ready = executionPlan.steps.filter(step => {
      if (step.status !== 'not_started') return false
      return step.dependencies.every(dep => completedIds.has(dep))
    })

    const operations = resolveFolderContext(brainRoot, [
      { dir: '03_Operations', index: 'Operations.md', name: 'Operations' },
      { dir: '04_Operations', index: 'Operations.md', name: 'Operations' },
      { dir: 'Operations', index: 'Operations.md', name: 'Operations' },
    ])

    if (!operations) {
      console.log('  No Operations index found to attach the sprint note.')
      return
    }

    const dateStamp = new Date().toISOString().slice(0, 10)
    const fileName = `Sprint-${dateStamp}.md`
    const sprintPath = ensureLinkedNote(
      operations.dir,
      operations.indexPath,
      operations.indexName,
      fileName,
      `Sprint ${dateStamp}`,
      `## Current Focus\n${inProgress.length > 0 ? inProgress.map(step => `- [ ] ${step.id}: ${step.title}`).join('\n') : '- No in-progress steps'}\n\n## Ready Queue\n${ready.length > 0 ? ready.slice(0, 5).map(step => `- [ ] ${step.id}: ${step.title}`).join('\n') : '- No unblocked steps ready'}\n\n## Suggested Codex Prompt\nUse \`/plan\` in Codex with:\n\n\`/plan Propose a one-week sprint using this sprint note, Execution-Plan.md, AGENTS.md, and the latest handoff.\`\n`
    )

    console.log(`  Created sprint note: ${sprintPath}`)
    console.log('  Next in Codex: run `/plan` to refine the sprint inside the active chat.')
    return
  }

  if (command === 'feature') {
    const brainRoot = findBrainRoot(process.cwd())
    if (!brainRoot) {
      console.log('  No brain found in this directory tree.')
      console.log('  Run `brain-tree-os init` first.')
      return
    }

    const featureName = args.join(' ').trim()
    if (!featureName) {
      console.log('  Usage: brain-tree-os feature <name>')
      return
    }

    const product = resolveFolderContext(brainRoot, [
      { dir: '01_Product', index: 'Product.md', name: 'Product' },
      { dir: '00_Vision', index: 'Vision.md', name: 'Vision' },
      { dir: 'Product', index: 'Product.md', name: 'Product' },
      { dir: 'Vision', index: 'Vision.md', name: 'Vision' },
    ])

    if (!product) {
      console.log('  No Product or Vision index found to attach the feature spec.')
      return
    }

    const fileName = `Feature-${slugify(featureName)}.md`
    const featurePath = ensureLinkedNote(
      product.dir,
      product.indexPath,
      product.indexName,
      fileName,
      `Feature ${featureName}`,
      `## Status\nPlanning\n\n## Summary\nDescribe the user-facing behavior for ${featureName}.\n\n## Motivation\nWhy this feature matters.\n\n## Requirements\n- [ ] Add the concrete requirements here\n- [ ] Link the relevant notes and code paths\n\n## Suggested Codex Prompt\nUse \`/plan\` in Codex with:\n\n\`/plan Create an implementation plan for the feature "${featureName}". Read BRAIN-INDEX.md, AGENTS.md, Execution-Plan.md, and this feature spec first.\`\n\n## Open Questions\n- Clarify constraints, tradeoffs, and rollout details.\n`
    )

    console.log(`  Created feature spec: ${featurePath}`)
    console.log('  Next in Codex: run `/plan` to turn the spec into execution tasks.')
    return
  }

  if (command === 'sync') {
    const brainRoot = findBrainRoot(process.cwd())
    if (!brainRoot) {
      console.log('  No brain found in this directory tree.')
      console.log('  Run `brain-tree-os init` first.')
      return
    }

    const files = findMarkdownFiles(brainRoot)
    const relativeFiles = files.map(file => path.relative(brainRoot, file))
    const byBaseName = new Map(relativeFiles.map(file => [path.basename(file, '.md'), file]))
    const brokenLinks: Array<{ file: string; target: string }> = []
    const missingParents: string[] = []

    for (const file of files) {
      const relative = path.relative(brainRoot, file)
      const content = fs.readFileSync(file, 'utf8')

      if (relative !== 'BRAIN-INDEX.md' && !content.includes('> Part of [[')) {
        missingParents.push(relative)
      }

      const matches = [...content.matchAll(/\[\[([^\]]+)\]\]/g)]
      for (const match of matches) {
        const target = match[1].trim()
        if (!byBaseName.has(target) && !relativeFiles.some(candidate => candidate.replace(/\.md$/, '') === target)) {
          brokenLinks.push({ file: relative, target })
        }
      }
    }

    console.log('')
    console.log(`  Files scanned: ${relativeFiles.length}`)
    console.log(`  Broken wikilinks: ${brokenLinks.length}`)
    console.log(`  Files missing parent link: ${missingParents.length}`)
    if (brokenLinks.length > 0) {
      console.log('')
      console.log('  Broken links:')
      for (const item of brokenLinks.slice(0, 10)) {
        console.log(`  - ${item.file} -> [[${item.target}]]`)
      }
    }
    if (missingParents.length > 0) {
      console.log('')
      console.log('  Missing `> Part of [[...]]` lines:')
      for (const item of missingParents.slice(0, 10)) {
        console.log(`  - ${item}`)
      }
    }
    console.log('')
    console.log('  Next in Codex: ask it to fix the issues found here, then run `brain-tree-os sync` again.')
    return
  }

  if (command === 'codex') {
    const brainRoot = findBrainRoot(process.cwd())
    if (!brainRoot) {
      console.log('  No brain found in this directory tree.')
      console.log('  Run `brain-tree-os init` first.')
      return
    }

    commandPromptSummary(brainRoot)
    return
  }

  console.error(`Unknown command: ${command}`)
  showHelp()
  process.exit(1)
}

main().catch(err => {
  cleanupServerConfig()
  console.error(err)
  process.exit(1)
})
