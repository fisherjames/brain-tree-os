import { Wifi, WifiOff } from 'lucide-react'

export function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 text-xs">
      {connected ? (
        <>
          <Wifi className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-red-400" />
          <span className="text-red-400">Disconnected</span>
        </>
      )}
    </div>
  )
}
