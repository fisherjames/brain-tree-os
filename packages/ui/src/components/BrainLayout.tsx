import { useState } from 'react'
import { TabBar, type TabDef } from './TabBar'
import { FileTree } from './FileTree'
import { RightPane } from './RightPane'
import { ConnectionStatus } from './ConnectionStatus'
import { useBrain } from '../hooks/useBrain'
import { GraphTab } from './tabs/GraphTab'
import { CeoView } from './tabs/CeoView'
import { DirectorView } from './tabs/DirectorView'
import { ProductOwnerView } from './tabs/ProductOwnerView'
import { TribeView } from './tabs/TribeView'
import { MissionControl } from './tabs/MissionControl'
import { AgentsWorkflow } from './tabs/AgentsWorkflow'

const TABS: TabDef[] = [
  { id: 'graph', label: 'Graph + Notes' },
  { id: 'mission', label: 'CEO View' },
  { id: 'directors', label: 'Director View' },
  { id: 'product-owner', label: 'Product Owner' },
  { id: 'tribe', label: 'Tribe View' },
  { id: 'mission-control', label: 'Mission Control' },
  { id: 'agents-workflow', label: 'Agents + Workflow' },
]

interface Props {
  brainId: string
  activeTab: string
  onTabChange: (tab: string) => void
}

export function BrainLayout({ brainId, activeTab, onTabChange }: Props) {
  const { snapshot, loading, connected, readFile } = useBrain(brainId)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900">
        <TabBar tabs={TABS} active={activeTab} onChange={onTabChange} />
        <ConnectionStatus connected={connected} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'graph' && (
          <div className="w-56 shrink-0 overflow-auto border-r border-zinc-800 bg-zinc-900">
            <FileTree files={snapshot.files} selected={selectedFile} onSelect={setSelectedFile} />
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-zinc-500">Loading brain...</p>
            </div>
          ) : (
            <TabContent
              brainId={brainId}
              tab={activeTab}
              selectedFile={selectedFile}
              readFile={readFile}
              files={snapshot.files}
            />
          )}
        </div>

        <RightPane executionPlan={snapshot.executionPlan} />
      </div>
    </div>
  )
}

function TabContent({
  brainId,
  tab,
  selectedFile,
  readFile,
  files,
}: {
  brainId: string
  tab: string
  selectedFile: string | null
  readFile: (path: string) => Promise<string | null>
  files: Array<{ path: string; name: string; type: string }>
}) {
  switch (tab) {
    case 'graph':
      return (
        <GraphTab brainId={brainId} selectedFile={selectedFile} readFile={readFile} files={files} />
      )
    case 'mission':
      return <CeoView brainId={brainId} />
    case 'directors':
      return <DirectorView brainId={brainId} />
    case 'product-owner':
      return <ProductOwnerView brainId={brainId} />
    case 'tribe':
      return <TribeView brainId={brainId} />
    case 'mission-control':
      return <MissionControl brainId={brainId} />
    case 'agents-workflow':
      return <AgentsWorkflow brainId={brainId} />
    default:
      return <div className="p-6 text-zinc-400">Unknown tab: {tab}</div>
  }
}
