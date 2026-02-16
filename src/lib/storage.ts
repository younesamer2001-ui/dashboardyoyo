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
                ]
    },
    feed: [],
    chat: {
          messages: [],
          lastUpdate: new Date().toISOString()
    },
    agents: [
      {
              id: 'kimi',
              name: 'Kimi',
              icon: '\u{1F916}',
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
                                        stats: { ...defaultData.stats, ...data.stats }
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
