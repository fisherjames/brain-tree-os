import { validatePolicy, type WorkflowStage } from '@brian/shared'

const registeredMethods: Set<string> = new Set()

export function registerMcpMethod(method: string) {
  registeredMethods.add(method)
}

export function unregisterMcpMethod(method: string) {
  registeredMethods.delete(method)
}

export function getRegisteredMethods(): string[] {
  return [...registeredMethods]
}

export function checkPolicyForStage(stage: WorkflowStage): {
  valid: boolean
  missing: string[]
} {
  return validatePolicy(stage, [...registeredMethods])
}

export function initializeDefaultMethods(methods: string[]) {
  for (const m of methods) registeredMethods.add(m)
}
