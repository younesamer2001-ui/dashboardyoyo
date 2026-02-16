// Storage module - uses Vercel Blob for persistent storage
// Data survives across deployments and cold starts
import { put, list } from '@vercel/blob';

const BLOB_KEY = 'dashboard-data.json';

let memoryCache: any = null;
let lastFetch = 0;
const CACHE_TTL = 5000;

const defaultData = {
    dashboard: {
          title: 'Dashboard YOYO',
          subtitle: 'Younes AI Co.',
          navItems: [
            { id: 'overview', href: '/', label: 'Overview', icon: 'LayoutDashboard', order: 0 },
            { id: 'agents', href: '/agents', label: 'Agents', icon: 'Users', order: 1 },
            { id: 'brain', href: '/brain', label: 'Brain', icon: 'Brain', order: 2 },
            { id: 'feed', href: '/feed', label: 'Feed', icon: 'Activity', order: 3 },
            { id: 'chat', href: '/chat', label: 'Chat with Kimi', icon: 'MessageSquare', order: 4, protected: true },
            { id: 'memory', href: '/memory', label: 'Memory', icon: 'Database', order: 5 },
            { id: 'scout', href: '/scout', label: 'Scout', icon: 'Globe', order: 6 },
                ]
    },
    feed: [] as any[],
    chat: {
          messages: [] as any[],
          lastUpdate: new Date().toISOString()
    },
    agents: [
      {
              id: 'kimi',
              name: 'Kimi',
              icon: '\u{1F916}',
              role: 'AI CEO & Second Brain',
              status: 'active',
              currentTask: 'Monitoring dashboard',
              lastActive: new Date().toISOString(),
              metrics: {
                        tasksCompleted: 0,
                        messagesSent: 0
              },
              capabilities: [
                { id: 'chat', name: 'Chat', description: 'Have conversations and answer questions', inputs: [{ name: 'message', type: 'string', required: true }], outputs: [{ name: 'reply', type: 'string' }] },
                { id: 'dashboard-control', name: 'Dashboard Control', description: 'Modify sidebar, title, navigation', inputs: [{ name: 'command', type: 'string', required: true }], outputs: [{ name: 'update', type: 'string' }] },
                { id: 'memory-store', name: 'Memory Store', description: 'Remember facts and preferences', inputs: [{ name: 'fact', type: 'string', required: true }], outputs: [{ name: 'stored', type: 'boolean' }] },
                { id: 'scout-manage', name: 'Scout Management', description: 'Set up and manage monitors', inputs: [{ name: 'monitor', type: 'object', required: true }], outputs: [{ name: 'monitorId', type: 'string' }] },
              ],
              tools: []
      }
        ],
    stats: {
          uptime: 99.9,
          lastReset: new Date().toISOString()
    },
    // Second Brain: Memory Pillar
    memory: {
      facts: [] as any[],
      entities: [
        { id: 'younes', type: 'person', name: 'Younes', description: 'Dashboard owner and admin', properties: { role: 'Admin', email: 'younes.amer.2001@gmail.com' }, mentionCount: 0, lastMentioned: new Date().toISOString() }
      ] as any[],
      preferences: [] as any[],
      relationships: [] as any[]
    },
    // Second Brain: Scout Pillar
    scouts: {
      monitors: [] as any[],
      alerts: [] as any[]
    },
    // Second Brain: Agent Executions
    agent_executions: [] as any[],
    // Self-Evolution System
    evolution: {
      ideas: [] as any[],
      history: [] as any[],
      lastRun: '',
      hashes: [] as string[]
    }
};

async function fetchFromBlob(): Promise<any> {
    try {
          const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
          if (blobs.length > 0) {
                  const blobUrl = blobs[0].downloadUrl;
                  console.log('Found blob at:', blobUrl);
                  const response = await fetch(blobUrl, { cache: 'no-store' });
                  if (response.ok) {
                            const data = await response.json();
                            return {
                                        ...defaultData,
                                        ...data,
                                        dashboard: data.dashboard || defaultData.dashboard,
                                        feed: data.feed || defaultData.feed,
                                        chat: { ...defaultData.chat, ...data.chat },
                                        agents: data.agents || defaultData.agents,
                                        stats: { ...defaultData.stats, ...data.stats },
                                        memory: data.memory ? {
                                          facts: data.memory.facts || [],
                                          entities: data.memory.entities || defaultData.memory.entities,
                                          preferences: data.memory.preferences || [],
                                          relationships: data.memory.relationships || []
                                        } : defaultData.memory,
                                        scouts: data.scouts ? {
                                          monitors: data.scouts.monitors || [],
                                          alerts: data.scouts.alerts || []
                                        } : defaultData.scouts,
                                        agent_executions: data.agent_executions || [],
                                        evolution: data.evolution ? {
                                          ideas: data.evolution.ideas || [],
                                          history: data.evolution.history || [],
                                          lastRun: data.evolution.lastRun || '',
                                          hashes: data.evolution.hashes || []
                                        } : defaultData.evolution
                            };
                  }
          }
          console.log('No blob found with prefix:', BLOB_KEY);
    } catch (error) {
          console.error('Error reading from blob:', error);
    }
    return null;
}

async function saveToBlob(data: any): Promise<boolean> {
    try {
          const result = await put(BLOB_KEY, JSON.stringify(data), {
                  access: 'public',
                  addRandomSuffix: false,
          });
          console.log('Saved blob to:', result.url);
          return true;
    } catch (error) {
          console.error('Error writing to blob:', error);
          return false;
    }
}

export async function readData() {
    const now = Date.now();
    if (memoryCache && (now - lastFetch) < CACHE_TTL) {
          return memoryCache;
    }

  const blobData = await fetchFromBlob();
    if (blobData) {
          memoryCache = blobData;
          lastFetch = now;
          return memoryCache;
    }

  console.log('Initializing default data');
    memoryCache = { ...defaultData };
    lastFetch = now;
    await saveToBlob(memoryCache);
    return memoryCache;
}

export async function writeData(data: any) {
    memoryCache = data;
    lastFetch = Date.now();
    await saveToBlob(data);
    return true;
}

export function getMemoryStore() {
    return memoryCache;
}

export function resetMemoryStore() {
    memoryCache = { ...defaultData };
    return memoryCache;
}
