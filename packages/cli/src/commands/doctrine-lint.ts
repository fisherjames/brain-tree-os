import fs from 'fs'
import path from 'path'
import type { Command } from './index.js'

interface FrontMatter {
  [key: string]: string
}

function parseFrontMatter(content: string): { frontMatter: FrontMatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { frontMatter: {}, body: content }

  const fm: FrontMatter = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx > 0) {
      fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
    }
  }
  return { frontMatter: fm, body: match[2] }
}

function extractWikilinks(content: string): string[] {
  const matches = content.match(/\[\[([^\]]+)\]\]/g)
  if (!matches) return []
  return matches.map((m) => m.slice(2, -2).split('|')[0].trim())
}

function walkMd(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name)
    if (item.isDirectory() && !item.name.startsWith('.')) {
      results.push(...walkMd(full))
    } else if (item.name.endsWith('.md')) {
      results.push(full)
    }
  }
  return results
}

interface LintError {
  file: string
  message: string
}

const RECORD_TYPES = ['intent', 'proposal', 'decision', 'initiative', 'task', 'discussion', 'briefing', 'handoff']

const REQUIRED_FIELDS: Record<string, string[]> = {
  intent: ['id', 'type', 'status', 'created'],
  proposal: ['id', 'type', 'status', 'created'],
  decision: ['id', 'type', 'created'],
  initiative: ['id', 'type', 'status', 'created'],
  task: ['id', 'type', 'status', 'created'],
  discussion: ['id', 'type', 'status', 'created'],
  briefing: ['id', 'type', 'created'],
  handoff: ['id', 'type', 'created'],
}

export const doctrineLint: Command = {
  description: 'Validate markdown records against schemas',
  async run() {
    const brianDir = path.join(process.cwd(), 'brian')
    if (!fs.existsSync(brianDir)) {
      console.log('No brain found in this directory.')
      process.exit(1)
    }

    const files = walkMd(brianDir)
    const errors: LintError[] = []
    const knownNames = new Set<string>()

    for (const file of files) {
      knownNames.add(path.basename(file, '.md').toLowerCase())
    }

    for (const file of files) {
      const relPath = path.relative(brianDir, file)
      const content = fs.readFileSync(file, 'utf8')
      const { frontMatter, body } = parseFrontMatter(content)

      if (!content.trim()) {
        errors.push({ file: relPath, message: 'Empty file' })
        continue
      }

      const hasHeading = /^#\s+.+/m.test(body)
      if (!hasHeading) {
        errors.push({ file: relPath, message: 'Missing top-level heading' })
      }

      if (frontMatter.type && RECORD_TYPES.includes(frontMatter.type)) {
        const required = REQUIRED_FIELDS[frontMatter.type] ?? []
        for (const field of required) {
          if (!frontMatter[field]) {
            errors.push({ file: relPath, message: `Missing required field '${field}' for type '${frontMatter.type}'` })
          }
        }
      }

      const wikilinks = extractWikilinks(content)
      for (const link of wikilinks) {
        const target = link.toLowerCase()
        if (!knownNames.has(target)) {
          errors.push({ file: relPath, message: `Broken wikilink: [[${link}]]` })
        }
      }
    }

    if (errors.length === 0) {
      console.log(`Doctrine lint passed: ${files.length} files checked.`)
    } else {
      console.log(`Doctrine lint found ${errors.length} issue(s):\n`)
      for (const err of errors) {
        console.log(`  ${err.file}: ${err.message}`)
      }
      process.exit(1)
    }
  },
}
