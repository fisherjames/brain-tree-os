import { ChevronRight, ChevronLeft, ClipboardList } from 'lucide-react'
import { useState } from 'react'

interface Props {
  executionPlan: string | null
}

export function RightPane({ executionPlan }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex h-full w-10 flex-col items-center justify-start gap-2 border-l border-zinc-800 bg-zinc-900 pt-4"
      >
        <ChevronLeft className="h-4 w-4 text-zinc-400" />
        <ClipboardList className="h-4 w-4 text-zinc-500" />
      </button>
    )
  }

  return (
    <div className="flex h-full w-72 flex-col border-l border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-300">Execution Plan</h3>
        <button onClick={() => setCollapsed(true)}>
          <ChevronRight className="h-4 w-4 text-zinc-400" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {executionPlan ? (
          <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-400">{executionPlan}</pre>
        ) : (
          <p className="text-xs text-zinc-600">No execution plan found.</p>
        )}
      </div>
    </div>
  )
}
