import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SquadsStore } from './squads-store'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('SquadsStore', () => {
  let tmpDir: string
  let store: SquadsStore

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brian-test-'))
    fs.mkdirSync(path.join(tmpDir, '.brian'), { recursive: true })
    store = new SquadsStore(tmpDir)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns empty list when no file exists', () => {
    expect(store.list()).toEqual([])
  })

  it('upserts and retrieves a squad', () => {
    const squad = store.upsert({
      id: 'core',
      name: 'Core Squad',
      agents: [{ role: 'engineer', skills: ['ts'], rules: [] }],
      active: true,
    })
    expect(squad.id).toBe('core')
    expect(store.list()).toHaveLength(1)
    expect(store.get('core')?.name).toBe('Core Squad')
  })

  it('updates existing squad on upsert', () => {
    store.upsert({ id: 's1', name: 'Alpha', agents: [], active: true })
    store.upsert({ id: 's1', name: 'Alpha Updated', agents: [], active: true })
    expect(store.list()).toHaveLength(1)
    expect(store.get('s1')?.name).toBe('Alpha Updated')
  })

  it('removes a squad', () => {
    store.upsert({ id: 's1', name: 'A', agents: [], active: true })
    store.upsert({ id: 's2', name: 'B', agents: [], active: true })
    expect(store.remove('s1')).toBe(true)
    expect(store.list()).toHaveLength(1)
    expect(store.remove('nonexistent')).toBe(false)
  })

  it('sets active state', () => {
    store.upsert({ id: 's1', name: 'A', agents: [], active: true })
    store.setActive('s1', false)
    expect(store.get('s1')?.active).toBe(false)
    store.setActive('s1', true)
    expect(store.get('s1')?.active).toBe(true)
  })
})
