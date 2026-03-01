"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  File,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface TreeItem {
  path: string;
  type: "file" | "folder";
  size: number;
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children: TreeNode[];
  size: number;
}

function buildTree(items: TreeItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map: Record<string, TreeNode> = {};

  // Sort: folders first, then alphabetical
  const sorted = [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const item of sorted) {
    const parts = item.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const partPath = parts.slice(0, i + 1).join("/");
      const isLast = i === parts.length - 1;

      if (!map[partPath]) {
        const node: TreeNode = {
          name: parts[i],
          path: partPath,
          type: isLast ? item.type : "folder",
          children: [],
          size: isLast ? item.size : 0,
        };
        map[partPath] = node;
        current.push(node);
      }

      current = map[partPath].children;
    }
  }

  return root;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["js", "jsx", "ts", "tsx", "py", "java", "go", "rs", "rb", "php", "cpp", "c", "cs"].includes(ext || "")) {
    return <FileCode className="h-4 w-4 text-brand-400" />;
  }
  if (["json", "yaml", "yml", "toml"].includes(ext || "")) {
    return <FileJson className="h-4 w-4 text-yellow-400" />;
  }
  if (["md", "txt", "rst", "doc"].includes(ext || "")) {
    return <FileText className="h-4 w-4 text-gray-400" />;
  }
  return <File className="h-4 w-4 text-gray-500" />;
}

function TreeNodeItem({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string, type: "file" | "folder") => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isFolder = node.type === "folder";
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    if (isFolder) {
      setExpanded(!expanded);
    }
    onSelect(node.path, node.type);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-xs sm:text-sm transition-colors group ${
          isSelected
            ? "bg-brand-500/15 text-brand-300"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isFolder ? (
          <>
            {expanded ? (
              <ChevronDown className="h-3 w-3 flex-shrink-0 text-gray-500" />
            ) : (
              <ChevronRight className="h-3 w-3 flex-shrink-0 text-gray-500" />
            )}
            {expanded ? (
              <FolderOpen className="h-4 w-4 flex-shrink-0 text-brand-400" />
            ) : (
              <Folder className="h-4 w-4 flex-shrink-0 text-brand-400/70" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      <AnimatePresence initial={false}>
        {isFolder && expanded && node.children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface RepoTreeProps {
  items: TreeItem[];
  selectedPath: string | null;
  onSelect: (path: string, type: "file" | "folder") => void;
}

export default function RepoTree({ items, selectedPath, onSelect }: RepoTreeProps) {
  const tree = useMemo(() => buildTree(items), [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No files found in this repository.
      </div>
    );
  }

  return (
    <div className="space-y-0.5 max-h-[500px] overflow-auto custom-scrollbar">
      {tree.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
