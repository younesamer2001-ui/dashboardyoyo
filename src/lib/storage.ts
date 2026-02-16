// Storage module - uses Vercel Blob for persistent storage
// Data survives across deployments and cold starts
import { put, list } from '@vercel/blob';

const BLOB_KEY = 'dashboard-data.json';

// In-memory cache to reduce blob reads
let memoryCache: any = null;
let lastFetch = 0;
const CACHE_TTL = 5000; // 5 second cache

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
          // Use list() to find the blob and get its actual download URL
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
    // Return from cache if fresh
  if (memoryCache && (now - lastFetch) < CACHE_TTL) {
        return memoryCache;
  }
    // Try to read from blob
  const blobData = await fetchFromBlob();
    if (blobData) {
          memoryCache = blobData;
          lastFetch = now;
          return memoryCache;
    }
    // First time: initialize with defaults and save
  console.log('Initializing default data');
    memoryCache = { ...defaultData };
    lastFetch = now;
    await saveToBlob(memoryCache);
    return memoryCache;
}

export async function writeData(data: any) {
    // Update memory cache
  memoryCache = data;
    lastFetch = Date.now();
    // Persist to blob
  await saveToBlob(data);
    return true;
}

// For testing/debugging
export function getMemoryStore() {
    return memoryCache;
}

export function resetMemoryStore() {
    memoryCache = { ...defaultData };
    return memoryCache;
}
