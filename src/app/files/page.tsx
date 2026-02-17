"use client";

import { useState, useEffect } from "react";
import { 
  Folder, File, ChevronRight, ChevronDown, 
  Search, Clock, FileText, Code, ArrowLeft,
  RefreshCw, ExternalLink
} from "lucide-react";

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt: string;
  children?: FileNode[];
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string) {
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return '💠';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return '🟨';
  if (name.endsWith('.css') || name.endsWith('.scss')) return '🎨';
  if (name.endsWith('.json')) return '📋';
  if (name.endsWith('.md')) return '📝';
  if (name.endsWith('.html')) return '🌐';
  if (name.endsWith('.py')) return '🐍';
  if (name.endsWith('.sh')) return '⚡';
  return '📄';
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay}d ago`;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<{path: string, content: string} | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileNode[]>([]);

  const fetchFiles = async (path: string = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
        // Collect recent files from all directories
        collectRecentFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const collectRecentFiles = (nodes: FileNode[], allFiles: FileNode[] = []) => {
    for (const node of nodes) {
      if (node.type === 'file') {
        allFiles.push(node);
      }
      if (node.children) {
        collectRecentFiles(node.children, allFiles);
      }
    }
    // Sort by modified date and take top 10
    const sorted = allFiles.sort((a, b) => 
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    ).slice(0, 10);
    setRecentFiles(sorted);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const openFile = async (path: string) => {
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedFile({ path, content: data.content });
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const filterFiles = (nodes: FileNode[]): FileNode[] => {
    if (!searchQuery) return nodes;
    
    return nodes.reduce((acc: FileNode[], node) => {
      const matches = node.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (node.type === 'directory' && node.children) {
        const filteredChildren = filterFiles(node.children);
        if (filteredChildren.length > 0 || matches) {
          acc.push({ ...node, children: filteredChildren });
        }
      } else if (matches) {
        acc.push(node);
      }
      
      return acc;
    }, []);
  };

  const renderTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedDirs.has(node.path);
      const paddingLeft = level * 16 + 12;

      if (node.type === 'directory') {
        return (
          <div key={node.path}>
            <button
              onClick={() => toggleDir(node.path)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.04] transition-colors text-left group"
              style={{ paddingLeft }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[#5a5a6a]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#5a5a6a]" />
              )}
              <Folder className="w-4 h-4 text-[#5b8aff]" />
              <span className="text-sm text-[#f0f0f5]">{node.name}</span>
            </button>
            
            {isExpanded && node.children && (
              <div>{renderTree(node.children, level + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <button
          key={node.path}
          onClick={() => openFile(node.path)}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.04] transition-colors text-left group"
          style={{ paddingLeft: paddingLeft + 20 }}
        >
          <span className="text-sm">{getFileIcon(node.name)}</span>
          <span className="text-sm text-[#f0f0f5] truncate flex-1">{node.name}</span>
          <span className="text-xs text-[#5a5a6a] opacity-0 group-hover:opacity-100 transition-opacity">
            {formatSize(node.size)}
          </span>
        </button>
      );
    });
  };

  const filteredFiles = filterFiles(files);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">File Browser</h1>
          <p className="text-[#8a8a9a] text-sm mt-1">Browse and manage workspace files</p>
        </div>
        <button
          onClick={() => fetchFiles()}
          className="p-2.5 rounded-lg bg-[#13131f] border border-white/[0.06] hover:border-white/[0.1] text-[#8a8a9a] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* File Tree */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a6a]" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#13131f] border border-white/[0.06] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5a5a6a] focus:outline-none focus:border-[#5b8aff]/30"
              />
            </div>
          </div>

          <div className="bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#5b8aff]" />
              <span className="text-sm font-medium text-white">Workspace</span>
              <span className="text-xs text-[#5a5a6a]">/root/.openclaw/workspace</span>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-[#5b8aff] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="p-8 text-center text-[#5a5a6a]">
                  {searchQuery ? 'No files found' : 'Empty directory'}
                </div>
              ) : (
                renderTree(filteredFiles)
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Recent & Preview */}
        <div className="space-y-4">
          
          {/* Recent Files */}
          <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[#5b8aff]" />
              <span className="text-sm font-medium text-white">Recent Files</span>
            </div>

            <div className="space-y-2">
              {recentFiles.length === 0 ? (
                <p className="text-sm text-[#5a5a6a]">No recent files</p>
              ) : (
                recentFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => openFile(file.path)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left group"
                  >
                    <span className="text-lg">{getFileIcon(file.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.name}</p>
                      <p className="text-xs text-[#5a5a6a]">{getRelativeTime(file.modifiedAt)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#5b8aff]" />
                  <span className="text-sm font-medium text-white truncate max-w-[150px]">
                    {selectedFile.path.split('/').pop()}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="text-[#5a5a6a] hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="p-4">
                <pre className="text-xs text-[#8a8a9a] overflow-auto max-h-[300px] font-mono whitespace-pre-wrap">
                  {selectedFile.content.slice(0, 2000)}
                  {selectedFile.content.length > 2000 && '...'}
                </pre>
                
                {selectedFile.content.length > 2000 && (
                  <p className="text-xs text-[#5a5a6a] mt-2">File truncated. Open in editor to view full content.</p>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-4 h-4 text-[#5b8aff]" />
              <span className="text-sm font-medium text-white">Quick Stats</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#8a8a9a]">Total Files</span>
                <span className="text-white">{recentFiles.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8a8a9a]">Directories</span>
                <span className="text-white">{
                  files.filter(f => f.type === 'directory').length
                }</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
