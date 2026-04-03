import { Router } from 'express'
import { handleMcpCall, type McpCall } from './dispatch.js'

export function mcpRouter(brainRoot: string) {
  const router = Router()

  router.post('/call', async (req, res) => {
    const call: McpCall = { type: 'mcp.call', ...req.body }
    try {
      const result = await handleMcpCall(call, brainRoot)
      res.json({ id: call.id, result })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error'
      res.status(400).json({ id: call.id, error: message })
    }
  })

  return router
}
