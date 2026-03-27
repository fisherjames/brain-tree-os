'use client';

import { useState, useMemo } from 'react';
import {
  ListChecks,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  PanelRightClose,
  PanelRightOpen,
  Check,
  Copy,
  Terminal,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Compass,
} from 'lucide-react';

interface ExecutionStep {
  id: string;
  phase_number: number;
  step_number: number;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  tasks_json: Array<{ done: boolean; text: string }> | null;
}

interface Handoff {
  id: string;
  session_number: number;
  date: string;
  created_at: string | null;
  duration_seconds: number | null;
  summary: string;
  file_path: string;
}

interface RightPaneProps {
  executionSteps: ExecutionStep[];
  handoffs: Handoff[];
  onToggleStep?: (stepId: string, currentStatus: string) => void;
  onSelectHandoff?: (fileId: string, filePath: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const PHASE_TITLES: Record<number, string> = {
  1: 'Foundation',
  2: 'Brain View',
  3: 'MCP + CLI',
  4: 'Polish + Launch',
  99: 'Team Board',
};

const STATUS_BADGE: Record<
  ExecutionStep['status'],
  { label: string; bg: string }
> = {
  completed: { label: 'COMPLETE', bg: '#5B9A65' },
  in_progress: { label: 'IN PROGRESS', bg: '#E8A830' },
  not_started: { label: 'NOT STARTED', bg: '#9B9A92' },
  blocked: { label: 'BLOCKED', bg: '#D95B5B' },
};

interface PhaseGroup {
  phase: number;
  title: string;
  steps: ExecutionStep[];
  completedCount: number;
}

function groupByPhase(steps: ExecutionStep[]): PhaseGroup[] {
  const map = new Map<number, ExecutionStep[]>();
  for (const step of steps) {
    const list = map.get(step.phase_number) ?? [];
    list.push(step);
    map.set(step.phase_number, list);
  }

  const groups: PhaseGroup[] = [];
  for (const [phase, phaseSteps] of map) {
    phaseSteps.sort((a, b) => a.step_number - b.step_number);
    groups.push({
      phase,
      title: PHASE_TITLES[phase] ?? `Phase ${phase}`,
      steps: phaseSteps,
      completedCount: phaseSteps.filter((s) => s.status === 'completed').length,
    });
  }
  groups.sort((a, b) => a.phase - b.phase);
  return groups;
}

function ProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : (completed / total) * 100;
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-text/5">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: '#5B9A65' }}
      />
    </div>
  );
}

