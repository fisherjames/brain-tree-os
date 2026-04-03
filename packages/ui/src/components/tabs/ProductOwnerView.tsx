import { useEffect, useState } from 'react'
import { ListTodo, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { useMcp } from '../../hooks/useMcp'

interface TaskItem {
  id: string
  title: string
  status: string
  initiativeId: string
  assignedSquad?: string
}

export function ProductOwnerView({ brainId }: { brainId: string }) {
  const { call, connected } = useMcp()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!connected) return
    call<{ tasks: TaskItem[] }>('task.list', {}, brainId)
      .then((r) => setTasks(r.tasks ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [connected, call, brainId])

  const todo = tasks.filter((t) => t.status === 'todo')
  const inProgress = tasks.filter((t) => t.status === 'in_progress')
  const done = tasks.filter((t) => t.status === 'done')
  const blocked = tasks.filter((t) => t.status === 'blocked')

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <ListTodo className="h-6 w-6 text-blue-400" />
        <h2 className="text-xl font-bold text-zinc-100">Product Owner</h2>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <CountCard
          label="To Do"
          count={todo.length}
          icon={<Circle className="h-4 w-4 text-zinc-400" />}
        />
        <CountCard
          label="In Progress"
          count={inProgress.length}
          icon={<Circle className="h-4 w-4 text-blue-400" />}
        />
        <CountCard
          label="Done"
          count={done.length}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        />
        <CountCard
          label="Blocked"
          count={blocked.length}
          icon={<AlertCircle className="h-4 w-4 text-red-400" />}
        />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading backlog...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Column title="To Do" items={todo} />
          <Column title="In Progress" items={inProgress} />
          <Column title="Done" items={done} />
        </div>
      )}
    </div>
  )
}

function CountCard({
  label,
  count,
  icon,
}: {
  label: string
  count: number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <span className="text-xl font-bold text-zinc-100">{count}</span>
    </div>
  )
}

function Column({ title, items }: { title: string; items: TaskItem[] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-zinc-400">{title}</h4>
      <div className="space-y-2">
        {items.map((task) => (
          <div key={task.id} className="rounded border border-zinc-800 bg-zinc-900 p-3">
            <span className="text-sm text-zinc-200">{task.title}</span>
            {task.assignedSquad && (
              <div className="mt-1">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">
                  {task.assignedSquad}
                </span>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-zinc-600">Empty</p>}
      </div>
    </div>
  )
}
