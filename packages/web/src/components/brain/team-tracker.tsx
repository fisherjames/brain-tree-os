'use client';

import { AlertTriangle, ArrowRight, GitBranch } from 'lucide-react';

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

export default function TeamTracker({
  executionSteps,
  handoffs,
}: {
  executionSteps: ExecutionStep[];
  handoffs: Handoff[];
}) {
  const teamSteps = executionSteps
    .filter((step) => step.phase_number === 99)
    .sort((a, b) => a.step_number - b.step_number);

  const blockers = teamSteps.flatMap((step) =>
    (step.tasks_json ?? []).filter((task) => task.text.toUpperCase().startsWith('BLOCKER:'))
  );
  const nextItems = teamSteps.flatMap((step) =>
    (step.tasks_json ?? []).filter((task) => task.text.toUpperCase().startsWith('NEXT:'))
  );
  const mergeItems = teamSteps.flatMap((step) =>
    (step.tasks_json ?? []).filter((task) => task.text.toUpperCase().startsWith('MERGE:'))
  );

  const latestHandoff = [...handoffs].sort((a, b) => b.session_number - a.session_number)[0];

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
        <div className="rounded-lg border border-border bg-bg-section p-3">
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Team Tracker</p>
          <p className="mt-1 text-[13px] text-text-secondary">
            Live summary of blockers, next actions, merge order, and latest handoff.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-bg-section p-3">
            <p className="text-[10px] uppercase tracking-wide text-text-muted">In Progress</p>
            <p className="text-[20px] font-semibold text-[#E8A830]">
              {executionSteps.filter((step) => step.status === 'in_progress').length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-bg-section p-3">
            <p className="text-[10px] uppercase tracking-wide text-text-muted">Blocked</p>
            <p className="text-[20px] font-semibold text-[#D95B5B]">
              {executionSteps.filter((step) => step.status === 'blocked').length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-bg-section p-3">
            <p className="text-[10px] uppercase tracking-wide text-text-muted">Completed</p>
            <p className="text-[20px] font-semibold text-leaf">
              {executionSteps.filter((step) => step.status === 'completed').length}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-bg-section p-3">
            <p className="text-[10px] uppercase tracking-wide text-text-muted">Blockers</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {blockers.slice(0, 5).map((item, idx) => (
                <p key={`b-${idx}`} className="flex items-start gap-1.5 text-[12px] text-[#D95B5B]">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{item.text.replace(/^BLOCKER:\s*/i, '')}</span>
                </p>
              ))}
              {blockers.length === 0 && <p className="text-[12px] text-text-muted">No blockers recorded.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-bg-section p-3">
            <p className="text-[10px] uppercase tracking-wide text-text-muted">Next Steps</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {nextItems.slice(0, 5).map((item, idx) => (
                <p key={`n-${idx}`} className="flex items-start gap-1.5 text-[12px] text-text-secondary">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E8A830]" />
                  <span>{item.text.replace(/^NEXT:\s*/i, '')}</span>
                </p>
              ))}
              {nextItems.length === 0 && <p className="text-[12px] text-text-muted">No next steps recorded.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-bg-section p-3">
            <p className="text-[10px] uppercase tracking-wide text-text-muted">Merge Order</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {mergeItems.slice(0, 5).map((item, idx) => (
                <p key={`m-${idx}`} className="flex items-start gap-1.5 text-[12px] text-text-secondary">
                  <GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf" />
                  <span>{item.text.replace(/^MERGE:\s*/i, '')}</span>
                </p>
              ))}
              {mergeItems.length === 0 && <p className="text-[12px] text-text-muted">No merge order recorded.</p>}
            </div>
          </div>
        </div>

        {latestHandoff && (
          <div className="rounded-lg border border-border bg-bg-section p-3">
            <p className="text-[10px] uppercase tracking-wide text-text-muted">Latest Handoff</p>
            <p className="mt-1 text-[12px] font-medium text-text-secondary">Session {latestHandoff.session_number}</p>
            <p className="mt-1 text-[12px] text-text-muted">{latestHandoff.summary || latestHandoff.file_path}</p>
          </div>
        )}
      </div>
    </div>
  );
}
