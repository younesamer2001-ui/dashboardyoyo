import { NextRequest } from 'next/server';
import { readData } from '@/lib/storage';

// GET /api/health - Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const data = await readData();
    
    return Response.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        feedItems: data.feed.length,
        chatMessages: data.chat.messages.length,
        agents: data.agents.length
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
