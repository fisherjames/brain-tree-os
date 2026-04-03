import { useEffect, useState } from 'react'
import { Compass, ArrowRight } from 'lucide-react'
import { useMcp } from '../../hooks/useMcp'

interface InitiativeItem {
  id: string
  title: string
  status: string
  squads: string[]
}

export function DirectorView({ brainId }: { brainId: string }) {
  const { call, connected } = useMcp()
  const [initiatives, setInitiatives] = useState<InitiativeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!connected) return
    call<{ initiatives: InitiativeItem[] }>('initiative.list', {}, brainId)
      .then((r) => setInitiatives(r.initiatives ?? []))
      .catch(() => setInitiatives([]))
      .finally(() => setLoading(false))
  }, [connected, call, brainId])

  const stages = ['shaping', 'planning', 'executing', 'verifying', 'merging', 'complete']

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Compass className="h-6 w-6 text-violet-400" />
        <h2 className="text-xl font-bold text-zinc-100">Director View</h2>
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Initiative Pipeline
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {stages.map((stage, i) => {
            const count = initiatives.filter((init) => init.status === stage).length
            return (
              <div key={stage} className="flex items-center gap-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
                  <div className="text-lg font-bold text-zinc-100">{count}</div>
                  <div className="text-xs capitalize text-zinc-500">{stage}</div>
                </div>
                {i < stages.length - 1 && <ArrowRight className="h-4 w-4 text-zinc-700" />}
              </div>
            )
          })}
        </div>
      </div>

      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Active Initiatives
      </h3>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : initiatives.length === 0 ? (
        <p className="text-sm text-zinc-500">No initiatives yet.</p>
      ) : (
        <div className="space-y-3">
          {initiatives.map((init) => (
            <div key={init.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-200">{init.title}</span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs capitalize text-zinc-400">
                  {init.status}
                </span>
              </div>
              {init.squads.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {init.squads.map((s) => (
                    <span key={s} className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
