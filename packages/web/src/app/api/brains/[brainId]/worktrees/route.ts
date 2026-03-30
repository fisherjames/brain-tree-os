import { NextResponse } from 'next/server'
import { getBrain } from '@/lib/local-data'
import { runTeamMcpCall } from '@/server/team-board-mcp'

export async function GET(_req: Request, { params }: { params: Promise<{ brainId: string }> }) {
  const { brainId } = await params
  const brain = getBrain(brainId)
  if (!brain) return NextResponse.json({ error: 'brain_not_found' }, { status: 404 })

  const repo = runTeamMcpCall(brainId, 'team.get_repo_state', {}).repo
  const queue = runTeamMcpCall(brainId, 'team.get_snapshot', {}).mergeQueue ?? null

  return NextResponse.json({
    branch: repo?.branch ?? 'unknown',
    isDirty: Boolean(repo?.isDirty),
    hasConflicts: Boolean(repo?.hasConflicts),
    unresolvedWorktrees: repo?.unresolvedWorktreeDetails ?? [],
    mergeQueue: queue,
  })
}
