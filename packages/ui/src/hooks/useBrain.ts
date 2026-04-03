import { useEffect, useState, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'

interface BrainFile {
  path: string
  name: string
  type: 'file' | 'directory'
}

interface BrainSnapshot {
  files: BrainFile[]
  executionPlan: string | null
}

export function useBrain(brainId: string) {
  const { connected, send, subscribe } = useWebSocket()
  const [snapshot, setSnapshot] = useState<BrainSnapshot>({ files: [], executionPlan: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!connected) return

    send({ type: 'subscribe', brainId })

    return subscribe((msg) => {
      if (msg.type === 'full-update' && msg.brainId === brainId) {
        setSnapshot({
          files: (msg.files as BrainFile[]) ?? [],
          executionPlan: (msg.executionPlan as string) ?? null,
        })
        setLoading(false)
      }
    })
  }, [connected, brainId, send, subscribe])

  const readFile = useCallback(
    async (filePath: string): Promise<string | null> => {
      try {
        const res = await fetch(`/api/brain/${brainId}/file?path=${encodeURIComponent(filePath)}`)
        if (!res.ok) return null
        const data = await res.json()
        return data.content
      } catch {
        return null
      }
    },
    [brainId],
  )

  return { snapshot, loading, connected, readFile }
}
