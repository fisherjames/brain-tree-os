import fs from 'fs'
import path from 'path'

export interface SkillEntry {
  name: string
  path: string
  description: string
}

export interface RuleEntry {
  name: string
  path: string
  content: string
}

const SKILL_DIRS = [
  path.join(process.env.HOME ?? '/tmp', '.codex', 'skills'),
  path.join(process.env.HOME ?? '/tmp', '.cursor', 'skills-cursor'),
]

const RULE_DIRS = [
  '.cursor/rules',
]

export function scanSkills(repoRoot: string): SkillEntry[] {
  const skills: SkillEntry[] = []

  for (const dir of SKILL_DIRS) {
    if (!fs.existsSync(dir)) continue
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const skillFile = path.join(dir, entry.name, 'SKILL.md')
      if (fs.existsSync(skillFile)) {
        const content = fs.readFileSync(skillFile, 'utf8')
        const firstLine = content.split('\n').find((l) => l.trim().length > 0) ?? ''
        skills.push({
          name: entry.name,
          path: skillFile,
          description: firstLine.replace(/^#\s*/, '').trim(),
        })
      }
    }
  }

  const repoSkills = path.join(repoRoot, '.cursor', 'skills')
  if (fs.existsSync(repoSkills)) {
    for (const entry of fs.readdirSync(repoSkills, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const skillFile = path.join(repoSkills, entry.name, 'SKILL.md')
      if (fs.existsSync(skillFile)) {
        const content = fs.readFileSync(skillFile, 'utf8')
        const firstLine = content.split('\n').find((l) => l.trim().length > 0) ?? ''
        skills.push({
          name: entry.name,
          path: skillFile,
          description: firstLine.replace(/^#\s*/, '').trim(),
        })
      }
    }
  }

  return skills
}

export function scanRules(repoRoot: string): RuleEntry[] {
  const rules: RuleEntry[] = []

  for (const relDir of RULE_DIRS) {
    const dir = path.join(repoRoot, relDir)
    if (!fs.existsSync(dir)) continue
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue
      const filePath = path.join(dir, entry.name)
      const content = fs.readFileSync(filePath, 'utf8')
      rules.push({
        name: entry.name.replace('.md', ''),
        path: filePath,
        content: content.slice(0, 500),
      })
    }
  }

  const agentsMd = path.join(repoRoot, 'AGENTS.md')
  if (fs.existsSync(agentsMd)) {
    rules.push({
      name: 'AGENTS.md',
      path: agentsMd,
      content: fs.readFileSync(agentsMd, 'utf8').slice(0, 500),
    })
  }

  return rules
}
