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

function stageLabel(stage: string) {
  return stage.replace(/_/g, ' ')
}

export default function CompanyOS({
  brainId,
  brainName,
}: {
  brainId: string
  brainName: string
}) {
  const { call, connected, events } = useMcpTeam(brainId)
  const [state, setState] = useState<CompanyState | null>(null)
  const [intent, setIntent] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const company = await fetch(`/api/v2/brains/${brainId}/company-state`, { cache: 'no-store' })
    if (company.ok) setState((await company.json()) as CompanyState)
  }, [brainId])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), 3000)
    return () => clearInterval(id)
  }, [refresh])

  const run = useCallback(
    async (method: string, params: Record<string, unknown> = {}, key: string = method) => {
      setBusy(key)
      setError('')
      try {
        const res = await call(method, params)
        if (!res.ok) throw new Error(res.error || `action_failed:${method}`)
        await refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : `action_failed:${method}`)
      } finally {
        setBusy(null)
      }
    },
    [call, refresh]
  )

  const director = state?.directorInbox?.[0]
  const live = useMemo(() => events.slice(0, 20), [events])

  return (
    <div className="h-full overflow-y-auto bg-[#F7F6F1] p-4 text-[13px] text-text">
      <div className="mb-4 rounded border border-border bg-white p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-muted">Brian V2 Company OS</div>
            <div className="text-[15px] font-semibold">{brainName}</div>
          </div>
          <div className={`rounded px-2 py-1 text-[11px] ${connected ? 'bg-[#5B9A65]/10 text-[#5B9A65]' : 'bg-[#D95B5B]/10 text-[#D95B5B]'}`}>
            {connected ? 'MCP connected' : 'MCP offline'}
          </div>
        </div>
        <div className="mt-2 rounded border border-border/70 bg-[#F7F6F1] p-2 text-[12px] text-text-secondary">
          {'Workflow contract: intent -> proposal -> leadership discussion -> director decision -> tribe shaping -> squad planning -> execution'}
        </div>
        <div className="mt-2 text-[12px] text-text-muted">
          Use this as CEO control. Legacy graph/files UI is still available at <code>?legacy=1</code>.
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-border bg-white p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Start Initiative</div>
          <div className="flex gap-2">
            <input
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="Intent title"
              className="flex-1 rounded border border-border px-2 py-1.5"
            />
            <button
              onClick={() => void run('company.intent.capture', { title: intent.trim(), actor: 'founder-ceo' }, 'intent')}
              disabled={busy === 'intent' || intent.trim().length === 0}
              className="rounded border border-border px-3 py-1.5 disabled:opacity-50"
            >
              Capture
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => void run('workflow.seed_backlog', { theme: 'company os', actor: 'founder-ceo' }, 'seed')} disabled={busy === 'seed'} className="rounded border border-border px-2 py-1.5 text-[12px] disabled:opacity-50">Seed Backlog</button>
            <button onClick={() => void run('workflow.tick', {}, 'tick')} disabled={busy === 'tick'} className="rounded border border-border px-2 py-1.5 text-[12px] disabled:opacity-50">Tick</button>
            <button onClick={() => void run('briefing.generate', { actor: 'founder-ceo' }, 'brief')} disabled={busy === 'brief'} className="rounded border border-border px-2 py-1.5 text-[12px] disabled:opacity-50">Generate Briefing</button>
          </div>
        </div>

        <div className="rounded border border-border bg-white p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">CEO Inbox</div>
          <div className="text-[12px] text-text-secondary">
            Status: {director?.status ?? 'unknown'} · Confidence: {director?.confidence ?? 0}%
          </div>
          <div className="text-[12px] text-text-secondary">
            Pending decisions: {state?.pendingDecisions.length ?? 0} · Active escalations: {state?.activeEscalations.length ?? 0}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              disabled={busy === 'approve-all' || (state?.pendingDecisions.length ?? 0) === 0}
              onClick={async () => {
                setBusy('approve-all')
                for (const decision of state?.pendingDecisions ?? []) {
                  await call('decision.resolve', { decisionId: decision.id, status: 'approved', actor: 'founder-ceo' })
                }
                setBusy(null)
                await refresh()
              }}
              className="rounded border border-border px-2 py-1.5 text-[12px] disabled:opacity-50"
            >
              Approve All
            </button>
            <button
              disabled={busy === 'resolve-all' || (state?.activeEscalations.length ?? 0) === 0}
              onClick={async () => {
                setBusy('resolve-all')
                for (const discussion of state?.activeEscalations ?? []) {
                  await call('discussion.resolve', { discussionId: discussion.id, actor: 'project-operator' })
                }
                setBusy(null)
                await refresh()
              }}
              className="rounded border border-border px-2 py-1.5 text-[12px] disabled:opacity-50"
            >
              Resolve All Escalations
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded border border-border bg-white p-3 md:col-span-2">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Initiative Pipeline</div>
          <div className="mb-2 grid gap-1 sm:grid-cols-2">
            {Object.entries(state?.pipeline ?? {}).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between rounded border border-border/70 px-2 py-1 text-[12px]">
                <span>{stageLabel(stage)}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
          <div className="max-h-[220px] overflow-y-auto rounded border border-border/70">
            {(state?.initiatives ?? []).map((initiative) => (
              <div key={initiative.id} className="border-b border-border/60 px-2 py-1.5 text-[12px] last:border-b-0">
                <div className="font-medium">{initiative.title}</div>
                <div className="text-text-muted">{initiative.id} · {stageLabel(initiative.stage)} · {initiative.status}</div>
              </div>
            ))}
            {(state?.initiatives ?? []).length === 0 && <div className="px-2 py-2 text-[12px] text-text-muted">No initiatives yet.</div>}
          </div>
        </div>
        <div className="rounded border border-border bg-white p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Blockers</div>
          {(state?.blockers ?? []).length === 0 ? (
            <div className="text-[12px] text-text-muted">No blockers.</div>
          ) : (
            (state?.blockers ?? []).map((blocker) => (
              <div key={blocker.code} className="mb-2 rounded border border-[#D95B5B]/30 bg-[#D95B5B]/5 p-2 text-[12px] text-[#D95B5B]">
                <div className="font-medium">{blocker.code}</div>
                <div>{blocker.message}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded border border-border bg-white p-3">
        <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Live Workflow Events</div>
        {live.length === 0 ? (
          <div className="text-[12px] text-text-muted">No events yet.</div>
        ) : (
          <div className="max-h-[240px] space-y-1 overflow-y-auto font-mono text-[11px]">
            {live.map((event, i) => (
              <div key={`${event.at}-${i}`} className="rounded border border-border/70 px-2 py-1">
                [{new Date(event.at).toLocaleTimeString('en-GB', { hour12: false })}] {event.actor ?? 'system'} {event.stage ?? 'stage'} {event.message}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <div className="mt-3 rounded border border-[#D95B5B]/40 bg-[#D95B5B]/10 p-2 text-[12px] text-[#D95B5B]">{error}</div>}
    </div>
  )
}
