import { Router } from 'express'
import { BrainFs } from '../fs/brain-fs.js'

export function brainRouter(brainRoot: string) {
  const router = Router()
  const fs = new BrainFs(brainRoot)

  router.get('/list', (_req, res) => {
    const brains = fs.listBrains()
    res.json(brains)
  })

  router.get('/:brainId/files', (req, res) => {
    const files = fs.listFiles(req.params.brainId)
    res.json(files)
  })

  router.get('/:brainId/file', (req, res) => {
    const filePath = req.query.path as string
    if (!filePath) return res.status(400).json({ error: 'path required' })
    const content = fs.readFile(req.params.brainId, filePath)
    if (content === null) return res.status(404).json({ error: 'not found' })
    res.json({ path: filePath, content })
  })

  router.get('/:brainId/snapshot', (req, res) => {
    const snapshot = fs.getSnapshot(req.params.brainId)
    res.json(snapshot)
  })

  return router
}
