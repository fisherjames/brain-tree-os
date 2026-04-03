import { useEffect, useState } from 'react'
import { Settings, Plus, Users, BookOpen, Wrench } from 'lucide-react'
import { useMcp } from '../../hooks/useMcp'

interface SquadConfig {
  id: string
  name: string
  agents: Array<{ role: string; skills: string[]; rules: string[] }>
  active: boolean
}

export function AgentsWorkflow({ brainId }: { brainId: string }) {
  const { call, connected } = useMcp()
  const [squads, setSquads] = useState<SquadConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'squads' | 'skills' | 'rules'>('squads')

  useEffect(() => {
    if (!connected) return
    call<{ squads: SquadConfig[] }>('team.get_squads', {}, brainId)
      .then((r) => setSquads(r.squads ?? []))
      .catch(() => setSquads([]))
      .finally(() => setLoading(false))
  }, [connected, call, brainId])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-6 w-6 text-zinc-400" />
        <h2 className="text-xl font-bold text-zinc-100">Agents + Workflow</h2>
      </div>

      <div className="mb-6 flex gap-2">
        {(['squads', 'skills', 'rules'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
              activeSection === section
                ? 'border-blue-700 bg-blue-900/30 text-blue-400'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {section === 'squads' && <Users className="h-4 w-4" />}
            {section === 'skills' && <Wrench className="h-4 w-4" />}
            {section === 'rules' && <BookOpen className="h-4 w-4" />}
            <span className="capitalize">{section}</span>
          </button>
        ))}
      </div>

      {activeSection === 'squads' && <SquadsSection squads={squads} loading={loading} />}
      {activeSection === 'skills' && <SkillsSection brainId={brainId} />}
      {activeSection === 'rules' && <RulesSection brainId={brainId} />}
    </div>
  )
}

function SquadsSection({ squads, loading }: { squads: SquadConfig[]; loading: boolean }) {
  if (loading) return <p className="text-sm text-zinc-500">Loading squads...</p>

  return (
    <div className="space-y-4">
      {squads.map((squad) => (
        <div key={squad.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-200">{squad.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                squad.active ? 'bg-emerald-900/50 text-emerald-300' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {squad.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="space-y-2">
            {squad.agents.map((agent, i) => (
              <div key={i} className="rounded border border-zinc-800 bg-zinc-950 p-3">
                <div className="mb-1 font-medium text-zinc-300">{agent.role}</div>
                <div className="flex flex-wrap gap-1">
                  {agent.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-blue-900/30 px-1.5 py-0.5 text-xs text-blue-300"
                    >
                      {s}
                    </span>
                  ))}
                  {agent.rules.map((r) => (
                    <span
                      key={r}
                      className="rounded bg-amber-900/30 px-1.5 py-0.5 text-xs text-amber-300"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {squads.length === 0 && (
        <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-400">
          <Plus className="h-5 w-5" />
          <span>Create Squad</span>
        </button>
      )}
    </div>
  )
}

interface SkillEntry {
  name: string
  path: string
  description: string
}

interface RuleEntry {
  name: string
  path: string
  content: string
}

function SkillsSection({ brainId }: { brainId: string }) {
  const { call, connected } = useMcp()
  const [skills, setSkills] = useState<SkillEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!connected) return
    call<{ skills: SkillEntry[] }>('config.get_skills', {}, brainId)
      .then((r) => setSkills(r.skills ?? []))
      .catch(() => setSkills([]))
      .finally(() => setLoading(false))
  }, [connected, call, brainId])

  if (loading) return <p className="text-sm text-zinc-500">Scanning skills...</p>

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-300">
        Configured Skills ({skills.length})
      </h3>
      {skills.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No skills found. Add skills to ~/.codex/skills/ or .cursor/skills/
        </p>
      ) : (
        skills.map((skill) => (
          <div key={skill.path} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-1 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-zinc-200">{skill.name}</span>
            </div>
            <p className="text-sm text-zinc-400">{skill.description}</p>
            <p className="mt-1 truncate font-mono text-xs text-zinc-600">{skill.path}</p>
          </div>
        ))
      )}
    </div>
  )
}

function RulesSection({ brainId }: { brainId: string }) {
  const { call, connected } = useMcp()
  const [rules, setRules] = useState<RuleEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!connected) return
    call<{ rules: RuleEntry[] }>('config.get_rules', {}, brainId)
      .then((r) => setRules(r.rules ?? []))
      .catch(() => setRules([]))
      .finally(() => setLoading(false))
  }, [connected, call, brainId])

  if (loading) return <p className="text-sm text-zinc-500">Scanning rules...</p>

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-300">Active Rules ({rules.length})</h3>
      {rules.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No rules found. Add rules to .cursor/rules/ or AGENTS.md
        </p>
      ) : (
        rules.map((rule) => (
          <div key={rule.path} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-1 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <span className="font-medium text-zinc-200">{rule.name}</span>
            </div>
            <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap font-mono text-xs text-zinc-500">
              {rule.content}
            </pre>
          </div>
        ))
      )}
    </div>
  )
}
