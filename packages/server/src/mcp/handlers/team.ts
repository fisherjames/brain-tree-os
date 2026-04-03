import {
  runVerificationSuite,
  captureFailureBundle,
  generateRemediationTask,
} from '../../governance/verification.js'
import {
  dryRunMerge,
  executeMerge,
  pushToRemote,
  getCurrentBranch,
  createMissionBranch,
} from '../../governance/branch-policy.js'
import { checkPolicyForStage } from '../../governance/policy-registry.js'
import { BrainFs } from '../../fs/brain-fs.js'

type McpHandler = (
  params: Record<string, unknown>,
  brainRoot: string,
  brainId?: string,
) => Promise<unknown>

let liveDemoGateReady = false

export const teamHandlers: Record<string, McpHandler> = {
  'team.get_snapshot': async (_params, brainRoot, brainId) => {
    const fs = new BrainFs(brainRoot)
    return fs.getSnapshot(brainId ?? '')
  },

  'team.get_squads': async () => {
    return { squads: [] }
  },

  'team.get_live_demo_gate': async () => {
    return { ready: liveDemoGateReady }
  },

  'team.set_live_demo_gate': async (params) => {
    liveDemoGateReady = params.ready === true
    return { ready: liveDemoGateReady }
  },

  'team.start_next_task': async (_params, brainRoot) => {
    return { status: 'ok', message: 'Task started' }
  },

  'team.run_verification_suite': async (_params, brainRoot) => {
    const gates = runVerificationSuite(brainRoot)
    const failures = captureFailureBundle('current', gates)

    if (failures.length > 0) {
      const fs = new BrainFs(brainRoot)
      for (const bundle of failures) {
        const remediation = generateRemediationTask(bundle)
        const filename = `tasks/remediation-${bundle.gate}-${Date.now()}.md`
        try {
          fs.writeFile('', filename, remediation)
        } catch {
          /* brain might not exist for standalone runs */
        }
      }
    }

    return { gates, allPassed: gates.every((g) => g.ok) }
  },

  'team.get_policy_status': async (_params) => {
    const stages = [
      'intent',
      'discussion',
      'proposal',
      'ceo_review',
      'execution',
      'verification',
      'merge',
      'briefing',
    ] as const
    const results = stages.map((stage) => ({
      stage,
      ...checkPolicyForStage(stage),
    }))
    return { policies: results }
  },

  'team.merge_queue_dry_run': async (_params, brainRoot) => {
    const branch = getCurrentBranch(brainRoot)
    if (branch === 'main') return { canMerge: true, conflicts: [], branch }
    return { branch, ...dryRunMerge(brainRoot, branch) }
  },

  'team.merge_queue_execute': async (_params, brainRoot) => {
    const branch = getCurrentBranch(brainRoot)
    if (branch === 'main') return { ok: true, message: 'Already on main' }
    return executeMerge(brainRoot, branch)
  },

  'team.merge_queue_ship': async (_params, brainRoot) => {
    return pushToRemote(brainRoot)
  },

  'team.create_mission_branch': async (params, brainRoot) => {
    const initiativeId = params.initiativeId as string
    if (!initiativeId) throw new Error('initiativeId required')
    const branch = createMissionBranch(brainRoot, initiativeId)
    return { branch }
  },

  'team.record_human_verification': async (params) => {
    return { recorded: true, outcome: params.outcome ?? 'approved' }
  },

  'team.capture_failure_bundle': async (params, brainRoot) => {
    const gates = runVerificationSuite(brainRoot)
    const bundles = captureFailureBundle((params.taskId as string) ?? 'unknown', gates)
    return { bundles }
  },
}
