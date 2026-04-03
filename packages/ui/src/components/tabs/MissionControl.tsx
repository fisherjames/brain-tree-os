import { useEffect, useState, useCallback } from 'react'
import {
  Rocket,
  Play,
  CheckCircle2,
  GitMerge,
  Ship,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Hand,
} from 'lucide-react'
import { useMcp } from '../../hooks/useMcp'

type Phase = 'ready' | 'working' | 'verifying' | 'merging' | 'shipping' | 'done'

interface VerificationResult {
  name: string
  ok: boolean
  output: string
}

export function MissionControl({ brainId }: { brainId: string }) {
  const { call, connected } = useMcp()
  const [phase, setPhase] = useState<Phase>('ready')
  const [gateReady, setGateReady] = useState(false)
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!connected) return
    call<{ ready: boolean }>('team.get_live_demo_gate', {}, brainId)
      .then((r) => {
        setGateReady(r.ready ?? false)
        if (r.ready) setPhase('working')
      })
      .catch(() => {})
  }, [connected, call, brainId])

  const handleReady = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await call('team.set_live_demo_gate', { ready: true }, brainId)
      setGateReady(true)
      setPhase('working')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set gate')
    } finally {
      setLoading(false)
    }
  }, [call, brainId])

  const handleStartWork = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await call('team.start_next_task', {}, brainId)
      setPhase('verifying')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start work')
    } finally {
      setLoading(false)
    }
  }, [call, brainId])

  const handleVerify = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await call<{ gates: VerificationResult[] }>(
        'team.run_verification_suite',
        {},
        brainId,
      )
      setVerificationResults(result.gates ?? [])
      const allPass = (result.gates ?? []).every((g) => g.ok)
      if (allPass) setPhase('merging')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }, [call, brainId])

  const handleMerge = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await call('team.merge_queue_execute', {}, brainId)
      setPhase('shipping')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Merge failed')
    } finally {
      setLoading(false)
    }
  }, [call, brainId])

  const handleShip = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await call('team.merge_queue_ship', {}, brainId)
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ship failed')
    } finally {
      setLoading(false)
    }
  }, [call, brainId])

  const phases: { id: Phase; label: string; icon: React.ReactNode }[] = [
    { id: 'ready', label: 'Ready Gate', icon: <Hand className="h-5 w-5" /> },
    { id: 'working', label: 'Start Work', icon: <Play className="h-5 w-5" /> },
    { id: 'verifying', label: 'Verify', icon: <ShieldCheck className="h-5 w-5" /> },
    { id: 'merging', label: 'Merge', icon: <GitMerge className="h-5 w-5" /> },
    { id: 'shipping', label: 'Ship', icon: <Ship className="h-5 w-5" /> },
    { id: 'done', label: 'Done', icon: <CheckCircle2 className="h-5 w-5" /> },
  ]

  const phaseIndex = phases.findIndex((p) => p.id === phase)

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Rocket className="h-6 w-6 text-orange-400" />
        <h2 className="text-xl font-bold text-zinc-100">Mission Control</h2>
        {!connected && (
          <span className="ml-2 rounded-full bg-red-900/50 px-2 py-0.5 text-xs text-red-300">
            Disconnected
          </span>
        )}
      </div>

      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
        {phases.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${
                i < phaseIndex
                  ? 'border-emerald-800 bg-emerald-900/20 text-emerald-400'
                  : i === phaseIndex
                    ? 'border-blue-700 bg-blue-900/30 text-blue-400'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-600'
              }`}
            >
              {p.icon}
              <span className="text-sm font-medium">{p.label}</span>
            </div>
            {i < phases.length - 1 && <div className="h-px w-6 bg-zinc-800" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-800 bg-red-900/20 p-3">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        {phase === 'ready' && (
          <div className="text-center">
            <Hand className="mx-auto mb-4 h-12 w-12 text-amber-400" />
            <h3 className="mb-2 text-lg font-semibold text-zinc-200">Ready to Begin?</h3>
            <p className="mb-4 text-sm text-zinc-400">
              Click when ready to start the mission workflow.
            </p>
            <button
              onClick={handleReady}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "I'm Ready"}
            </button>
          </div>
        )}

        {phase === 'working' && (
          <div className="text-center">
            <Play className="mx-auto mb-4 h-12 w-12 text-blue-400" />
            <h3 className="mb-2 text-lg font-semibold text-zinc-200">Start Work</h3>
            <p className="mb-4 text-sm text-zinc-400">Begin executing the next task.</p>
            <button
              onClick={handleStartWork}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Start Next Work'}
            </button>
          </div>
        )}

        {phase === 'verifying' && (
          <div>
            <div className="mb-4 text-center">
              <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-violet-400" />
              <h3 className="mb-2 text-lg font-semibold text-zinc-200">Run Verification</h3>
            </div>
            {verificationResults.length > 0 && (
              <div className="mb-4 space-y-2">
                {verificationResults.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center gap-2 rounded border border-zinc-800 p-2"
                  >
                    {r.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="text-sm text-zinc-300">{r.name}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="text-center">
              <button
                onClick={handleVerify}
                disabled={loading}
                className="rounded-lg bg-violet-600 px-6 py-2 font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                ) : (
                  'Run Verification Suite'
                )}
              </button>
            </div>
          </div>
        )}

        {phase === 'merging' && (
          <div className="text-center">
            <GitMerge className="mx-auto mb-4 h-12 w-12 text-cyan-400" />
            <h3 className="mb-2 text-lg font-semibold text-zinc-200">Merge</h3>
            <p className="mb-4 text-sm text-zinc-400">All gates passed. Ready to merge.</p>
            <button
              onClick={handleMerge}
              disabled={loading}
              className="rounded-lg bg-cyan-600 px-6 py-2 font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Execute Merge'}
            </button>
          </div>
        )}

        {phase === 'shipping' && (
          <div className="text-center">
            <Ship className="mx-auto mb-4 h-12 w-12 text-orange-400" />
            <h3 className="mb-2 text-lg font-semibold text-zinc-200">Ship</h3>
            <p className="mb-4 text-sm text-zinc-400">Push merged changes to main.</p>
            <button
              onClick={handleShip}
              disabled={loading}
              className="rounded-lg bg-orange-600 px-6 py-2 font-medium text-white transition hover:bg-orange-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Ship to Main'}
            </button>
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
            <h3 className="mb-2 text-lg font-semibold text-zinc-200">Mission Complete</h3>
            <p className="text-sm text-zinc-400">Changes have been shipped to main.</p>
          </div>
        )}
      </div>
    </div>
  )
}
