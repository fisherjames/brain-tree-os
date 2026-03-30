import { NextResponse } from 'next/server'
import { getBrain } from '@/lib/local-data'
import { readV2ApiData } from '@/server/v2/mcp'
import { listMarkdownRecords, parseFrontmatter } from '@/lib/v2/storage'

function escapePdfText(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildSimplePdf(lines: string[]): Buffer {
  const safeLines = lines.slice(0, 80).map((line) => escapePdfText(line.slice(0, 120)))
  const content = [
    'BT',
    '/F1 12 Tf',
    '14 TL',
    '50 780 Td',
    ...safeLines.flatMap((line, idx) => (idx === 0 ? [`(${line}) Tj`] : ['T*', `(${line}) Tj`])),
    'ET',
    '',
  ].join('\n')
  const stream = Buffer.from(content, 'utf8')

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${content}endstream\nendobj\n`,
  ]

  const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n', 'utf8')]
  const offsets: number[] = [0]
  let cursor = chunks[0].length
  for (const object of objects) {
    offsets.push(cursor)
    const buf = Buffer.from(object, 'utf8')
    chunks.push(buf)
    cursor += buf.length
  }
  const xrefStart = cursor
  const xref = [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefStart),
    '%%EOF',
    '',
  ].join('\n')
  chunks.push(Buffer.from(xref, 'utf8'))
  return Buffer.concat(chunks)
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ brainId: string; initiativeId: string }> }
) {
  const { brainId, initiativeId } = await params
  const brain = getBrain(brainId)
  if (!brain) return NextResponse.json({ error: 'brain_not_found' }, { status: 404 })

  const models = readV2ApiData(brainId)
  const initiative = models.initiatives.find((item) => item.id === initiativeId)
  if (!initiative) return NextResponse.json({ error: 'initiative_not_found' }, { status: 404 })

  const proposals = listMarkdownRecords(brain.path, 'brian/proposals')
    .map((record) => {
      const fm = parseFrontmatter(record.content)
      return {
        relPath: record.relPath,
        initiativeId: String(fm.initiative_id || ''),
        title: String(fm.title || ''),
        summary: String(fm.summary || ''),
        recommendation: String(fm.recommendation || ''),
        decisionQuestion: String(fm.decision_question || ''),
        constraints: (() => {
          try {
            const parsed = JSON.parse(String(fm.constraints_json || '[]'))
            return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : []
          } catch {
            return [] as string[]
          }
        })(),
        options: (() => {
          try {
            const parsed = JSON.parse(String(fm.options_json || '[]'))
            return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : []
          } catch {
            return [] as string[]
          }
        })(),
        risks: (() => {
          try {
            const parsed = JSON.parse(String(fm.risks_json || '[]'))
            return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : []
          } catch {
            return [] as string[]
          }
        })(),
        evidence: (() => {
          try {
            const parsed = JSON.parse(String(fm.discussion_evidence_json || '[]'))
            return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : []
          } catch {
            return [] as string[]
          }
        })(),
        updatedAt: String(fm.updated_at || fm.created_at || ''),
      }
    })
    .filter((item) => item.initiativeId === initiativeId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const proposal = proposals[0]

  const lines = [
    'Brian Director Proposal',
    '',
    `Initiative: ${initiative.title} (${initiative.id})`,
    `Stage: ${initiative.stage}`,
    '',
    'Initiative Goal + Constraints',
    proposal?.summary || initiative.summary || 'No summary provided.',
    ...(proposal?.constraints?.length ? proposal.constraints.map((line) => `- ${line}`) : ['- No explicit constraints captured.']),
    '',
    'Options and Rationale',
    ...(proposal?.options?.length ? proposal.options.map((line) => `- ${line}`) : ['- Option set pending.']),
    '',
    'Risk Register + Mitigations',
    ...(proposal?.risks?.length ? proposal.risks.map((line) => `- ${line}`) : ['- Risk register pending.']),
    '',
    'Discussion Evidence Excerpt',
    ...(proposal?.evidence?.length ? proposal.evidence.map((line) => `- ${line}`) : ['- Evidence pending discussion capture.']),
    '',
    'Director Recommendation and Decision Question',
    `Recommendation: ${proposal?.recommendation || 'Pending recommendation.'}`,
    proposal?.decisionQuestion || `Should CEO approve director proposal for "${initiative.title}"?`,
    '',
    `Generated at: ${new Date().toISOString()}`,
  ]
  const pdf = buildSimplePdf(lines)
  const fileName = `director-proposal-${initiative.id}.pdf`
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  })
}
