import { File, Folder, FolderOpen } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

interface FileEntry {
  path: string
  name: string
  type: 'file' | 'directory'
}

interface Props {
  files: FileEntry[]
  selected: string | null
  onSelect: (path: string) => void
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children: TreeNode[]
}

function buildTree(files: FileEntry[]): TreeNode[] {
  const root: TreeNode[] = []
  const dirs = new Map<string, TreeNode>()

  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.path.localeCompare(b.path)
  })

  for (const file of sorted) {
    const parts = file.path.split('/')
    if (parts.length === 1) {
      const node: TreeNode = { name: file.name, path: file.path, type: file.type, children: [] }
      root.push(node)
      if (file.type === 'directory') dirs.set(file.path, node)
    } else {
      const parentPath = parts.slice(0, -1).join('/')
      const parent = dirs.get(parentPath)
      const node: TreeNode = { name: file.name, path: file.path, type: file.type, children: [] }
      if (parent) {
        parent.children.push(node)
      } else {
        root.push(node)
      }
      if (file.type === 'directory') dirs.set(file.path, node)
    }
  }

  return root
}

function TreeItem({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: TreeNode
  depth: number
  selected: string | null
  onSelect: (path: string) => void
}) {
  const [open, setOpen] = useState(depth < 1)
  const isDir = node.type === 'directory'
  const isSelected = node.path === selected

  return (
    <div>
      <button
        onClick={() => {
          if (isDir) setOpen(!open)
          else onSelect(node.path)
        }}
        className={clsx(
          'flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition',
          isSelected
            ? 'bg-zinc-800 text-zinc-100'
            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDir ? (
          open ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-blue-400" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-blue-400" />
          )
        ) : (
          <File className="h-4 w-4 shrink-0 text-zinc-500" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDir &&
        open &&
        node.children.map((child) => (
          <TreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selected={selected}
            onSelect={onSelect}
          />
        ))}
    </div>
  )
}

export function FileTree({ files, selected, onSelect }: Props) {
  const tree = buildTree(files)

  return (
    <div className="space-y-0.5 py-2">
      {tree.map((node) => (
        <TreeItem key={node.path} node={node} depth={0} selected={selected} onSelect={onSelect} />
      ))}
      {files.length === 0 && <p className="px-4 py-2 text-xs text-zinc-600">No files</p>}
    </div>
  )
}
