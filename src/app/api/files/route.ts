import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt: string;
  children?: FileNode[];
}

async function getDirectoryStructure(dirPath: string, basePath: string = ''): Promise<FileNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    // Skip hidden files and node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
      continue;
    }

    const fullPath = join(dirPath, entry.name);
    const relativePath = join(basePath, entry.name);
    const stats = await fs.stat(fullPath);

    if (entry.isDirectory()) {
      const children = await getDirectoryStructure(fullPath, relativePath);
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'directory',
        modifiedAt: stats.mtime.toISOString(),
        children,
      });
    } else {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'file',
        size: stats.size,
        modifiedAt: stats.mtime.toISOString(),
      });
    }
  }

  // Sort: directories first, then by name
  return nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
}

// GET /api/files - Get file structure
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    const workspacePath = '/root/.openclaw/workspace';
    const targetPath = join(workspacePath, path);
    
    // Security: ensure we don't escape workspace
    if (!targetPath.startsWith(workspacePath)) {
      return Response.json({ success: false, error: 'Invalid path' }, { status: 403 });
    }

    const structure = await getDirectoryStructure(targetPath, path);
    
    return Response.json({ success: true, files: structure });
  } catch (error) {
    console.error('Files API error:', error);
    return Response.json({ success: false, error: 'Failed to read files' }, { status: 500 });
  }
}

// GET file content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body;
    
    if (!path) {
      return Response.json({ success: false, error: 'Path required' }, { status: 400 });
    }

    const workspacePath = '/root/.openclaw/workspace';
    const fullPath = join(workspacePath, path);
    
    // Security check
    if (!fullPath.startsWith(workspacePath)) {
      return Response.json({ success: false, error: 'Invalid path' }, { status: 403 });
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    const stats = await fs.stat(fullPath);
    
    return Response.json({ 
      success: true, 
      content,
      size: stats.size,
      modifiedAt: stats.mtime.toISOString(),
    });
  } catch (error) {
    console.error('Files API error:', error);
    return Response.json({ success: false, error: 'Failed to read file' }, { status: 500 });
  }
}
