import { useParams, useSearchParams } from 'react-router-dom'
import { BrainLayout } from '../components/BrainLayout'

export function BrainPage() {
  const { brainId } = useParams<{ brainId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'graph'

  function setTab(t: string) {
    setSearchParams({ tab: t })
  }

  if (!brainId) return <div className="p-8 text-zinc-400">Brain not found</div>

  return <BrainLayout brainId={brainId} activeTab={tab} onTabChange={setTab} />
}
