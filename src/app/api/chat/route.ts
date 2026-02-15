import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

// POST /api/chat - Add new chat message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sender, agentId } = body;

    if (!text) {
      return Response.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      );
    }

    const data = await readData();
    const newMessage = {
      id: Date.now().toString(),
      text,
      sender: sender || 'user',
      agentId: agentId || 'user',
      agentName: sender === 'agent' ? 'Kimi' : 'Younes',
      agentIcon: sender === 'agent' ? '🤖' : '👤',
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    data.chat.messages.push(newMessage);
    
    // Keep only last 200 messages
    if (data.chat.messages.length > 200) {
      data.chat.messages = data.chat.messages.slice(-200);
    }

    data.chat.lastUpdate = new Date().toISOString();
    await writeData(data);

    return Response.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/chat - Get chat messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const after = searchParams.get('after');
    
    const data = await readData();
    let messages = data.chat.messages;

    // Filter messages after a certain timestamp
    if (after) {
      messages = messages.filter((m: any) => new Date(m.timestamp) > new Date(after));
    }

    // Get last N messages
    messages = messages.slice(-limit);

    return Response.json({ 
      success: true, 
      messages,
      lastUpdate: data.chat.lastUpdate 
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
