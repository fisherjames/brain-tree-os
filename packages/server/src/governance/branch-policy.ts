import { execFileSync } from 'child_process'

export function createMissionBranch(repoRoot: string, initiativeId: string): string {
  const branchName = `mission/${initiativeId}`
  try {
    execFileSync('git', ['checkout', '-b', branchName], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    return branchName
  } catch (error) {
    const existing = execFileSync('git', ['branch', '--list', branchName], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim()
    if (existing) {
      execFileSync('git', ['checkout', branchName], { cwd: repoRoot, encoding: 'utf8' })
      return branchName
    }
    throw error
  }
}

export function getCurrentBranch(repoRoot: string): string {
  return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim()
}

export function dryRunMerge(
  repoRoot: string,
  branch: string,
  target = 'main',
): {
  canMerge: boolean
  conflicts: string[]
} {
  try {
    execFileSync('git', ['merge', '--no-commit', '--no-ff', branch], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    execFileSync('git', ['merge', '--abort'], { cwd: repoRoot, encoding: 'utf8' })
    return { canMerge: true, conflicts: [] }
  } catch (error) {
    try {
      execFileSync('git', ['merge', '--abort'], { cwd: repoRoot, encoding: 'utf8' })
    } catch {
      /* already aborted */
    }
    const output = error instanceof Error ? error.message : ''
    const conflicts = output
      .split('\n')
      .filter((line) => line.includes('CONFLICT'))
      .map((line) => line.trim())
    return { canMerge: false, conflicts }
  }
}

export function executeMerge(
  repoRoot: string,
  branch: string,
  target = 'main',
): {
  ok: boolean
  error?: string
} {
  try {
    execFileSync('git', ['checkout', target], { cwd: repoRoot, encoding: 'utf8' })
    execFileSync('git', ['merge', '--no-ff', branch, '-m', `Merge ${branch} into ${target}`], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    return { ok: true }
  } catch (error) {
    try {
      execFileSync('git', ['merge', '--abort'], { cwd: repoRoot, encoding: 'utf8' })
    } catch {
      /* ignore */
    }
    return { ok: false, error: error instanceof Error ? error.message : 'merge failed' }
  }
}

export function pushToRemote(
  repoRoot: string,
  branch = 'main',
): {
  ok: boolean
  error?: string
} {
  try {
    execFileSync('git', ['push', 'origin', branch], { cwd: repoRoot, encoding: 'utf8' })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'push failed' }
  }
}
