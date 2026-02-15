import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'dashboard-data.json');

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

export async function readData() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(DATA_FILE);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    // Try to read existing file
    try {
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      const data = JSON.parse(content);
      
      // Merge with defaults to ensure all fields exist
      return {
        ...defaultData,
        ...data,
        feed: data.feed || defaultData.feed,
        chat: { ...defaultData.chat, ...data.chat },
        agents: data.agents || defaultData.agents,
        stats: { ...defaultData.stats, ...data.stats }
      };
    } catch {
      // File doesn't exist or is corrupted, create default
      await writeData(defaultData);
      return defaultData;
    }
  } catch (error) {
    console.error('Error reading data:', error);
    return defaultData;
  }
}

export async function writeData(data: any) {
  try {
    const dataDir = path.dirname(DATA_FILE);
    
    // Ensure directory exists
    await fs.mkdir(dataDir, { recursive: true });
    
    // Write atomically
    const tempFile = `${DATA_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempFile, DATA_FILE);
    
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
}
