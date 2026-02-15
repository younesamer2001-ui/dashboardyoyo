import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

// POST /api/feed - Add new feed item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, agent, metadata } = body;

    if (!type || !message) {
      return Response.json(
        { error: 'Missing required fields: type, message' },
        { status: 400 }
      );
    }

    const data = await readData();
    const newFeedItem = {
      id: Date.now().toString(),
      type: type || 'info',
      message,
      agent: agent || { name: 'Kimi', icon: '🤖' },
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };

    data.feed.unshift(newFeedItem);
    
    // Keep only last 100 items
    if (data.feed.length > 100) {
      data.feed = data.feed.slice(0, 100);
    }

    await writeData(data);

    return Response.json({ success: true, feedItem: newFeedItem });
  } catch (error) {
    console.error('Feed API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/feed - Get feed items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const data = await readData();
    const feed = data.feed.slice(0, limit);

    return Response.json({ success: true, feed });
  } catch (error) {
    console.error('Feed API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
