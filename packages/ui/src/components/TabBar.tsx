import { clsx } from 'clsx'

export interface TabDef {
  id: string
  label: string
}

interface Props {
  tabs: TabDef[]
  active: string
  onChange: (id: string) => void
}

export function TabBar({ tabs, active, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b border-zinc-800 bg-zinc-900 px-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-4 py-3 text-sm font-medium transition',
            active === tab.id
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-zinc-400 hover:text-zinc-200',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
