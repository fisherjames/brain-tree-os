import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain } from 'lucide-react'

interface BrainEntry {
  id: string
  name: string
  description: string
  path: string
}

export function BrainsPage() {
  const [brains, setBrains] = useState<BrainEntry[]>([])

  useEffect(() => {
    fetch('/api/brain/list')
      .then((r) => r.json())
      .then(setBrains)
      .catch(() => setBrains([]))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-zinc-100">Brains</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brains.map((b) => (
            <Link
              key={b.id}
              to={`/brains/${b.id}`}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 transition hover:border-zinc-600"
            >
              <div className="mb-3 flex items-center gap-3">
                <Brain className="h-5 w-5 text-blue-400" />
                <span className="font-semibold text-zinc-100">{b.name}</span>
              </div>
              <p className="text-sm text-zinc-400">{b.description}</p>
            </Link>
          ))}
          {brains.length === 0 && (
            <p className="text-zinc-500">No brains found. Run `brian init` to create one.</p>
          )}
        </div>
      </div>
    </div>
  )
}
