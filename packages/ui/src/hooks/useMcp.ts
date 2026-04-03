import { useCallback, useEffect, useRef } from 'react'
import { useWebSocket } from './useWebSocket'

type McpResult<T = unknown> = { result: T } | { error: string }

interface UseMcpReturn {
  connected: boolean
  call: <T = unknown>(
    method: string,
    params?: Record<string, unknown>,
    brainId?: string,
  ) => Promise<T>
  onEvent: (handler: (event: string, data: unknown) => void) => () => void
}

export function useMcp(): UseMcpReturn {
  const { connected, send, subscribe } = useWebSocket()
  const pendingRef = useRef<
    Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>
  >(new Map())
  const eventHandlersRef = useRef<Set<(event: string, data: unknown) => void>>(new Set())

  useEffect(() => {
    return subscribe((msg) => {
      if (msg.type === 'mcp.result' && typeof msg.id === 'string') {
        const pending = pendingRef.current.get(msg.id)
        if (pending) {
          pendingRef.current.delete(msg.id)
          if (msg.error) pending.reject(new Error(msg.error as string))
          else pending.resolve(msg.result)
        }
      }
      if (msg.type === 'mcp.event') {
        for (const handler of eventHandlersRef.current) {
          handler(msg.event as string, msg.data)
        }
      }
    })
  }, [subscribe])

  const call = useCallback(
    <T = unknown>(
      method: string,
      params: Record<string, unknown> = {},
      brainId?: string,
    ): Promise<T> => {
      return new Promise((resolve, reject) => {
        const id = crypto.randomUUID()
        pendingRef.current.set(id, {
          resolve: resolve as (v: unknown) => void,
          reject,
        })
        send({ type: 'mcp.call', id, method, params, brainId })
        setTimeout(() => {
          if (pendingRef.current.has(id)) {
            pendingRef.current.delete(id)
            reject(new Error(`MCP call ${method} timed out`))
          }
        }, 30_000)
      })
    },
    [send],
  )

  const onEvent = useCallback((handler: (event: string, data: unknown) => void) => {
    eventHandlersRef.current.add(handler)
    return () => {
      eventHandlersRef.current.delete(handler)
    }
  }, [])

  return { connected, call, onEvent }
}
