import { workflowHandlers } from './handlers/workflow.js'
import { teamHandlers } from './handlers/team.js'
import { companyHandlers } from './handlers/company.js'

export interface McpCall {
  type: 'mcp.call'
  id: string
  method: string
  params: Record<string, unknown>
  brainId?: string
}

type McpHandler = (
  params: Record<string, unknown>,
  brainRoot: string,
  brainId?: string,
) => Promise<unknown>

const handlers: Record<string, McpHandler> = {
  ...workflowHandlers,
  ...teamHandlers,
  ...companyHandlers,
}

export async function handleMcpCall(call: McpCall, brainRoot: string): Promise<unknown> {
  const handler = handlers[call.method]
  if (!handler) {
    throw new Error(`Unknown MCP method: ${call.method}`)
  }
  return handler(call.params, brainRoot, call.brainId)
}
