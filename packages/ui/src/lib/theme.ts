export const COLORS = {
  bg: {
    primary: 'bg-zinc-950',
    secondary: 'bg-zinc-900',
    tertiary: 'bg-zinc-800',
  },
  text: {
    primary: 'text-zinc-100',
    secondary: 'text-zinc-400',
    muted: 'text-zinc-500',
  },
  border: {
    primary: 'border-zinc-800',
    hover: 'border-zinc-600',
  },
  accent: {
    blue: 'text-blue-400',
    green: 'text-emerald-400',
    yellow: 'text-amber-400',
    red: 'text-red-400',
    purple: 'text-violet-400',
  },
} as const

export const STATUS_COLORS: Record<string, string> = {
  pending: 'text-zinc-400',
  in_progress: 'text-blue-400',
  done: 'text-emerald-400',
  blocked: 'text-red-400',
  cancelled: 'text-zinc-600',
  todo: 'text-zinc-400',
  captured: 'text-blue-400',
  discussed: 'text-violet-400',
  proposed: 'text-amber-400',
  approved: 'text-emerald-400',
  rejected: 'text-red-400',
}