function StepRow({
  step,
  expanded,
  onToggleExpand,
  onToggleStep,
}: {
  step: ExecutionStep;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleStep?: (stepId: string, currentStatus: string) => void;
}) {
  const badge = STATUS_BADGE[step.status];
  const hasTasks =
    step.tasks_json !== null && step.tasks_json.length > 0;
  const canToggle = !step.id.startsWith('team-step-') && Boolean(onToggleStep)

  return (
    <div>
      <div className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors duration-150 hover:bg-text/5">
        {/* Checkbox */}
        <button
          disabled={!canToggle}
          onClick={(e) => {
            e.stopPropagation();
            if (!canToggle) return;
            onToggleStep?.(step.id, step.status);
          }}
          className={`shrink-0 text-text-muted transition-colors ${canToggle ? 'hover:text-leaf' : 'cursor-default opacity-50'}`}
        >
          {step.status === 'completed' ? (
            <CheckSquare className="h-3.5 w-3.5 text-leaf" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Expandable row content */}
        <button
          onClick={onToggleExpand}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          {hasTasks && (
            expanded ? (
              <ChevronDown className="h-3 w-3 shrink-0 text-text-muted" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0 text-text-muted" />
            )
          )}
          {!hasTasks && <span className="w-3 shrink-0" />}
          <span className="shrink-0 text-[11px] text-text-muted">
            {step.phase_number}.{step.step_number}
          </span>
          <span className="min-w-0 truncate text-[12px] text-text-secondary">
            {step.title}
          </span>
        </button>

        {/* Status badge */}
        <span
          className="shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold leading-none text-white"
          style={{ backgroundColor: badge.bg }}
        >
          {badge.label}
        </span>
      </div>

      {/* Sub-tasks */}
      {expanded && hasTasks && (
        <div className="ml-7 border-l border-border pb-1 pl-2">
          {step.tasks_json?.map((task, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 py-0.5"
            >
              {task.done ? (
                <CheckSquare className="mt-0.5 h-3 w-3 shrink-0 text-leaf" />
              ) : (
                <Square className="mt-0.5 h-3 w-3 shrink-0 text-text-muted" />
              )}
              <span
                className={`text-[11px] leading-snug ${
                  task.done
                    ? 'text-text-muted line-through'
                    : 'text-text-secondary'
                }`}
              >
                {task.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResumeBrainCta() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cmd = 'brian work';

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-2 mt-2 mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-bg-section px-3 py-2.5 text-left transition-colors hover:bg-text/5"
      >
        <Terminal className="h-4 w-4 shrink-0 text-text-muted" />
        <span className="flex-1 text-[12px] font-semibold text-text">
          Continue with Codex
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        )}
      </button>

      {open && (
        <div className="mt-1.5 rounded-xl border border-border bg-bg-section px-3 pb-3 pt-2.5">
          <p className="text-[11px] leading-relaxed text-text-secondary mb-2.5">
            Pick up where you left off with the managed Brian workflow:
          </p>
          <div className="flex items-center gap-1.5 rounded-lg bg-[#2B2A25] px-3 py-2.5">
            <code className="flex-1 text-[13px] font-mono text-[#E8E6E0]">
              <span className="text-[#27C93F]">$</span> {cmd}
            </code>
            <button
              onClick={handleCopy}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: copied ? '#5B9A65' : '#4A7FE5' }}
              title="Copy command"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-white" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-white" />
              )}
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-text-muted">
            If you prefer package scripts, run <code>npm run brain:start</code> when available.
          </p>
        </div>
      )}
    </div>
  );
}

function ExecutionPlanView({
  phases,
  expandedSteps,
  onToggleExpand,
  onToggleStep,
}: {
  phases: PhaseGroup[];
  expandedSteps: Set<string>;
  onToggleExpand: (stepId: string) => void;
  onToggleStep?: (stepId: string, currentStatus: string) => void;
}) {
  if (phases.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-3 py-8">
        <p className="text-[12px] text-text-muted">No execution steps yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-2 py-2">
      {/* Resume brain CTA */}
      <ResumeBrainCta />

      {phases.map((group) => (
        <div key={group.phase}>
          {/* Phase header */}
          <div className="px-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              Phase {group.phase}: {group.title}
            </p>
            <ProgressBar
              completed={group.completedCount}
              total={group.steps.length}
            />
            <p className="mt-0.5 text-[10px] text-text-muted">
              {group.completedCount}/{group.steps.length} complete
            </p>
          </div>

          {/* Steps */}
          <div className="mt-1 flex flex-col gap-0.5">
            {group.steps.map((step) => (
              <StepRow
                key={step.id}
                step={step}
                expanded={expandedSteps.has(step.id)}
                onToggleExpand={() => onToggleExpand(step.id)}
                onToggleStep={onToggleStep}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamProgressView({ executionSteps }: { executionSteps: ExecutionStep[] }) {
  const teamSteps = executionSteps
    .filter((step) => step.phase_number === 99)
    .sort((a, b) => a.step_number - b.step_number);

  if (teamSteps.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-3 py-8">
        <p className="text-[12px] text-text-muted">No team board steps yet</p>
      </div>
    );
  }

  const blockedSteps = teamSteps.filter((step) => step.status === 'blocked').length;
  const inProgress = teamSteps.filter((step) => step.status === 'in_progress').length;
  const completed = teamSteps.filter((step) => step.status === 'completed').length;
  const blockerCount = teamSteps.reduce((count, step) => {
    const lines = step.tasks_json ?? [];
    return count + lines.filter((line) => line.text.toUpperCase().startsWith('BLOCKER:')).length;
  }, 0);

  return (
    <div className="flex flex-col gap-2 px-2 py-2">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-md border border-border bg-bg-section px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-text-muted">Completed</p>
          <p className="text-[14px] font-semibold text-leaf">{completed}</p>
        </div>
        <div className="rounded-md border border-border bg-bg-section px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-text-muted">In Progress</p>
          <p className="text-[14px] font-semibold" style={{ color: '#E8A830' }}>{inProgress}</p>
        </div>
        <div className="rounded-md border border-border bg-bg-section px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-text-muted">Blocked Steps</p>
          <p className="text-[14px] font-semibold" style={{ color: '#D95B5B' }}>{blockedSteps}</p>
        </div>
        <div className="rounded-md border border-border bg-bg-section px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-text-muted">Blockers</p>
          <p className="text-[14px] font-semibold" style={{ color: '#D95B5B' }}>{blockerCount}</p>
        </div>
      </div>

      {teamSteps.map((step) => {
        const lines = step.tasks_json ?? [];
        const blockers = lines.filter((line) => line.text.toUpperCase().startsWith('BLOCKER:'));
        const next = lines.filter((line) => line.text.toUpperCase().startsWith('NEXT:'));
        const merge = lines.filter((line) => line.text.toUpperCase().startsWith('MERGE:'));
        const notes = lines.filter(
          (line) =>
            !line.text.toUpperCase().startsWith('BLOCKER:') &&
            !line.text.toUpperCase().startsWith('NEXT:') &&
            !line.text.toUpperCase().startsWith('MERGE:')
        );

        return (
          <div key={step.id} className="rounded-md border border-border bg-bg-section px-2 py-2">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[11px] text-text-muted">
                99.{step.step_number}
              </span>
              <p className="text-[12px] font-medium text-text">{step.title}</p>
            </div>
            <div className="flex flex-col gap-1">
              {blockers.map((item, idx) => (
                <p key={`b-${idx}`} className="flex items-start gap-1.5 text-[11px]" style={{ color: '#D95B5B' }}>
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{item.text.replace(/^BLOCKER:\s*/i, '')}</span>
                </p>
              ))}
              {next.map((item, idx) => (
                <p key={`n-${idx}`} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: '#E8A830' }} />
                  <span>{item.text.replace(/^NEXT:\s*/i, '')}</span>
                </p>
              ))}
              {merge.map((item, idx) => (
                <p key={`m-${idx}`} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                  <GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf" />
                  <span>{item.text.replace(/^MERGE:\s*/i, '')}</span>
                </p>
              ))}
              {notes.map((item, idx) => (
                <p key={`o-${idx}`} className="text-[11px] text-text-muted">
                  {item.text.replace(/^NOTE:\s*/i, '')}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MissionControlView({
  executionSteps,
  handoffs,
}: {
  executionSteps: ExecutionStep[];
  handoffs: Handoff[];
}) {
  const nonTeamSteps = executionSteps.filter((step) => step.phase_number !== 99);
  const teamSteps = executionSteps
    .filter((step) => step.phase_number === 99)
    .sort((a, b) => a.step_number - b.step_number);

  const inProgress = nonTeamSteps.find((step) => step.status === 'in_progress');
  const blocked = nonTeamSteps.find((step) => step.status === 'blocked');
  const nextReady = nonTeamSteps.find((step) => step.status === 'not_started');

  const mergeItems = teamSteps.flatMap((step) =>
    (step.tasks_json ?? []).filter((task) => task.text.toUpperCase().startsWith('MERGE:'))
  );
  const blockers = teamSteps.flatMap((step) =>
    (step.tasks_json ?? []).filter((task) => task.text.toUpperCase().startsWith('BLOCKER:'))
  );
  const nextSteps = teamSteps.flatMap((step) =>
    (step.tasks_json ?? []).filter((task) => task.text.toUpperCase().startsWith('NEXT:'))
  );

  let recommendation = 'brian work';
  let reason = 'Continue the active implementation path.';
  if (blocked) {
    recommendation = 'brian sync';
    reason = `${blocked.id} is blocked, so clean link/state drift first.`;
  } else if (inProgress) {
    recommendation = 'brian work';
    reason = `${inProgress.id} is in progress: ${inProgress.title}.`;
  } else if (nextReady) {
    recommendation = `brian plan ${nextReady.id}`;
    reason = `Next planning candidate: ${nextReady.id} ${nextReady.title}.`;
  }

  const latestHandoff = [...handoffs].sort((a, b) => b.session_number - a.session_number)[0];

  return (
    <div className="flex flex-col gap-2 px-2 py-2">
      <ResumeBrainCta />

      <div className="rounded-md border border-border bg-bg-section px-2.5 py-2">
        <p className="text-[10px] uppercase tracking-wide text-text-muted">Recommended Now</p>
        <code className="mt-1 block rounded bg-[#2B2A25] px-2 py-1.5 text-[12px] text-[#E8E6E0]">
          $ {recommendation}
        </code>
        <p className="mt-1.5 text-[11px] text-text-secondary">{reason}</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-md border border-border bg-bg-section px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-text-muted">In Progress</p>
          <p className="text-[14px] font-semibold" style={{ color: '#E8A830' }}>
            {nonTeamSteps.filter((step) => step.status === 'in_progress').length}
          </p>
        </div>
        <div className="rounded-md border border-border bg-bg-section px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-text-muted">Blocked</p>
          <p className="text-[14px] font-semibold" style={{ color: '#D95B5B' }}>
            {nonTeamSteps.filter((step) => step.status === 'blocked').length}
          </p>
        </div>
        <div className="rounded-md border border-border bg-bg-section px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-text-muted">Done</p>
          <p className="text-[14px] font-semibold text-leaf">
            {nonTeamSteps.filter((step) => step.status === 'completed').length}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-bg-section px-2.5 py-2">
        <p className="text-[10px] uppercase tracking-wide text-text-muted">Merge Order</p>
        {mergeItems.length === 0 ? (
          <p className="mt-1 text-[11px] text-text-muted">No merge-order items yet.</p>
        ) : (
          <div className="mt-1 flex flex-col gap-1">
            {mergeItems.slice(0, 4).map((item, idx) => (
              <p key={`merge-${idx}`} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                <GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf" />
                <span>{item.text.replace(/^MERGE:\s*/i, '')}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border border-border bg-bg-section px-2.5 py-2">
        <p className="text-[10px] uppercase tracking-wide text-text-muted">Blockers + Next</p>
        <div className="mt-1 flex flex-col gap-1">
          {blockers.slice(0, 2).map((item, idx) => (
            <p key={`block-${idx}`} className="flex items-start gap-1.5 text-[11px]" style={{ color: '#D95B5B' }}>
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{item.text.replace(/^BLOCKER:\s*/i, '')}</span>
            </p>
          ))}
          {nextSteps.slice(0, 2).map((item, idx) => (
            <p key={`next-${idx}`} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: '#E8A830' }} />
              <span>{item.text.replace(/^NEXT:\s*/i, '')}</span>
            </p>
          ))}
          {blockers.length === 0 && nextSteps.length === 0 && (
            <p className="text-[11px] text-text-muted">No team notes yet.</p>
          )}
        </div>
      </div>

      {latestHandoff && (
        <div className="rounded-md border border-border bg-bg-section px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-wide text-text-muted">Latest Handoff</p>
          <p className="mt-1 text-[11px] text-text-secondary">Session {latestHandoff.session_number}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-text-muted">{latestHandoff.summary}</p>
        </div>
      )}
    </div>
  );
}

function SessionLogView({
  handoffs,
  onSelectHandoff,
}: {
  handoffs: Handoff[];
  onSelectHandoff?: (fileId: string, filePath: string) => void;
}) {
  if (handoffs.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-3 py-8">
        <p className="text-[12px] text-text-muted">No sessions yet</p>
      </div>
    );
  }

  const sorted = [...handoffs].sort(
    (a, b) => b.session_number - a.session_number
  );

  return (
    <div className="flex flex-col gap-1 px-2 py-2">
      {sorted.map((h) => (
        <button
          key={h.id}
          onClick={() => onSelectHandoff?.(h.id, h.file_path)}
          className="flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-text/5"
        >
          <div className="flex items-center gap-2">
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
              style={{ backgroundColor: '#5B9A65' }}
            >
              Session {h.session_number}
            </span>
            <span className="text-[10px] text-text-muted">
              {formatDateTime(h.created_at, h.date)}
            </span>
            {h.duration_seconds != null && (
              <span className="text-[10px] text-text-muted">
                {formatDuration(h.duration_seconds)}
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-[12px] leading-snug text-text-secondary">
            {h.summary}
          </p>
        </button>
      ))}
    </div>
  );
}

function formatDateTime(createdAt: string | null, dateFallback: string): string {
  try {
    if (createdAt) {
      const d = new Date(createdAt);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }) + ' ' + d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    const d = new Date(dateFallback);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateFallback;
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

type ViewMode = 'plan' | 'mission' | 'team' | 'log';

export default function RightPane({
  executionSteps,
  handoffs,
  onToggleStep,
  onSelectHandoff,
  collapsed,
  onToggleCollapsed,
}: RightPaneProps) {
  const [activeView, setActiveView] = useState<ViewMode>('plan');
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    new Set()
  );

  const phases = useMemo(
    () => groupByPhase(executionSteps),
    [executionSteps]
  );

  function toggleExpandStep(stepId: string) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }

  return (
    <aside
      className="flex h-full shrink-0 flex-col border-l border-border bg-bg/80 backdrop-blur-sm lg:bg-bg/50 lg:backdrop-blur-none"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border px-2 py-2">
        <button
          onClick={onToggleCollapsed}
          className="rounded p-1 text-text-muted transition-colors hover:bg-text/5 hover:text-text-secondary"
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? (
            <PanelRightOpen className="h-4 w-4" />
          ) : (
            <PanelRightClose className="h-4 w-4" />
          )}
        </button>
        {!collapsed && (
          <>
            <button
              onClick={() => setActiveView('plan')}
              className="rounded p-1 transition-colors hover:bg-text/5"
              title="Execution Plan"
            >
              <ListChecks
                className="h-4 w-4"
                style={{ color: activeView === 'plan' ? '#5B9A65' : '#9B9A92' }}
              />
            </button>
            <button
              onClick={() => setActiveView('mission')}
              className="rounded p-1 transition-colors hover:bg-text/5"
              title="Mission Control"
            >
              <Compass
                className="h-4 w-4"
                style={{ color: activeView === 'mission' ? '#5B9A65' : '#9B9A92' }}
              />
            </button>
            <button
              onClick={() => setActiveView('team')}
              className="rounded p-1 transition-colors hover:bg-text/5"
              title="Team Progress"
            >
              <Users
                className="h-4 w-4"
                style={{ color: activeView === 'team' ? '#5B9A65' : '#9B9A92' }}
              />
            </button>
            <button
              onClick={() => setActiveView('log')}
              className="rounded p-1 transition-colors hover:bg-text/5"
              title="Session Log"
            >
              <Clock
                className="h-4 w-4"
                style={{ color: activeView === 'log' ? '#5B9A65' : '#9B9A92' }}
              />
            </button>
          </>
        )}
      </div>

      {/* Content area */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto">
          {activeView === 'plan' ? (
            <ExecutionPlanView
              phases={phases}
              expandedSteps={expandedSteps}
              onToggleExpand={toggleExpandStep}
              onToggleStep={onToggleStep}
            />
          ) : activeView === 'mission' ? (
            <MissionControlView executionSteps={executionSteps} handoffs={handoffs} />
          ) : activeView === 'team' ? (
            <TeamProgressView executionSteps={executionSteps} />
          ) : (
            <SessionLogView
              handoffs={handoffs}
              onSelectHandoff={onSelectHandoff}
            />
          )}
        </div>
      )}
    </aside>
  );
}
