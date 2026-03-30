import { NextResponse } from 'next/server'
import { getBrain } from '@/lib/local-data'
import { listMarkdownRecords, parseFrontmatter } from '@/lib/v2/storage'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ brainId: string }> }
) {
  const { brainId } = await params
  const brain = getBrain(brainId)
  if (!brain) return NextResponse.json({ error: 'brain_not_found' }, { status: 404 })

  const proposals = listMarkdownRecords(brain.path, 'brian/proposals')
    .map((record) => {
      const fm = parseFrontmatter(record.content)
      return {
        id: String(fm.id || record.relPath.replace(/^.*\//, '').replace(/\.md$/, '')),
        title: String(fm.title || 'Untitled proposal'),
        initiativeId: String(fm.initiative_id || ''),
        discussionId: String(fm.discussion_id || ''),
        decisionQuestion: String(fm.decision_question || ''),
        recommendation: String(fm.recommendation || ''),
        summary: String(fm.summary || ''),
        filePath: record.relPath,
        updatedAt: String(fm.updated_at || fm.created_at || new Date().toISOString()),
      }
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return NextResponse.json({ proposals }, { status: 200 })
}

