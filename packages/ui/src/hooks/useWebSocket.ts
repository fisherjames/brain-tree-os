import { useEffect, useRef, useState, useCallback } from 'react'

type MessageHandler = (data: Record<string, unknown>) => void

interface UseWebSocketReturn {
  connected: boolean
  send: (msg: Record<string, unknown>) => void
  subscribe: (handler: MessageHandler) => () => void
}

export function useWebSocket(url?: string): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const handlersRef = useRef<Set<MessageHandler>>(new Set())
  const [connected, setConnected] = useState(false)

  const resolvedUrl =
    url ?? `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`

  useEffect(() => {
    let ws: WebSocket
    let retryTimer: ReturnType<typeof setTimeout>

    function connect() {
      ws = new WebSocket(resolvedUrl)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        retryTimer = setTimeout(connect, 2000)
      }
      ws.onerror = () => ws.close()
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          for (const handler of handlersRef.current) handler(data)
        } catch {
          /* ignore malformed messages */
        }
      }
    }

    connect()
    return () => {
      clearTimeout(retryTimer)
      ws?.close()
    }
  }, [resolvedUrl])

  const send = useCallback((msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const subscribe = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler)
    return () => {
      handlersRef.current.delete(handler)
    }
  }, [])

  return { connected, send, subscribe }
}
