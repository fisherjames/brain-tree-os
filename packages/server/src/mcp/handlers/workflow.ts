import { canTransition, isRejectTransition, type WorkflowStage } from '@brian/shared'
import { checkPolicyForStage } from '../../governance/policy-registry.js'

type McpHandler = (
  params: Record<string, unknown>,
  brainRoot: string,
  brainId?: string,
) => Promise<unknown>

let currentStage: WorkflowStage = 'intent'

export const workflowHandlers: Record<string, McpHandler> = {
  'workflow.tick': async (params) => {
    const targetStage = params.to as WorkflowStage | undefined
    if (!targetStage) return { stage: currentStage }

    if (!canTransition(currentStage, targetStage)) {
      throw new Error(`Invalid transition: ${currentStage} -> ${targetStage}`)
    }

    const policyCheck = checkPolicyForStage(targetStage)
    if (!policyCheck.valid) {
      throw new Error(
        `Policy not met for ${targetStage}: missing ${policyCheck.missing.join(', ')}`,
      )
    }

    const wasReject = isRejectTransition(currentStage, targetStage)
    currentStage = targetStage
    return { stage: currentStage, rejected: wasReject, feedback: params.feedback }
  },

  'workflow.get_stage': async () => {
    return { stage: currentStage }
  },

  'workflow.seed_backlog': async () => {
    return { status: 'ok', seeded: 0 }
  },
}
