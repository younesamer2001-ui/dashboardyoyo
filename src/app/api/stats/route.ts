import { NextRequest } from 'next/server';
import { readData } from '@/lib/storage';

// GET /api/stats - Get dashboard stats
export async function GET(request: NextRequest) {
  try {
    const data = await readData();
    const feed = data.feed || [];
    const agents = data.agents || [];
    const chat = data.chat || { messages: [] };

    // Calculate stats from feed
    const tasksCompleted = feed.filter((f: any) => f.type === 'success').length;
    const errorsCount = feed.filter((f: any) => f.type === 'error').length;
    const messagesCount = chat.messages.length;
    
    // Get active agents count
    const activeAgents = agents.filter((a: any) => a.status === 'active').length;
    
    // Calculate uptime (mock for now, can be real later)
    const uptime = data.stats?.uptime || 99.9;

    const stats = {
      tasksCompleted,
      activeAgents,
      messagesExchanged: messagesCount,
      uptime,
      errors: errorsCount,
      lastUpdated: new Date().toISOString(),
      // Additional metrics
      todayTasks: feed.filter((f: any) => {
        const feedDate = new Date(f.timestamp).toDateString();
        const today = new Date().toDateString();
        return feedDate === today && f.type === 'success';
      }).length,
      systemHealth: errorsCount > 5 ? 'warning' : errorsCount > 10 ? 'critical' : 'healthy'
    };

    return Response.json({ success: true, stats });
  } catch (error) {
    console.error('Stats API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
