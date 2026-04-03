import fs from 'fs'
import path from 'path'
import type { Command } from './index.js'

export const status: Command = {
  description: 'Show brain health and workflow state',
  async run() {
    const cwd = process.cwd()
    const brianDir = path.join(cwd, 'brian')

    if (!fs.existsSync(brianDir)) {
      console.log('No brain found in this directory.')
      return
    }

    const files = walkMd(brianDir)
    const execPlan = path.join(brianDir, 'execution-plan.md')
    const hasPlan = fs.existsSync(execPlan)

    console.log(`Brain: ${path.basename(cwd)}`)
    console.log(`Markdown files: ${files.length}`)
    console.log(`Execution plan: ${hasPlan ? 'present' : 'missing'}`)
  },
}

function walkMd(dir: string): string[] {
  const results: string[] = []
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name)
    if (item.isDirectory()) results.push(...walkMd(full))
    else if (item.name.endsWith('.md')) results.push(full)
  }
  return results
}
