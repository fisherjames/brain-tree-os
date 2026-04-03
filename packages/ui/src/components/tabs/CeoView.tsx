import { useEffect, useState } from 'react'
import { Shield, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { useMcp } from '../../hooks/useMcp'

interface PendingDecision {
  id: string
  proposalId: string
  title: string
  summary: string
  status: string
}

export function CeoView({ brainId }: { brainId: string }) {
  const { call, connected } = useMcp()
  const [decisions, setDecisions] = useState<PendingDecision[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!connected) return
    call<{ decisions: PendingDecision[] }>('decision.list_pending', {}, brainId)
      .then((r) => setDecisions(r.decisions ?? []))
      .catch(() => setDecisions([]))
      .finally(() => setLoading(false))
  }, [connected, call, brainId])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-amber-400" />
        <h2 className="text-xl font-bold text-zinc-100">CEO View</h2>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Clock className="h-5 w-5 text-blue-400" />}
          label="Pending"
          value={decisions.filter((d) => d.status === 'review').length}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          label="Approved"
          value={decisions.filter((d) => d.status === 'approved').length}
        />
        <StatCard
          icon={<XCircle className="h-5 w-5 text-red-400" />}
          label="Rejected"
          value={decisions.filter((d) => d.status === 'rejected').length}
        />
      </div>

      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Approval Queue
      </h3>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading decisions...</p>
      ) : decisions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-8">
          <AlertTriangle className="h-8 w-8 text-zinc-600" />
          <p className="text-sm text-zinc-500">No pending decisions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <div key={d.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-zinc-200">{d.title}</span>
                <StatusBadge status={d.status} />
              </div>
              <p className="text-sm text-zinc-400">{d.summary}</p>
              {d.status === 'review' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      call(
                        'decision.record',
                        { proposalId: d.proposalId, outcome: 'approved' },
                        brainId,
                      )
                    }
                    className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      call(
                        'decision.record',
                        { proposalId: d.proposalId, outcome: 'rejected' },
                        brainId,
                      )
                    }
                    className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <span className="text-2xl font-bold text-zinc-100">{value}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    review: 'bg-amber-900/50 text-amber-300',
    approved: 'bg-emerald-900/50 text-emerald-300',
    rejected: 'bg-red-900/50 text-red-300',
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-zinc-800 text-zinc-400'}`}
    >
      {status}
    </span>
  )
}
