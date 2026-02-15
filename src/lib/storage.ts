// Storage module - uses in-memory storage with optional file persistence
// On Vercel: data persists for the lifetime of the function (not across deploys)
// For production: consider using Redis, Upstash, or a database

import fs from 'fs/promises';
import path from 'path';

// In-memory store (persists during function lifetime)
let memoryStore: any = null;

// Default data structure
const defaultData = {
  feed: [],
  chat: {
    messages: [],
    lastUpdate: new Date().toISOString()
  },
  agents: [
    {
      id: 'kimi',
      name: 'Kimi',
      icon: '🤖',
      status: 'active',
      currentTask: 'Monitoring dashboard',
      lastActive: new Date().toISOString(),
      metrics: {
        tasksCompleted: 0,
        messagesSent: 0
      }
    }
  ],
  stats: {
    uptime: 99.9,
    lastReset: new Date().toISOString()
  }
};

// Check if we're in a serverless environment (Vercel)
const isServerless = () => {
  return process.env.VERCEL === '1' || !process.cwd().includes('/root');
};

export async function readData() {
  // Return from memory if available
  if (memoryStore) {
    return memoryStore;
  }

  // Try to read from file (for local dev)
  if (!isServerless()) {
    try {
      const DATA_FILE = path.join(process.cwd(), 'data', 'dashboard-data.json');
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      const data = JSON.parse(content);
      
      memoryStore = {
        ...defaultData,
        ...data,
        feed: data.feed || defaultData.feed,
        chat: { ...defaultData.chat, ...data.chat },
        agents: data.agents || defaultData.agents,
        stats: { ...defaultData.stats, ...data.stats }
      };
      return memoryStore;
    } catch {
      // File doesn't exist, use defaults
      memoryStore = { ...defaultData };
      return memoryStore;
    }
  }

  // Serverless: use in-memory only
  memoryStore = { ...defaultData };
  return memoryStore;
}

export async function writeData(data: any) {
  // Always update memory
  memoryStore = data;

  // Try to write to file (for local dev)
  if (!isServerless()) {
    try {
      const DATA_FILE = path.join(process.cwd(), 'data', 'dashboard-data.json');
      const dataDir = path.dirname(DATA_FILE);
      
      await fs.mkdir(dataDir, { recursive: true });
      
      // Write atomically
      const tempFile = `${DATA_FILE}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      await fs.rename(tempFile, DATA_FILE);
      
      return true;
    } catch (error) {
      console.error('Error writing to file:', error);
      // Still return true since memory was updated
      return true;
    }
  }

  return true;
}

// For testing/debugging
export function getMemoryStore() {
  return memoryStore;
}

export function resetMemoryStore() {
  memoryStore = { ...defaultData };
  return memoryStore;
}
