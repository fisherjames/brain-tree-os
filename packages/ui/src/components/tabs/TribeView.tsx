import { useEffect, useState } from 'react'
import { Users, ArrowRightLeft } from 'lucide-react'
import { useMcp } from '../../hooks/useMcp'

interface SquadInfo {
  id: string
  name: string
  agents: Array<{ role: string; skills: string[] }>
  active: boolean
}

export function TribeView({ brainId }: { brainId: string }) {
  const { call, connected } = useMcp()
  const [squads, setSquads] = useState<SquadInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!connected) return
    call<{ squads: SquadInfo[] }>('team.get_squads', {}, brainId)
      .then((r) => setSquads(r.squads ?? []))
      .catch(() => setSquads([]))
      .finally(() => setLoading(false))
  }, [connected, call, brainId])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-6 w-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-zinc-100">Tribe View</h2>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading squads...</p>
      ) : squads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-8">
          <ArrowRightLeft className="h-8 w-8 text-zinc-600" />
          <p className="text-sm text-zinc-500">No squads configured yet.</p>
          <p className="text-xs text-zinc-600">Configure squads in Agents + Workflow tab.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {squads.map((squad) => (
            <div key={squad.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-200">{squad.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    squad.active
                      ? 'bg-emerald-900/50 text-emerald-300'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {squad.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2">
                {squad.agents.map((agent, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-zinc-300">{agent.role}</span>
                    {agent.skills.length > 0 && (
                      <span className="text-xs text-zinc-600">({agent.skills.length} skills)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
