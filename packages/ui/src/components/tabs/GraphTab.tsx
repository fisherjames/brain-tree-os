import { useEffect, useState, useRef, useCallback } from 'react'
import { FileText } from 'lucide-react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import { select } from 'd3-selection'
import { zoom, zoomIdentity } from 'd3-zoom'
import { drag as d3Drag } from 'd3-drag'

interface FileEntry {
  path: string
  name: string
  type: string
}

interface Props {
  brainId: string
  selectedFile: string | null
  readFile: (path: string) => Promise<string | null>
  files: FileEntry[]
}

interface GraphNode extends SimulationNodeDatum {
  id: string
  name: string
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode
  target: string | GraphNode
}

function extractWikilinks(content: string): string[] {
  const matches = content.match(/\[\[([^\]]+)\]\]/g)
  if (!matches) return []
  return matches.map((m) => m.slice(2, -2).split('|')[0].trim())
}

export function GraphTab({ brainId, selectedFile, readFile, files }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])

  useEffect(() => {
    async function buildGraph() {
      const mdFiles = files.filter((f) => f.type === 'file')
      const graphNodes: GraphNode[] = mdFiles.map((f) => ({
        id: f.path,
        name: f.name.replace('.md', ''),
      }))

      const graphLinks: GraphLink[] = []
      const nameToPath = new Map<string, string>()
      for (const f of mdFiles) {
        nameToPath.set(f.name.replace('.md', '').toLowerCase(), f.path)
      }

      for (const f of mdFiles) {
        const content = await readFile(f.path)
        if (!content) continue
        const wikilinks = extractWikilinks(content)
        for (const wl of wikilinks) {
          const targetPath = nameToPath.get(wl.toLowerCase())
          if (targetPath && targetPath !== f.path) {
            graphLinks.push({ source: f.path, target: targetPath })
          }
        }
      }

      setNodes(graphNodes)
      setLinks(graphLinks)
    }
    buildGraph()
  }, [files, readFile])

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    svg.selectAll('*').remove()

    const g = svg.append('g')

    const sim = forceSimulation(nodes)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(80),
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(30))

    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#3f3f46')
      .attr('stroke-width', 1)

    const node = g
      .append('g')
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 6)
      .attr('fill', '#60a5fa')
      .attr('stroke', '#1e3a5f')
      .attr('stroke-width', 1.5)
      .call(
        d3Drag<SVGCircleElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null
            d.fy = null
          }),
      )

    const label = g
      .append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d) => d.name)
      .attr('font-size', 10)
      .attr('fill', '#a1a1aa')
      .attr('dx', 12)
      .attr('dy', 4)

    sim.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0)

      node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0)
      label.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0)
    })

    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform))

    svg.call(z).call(z.transform, zoomIdentity)

    return () => {
      sim.stop()
    }
  }, [nodes, links])

  useEffect(() => {
    if (!selectedFile) {
      setFileContent(null)
      return
    }
    readFile(selectedFile).then(setFileContent)
  }, [selectedFile, readFile])

  return (
    <div className="flex h-full">
      <div className="flex-1">
        <svg ref={svgRef} className="h-full w-full" />
      </div>
      {selectedFile && (
        <div className="w-96 shrink-0 border-l border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-200">{selectedFile}</span>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-400">
            {fileContent ?? 'Loading...'}
          </pre>
        </div>
      )}
    </div>
  )
}
