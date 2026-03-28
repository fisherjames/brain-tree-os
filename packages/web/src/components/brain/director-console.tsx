'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMcpTeam } from '@/hooks/use-mcp-team'

type CompanyState = {
  brainId: string
  at: string
  directorInbox: Array<{
    director: string
    status: 'green' | 'yellow' | 'red'
    confidence: number
    pendingDecisions: number
    activeEscalations: number
  }>
  pipeline: Record<string, number>
  initiatives: Array<{ id: string; title: string; stage: string; status: string; summary: string }>
  pendingDecisions: Array<{ id: string; title: string; status: string; rationale: string }>
  activeEscalations: Array<{ id: string; title: string; status: string }>
  executionActive: number
  blockers: Array<{ code: string; message: string }>
}

type BriefingsRes = { briefings: Array<{ id: string; title: string; summary: string; published: boolean; at: string }> }

export default function DirectorConsole({ brainId }: { brainId: string }) {
  const { call, events, connected } = useMcpTeam(brainId)
  const [state, setState] = useState<CompanyState | null>(null)
  const [briefings, setBriefings] = useState<BriefingsRes['briefings']>([])
  const [intentTitle, setIntentTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    const [company, briefingRes] = await Promise.all([
      fetch(`/api/v2/brains/${brainId}/company-state`, { cache: 'no-store' }),
      fetch(`/api/v2/brains/${brainId}/director-briefings`, { cache: 'no-store' }),
    ])

    if (company.ok) setState((await company.json()) as CompanyState)
    if (briefingRes.ok) setBriefings(((await briefingRes.json()) as BriefingsRes).briefings)
  }, [brainId])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), 3000)
    return () => clearInterval(id)
  }, [refresh])

  const runAction = useCallback(async (method: string, params: Record<string, unknown> = {}) => {
    setLoading(true)
    try {
      await call(method, params)
      await refresh()
    } finally {
      setLoading(false)
    }
  }, [call, refresh])

  const actorEvents = useMemo(() => events.slice(0, 20), [events])

  return (
    <div className="h-full overflow-y-auto bg-[#F7F6F1] p-4 text-[13px] text-text">
      <div className="mb-4 flex items-center justify-between rounded border border-border bg-white p-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-muted">Director Briefing Console</div>
          <div className="text-[12px] text-text-secondary">{'Intent -> Proposal -> Discussion -> Decision -> Shape -> Plan -> Execute'}</div>
        </div>
        <div className={`rounded px-2 py-1 text-[11px] ${connected ? 'bg-[#5B9A65]/10 text-[#5B9A65]' : 'bg-[#D95B5B]/10 text-[#D95B5B]'}`}>
          {connected ? 'MCP connected' : 'MCP offline'}
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-border bg-white p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Capture Intent</div>
          <div className="flex gap-2">
            <input
              value={intentTitle}
              onChange={(event) => setIntentTitle(event.target.value)}
              placeholder="Describe the initiative intent"
              className="flex-1 rounded border border-border px-2 py-1.5"
            />
            <button
              disabled={loading || !intentTitle.trim()}
              onClick={() => runAction('company.intent.capture', { title: intentTitle.trim() }).then(() => setIntentTitle(''))}
              className="rounded border border-border px-3 py-1.5 disabled:opacity-50"
            >
              Capture
            </button>
          </div>
        </div>

        <div className="rounded border border-border bg-white p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Workflow Controls</div>
          <div className="flex flex-wrap gap-2">
            <button disabled={loading} onClick={() => runAction('workflow.tick')} className="rounded border border-border px-2 py-1.5 disabled:opacity-50">Tick</button>
            <button disabled={loading} onClick={() => runAction('briefing.generate')} className="rounded border border-border px-2 py-1.5 disabled:opacity-50">Generate Briefing</button>
            <button disabled={loading} onClick={() => runAction('workflow.autopilot.start')} className="rounded border border-border px-2 py-1.5 disabled:opacity-50">Start Autopilot</button>
            <button disabled={loading} onClick={() => runAction('workflow.autopilot.stop')} className="rounded border border-border px-2 py-1.5 disabled:opacity-50">Stop Autopilot</button>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded border border-border bg-white p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Director Inbox</div>
          {(state?.directorInbox ?? []).map((card) => (
            <div key={card.director} className="mb-2 rounded border border-border/70 p-2">
              <div className="text-[12px] font-medium">{card.director}</div>
              <div className="text-[11px] text-text-muted">status {card.status} · confidence {card.confidence}%</div>
              <div className="text-[11px] text-text-secondary">decisions {card.pendingDecisions} · escalations {card.activeEscalations}</div>
            </div>
          ))}
        </div>

        <div className="rounded border border-border bg-white p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Initiative Pipeline</div>
          {Object.entries(state?.pipeline ?? {}).map(([stage, count]) => (
            <div key={stage} className="flex items-center justify-between border-b border-border/60 py-1 text-[12px] last:border-b-0">
              <span>{stage.replace(/_/g, ' ')}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>

        <div className="rounded border border-border bg-white p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Needs Decision</div>
          {(state?.pendingDecisions ?? []).length === 0 ? (
            <div className="text-[12px] text-text-muted">No pending decisions</div>
          ) : (
            (state?.pendingDecisions ?? []).map((decision) => (
              <div key={decision.id} className="mb-2 rounded border border-border/70 p-2">
                <div className="text-[12px] font-medium">{decision.title}</div>
                <div className="text-[11px] text-text-muted">{decision.id}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-border bg-white p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Active Escalations</div>
          {(state?.activeEscalations ?? []).length === 0 ? (
            <div className="text-[12px] text-text-muted">No active escalations</div>
          ) : (
            (state?.activeEscalations ?? []).map((item) => (
              <div key={item.id} className="mb-2 rounded border border-[#D95B5B]/30 bg-[#D95B5B]/5 p-2 text-[12px]">
                <div className="font-medium">{item.title}</div>
                <div className="text-[11px] text-text-muted">{item.status}</div>
              </div>
            ))
          )}
        </div>

        <div className="rounded border border-border bg-white p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Director Briefings</div>
          {briefings.length === 0 ? (
            <div className="text-[12px] text-text-muted">No briefings generated yet</div>
          ) : (
            briefings.slice(0, 8).map((briefing) => (
              <div key={briefing.id} className="mb-2 rounded border border-border/70 p-2">
                <div className="text-[12px] font-medium">{briefing.title}</div>
                <div className="text-[11px] text-text-secondary">{briefing.summary}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded border border-border bg-white p-3">
        <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Live Workflow Output</div>
        {actorEvents.length === 0 ? (
          <div className="text-[12px] text-text-muted">No live activity yet</div>
        ) : (
          <div className="max-h-[220px] space-y-1 overflow-y-auto font-mono text-[11px]">
            {actorEvents.map((event, idx) => (
              <div key={`${event.at}-${idx}`} className="rounded border border-border/60 px-2 py-1">
                <span className="text-text-muted">[{new Date(event.at).toLocaleTimeString()}]</span>{' '}
                <span className="text-[#5B9A65]">{event.actor ?? 'system'}</span>{' '}
                <span className="text-[#4A9FD9]">{event.stage ?? 'stage'}</span>{' '}
                <span>{event.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
