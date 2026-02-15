import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8564487018:AAFQ4ViP3-e84znrkMOdVZoqn0BYzOO_sr8';
const TELEGRAM_CHAT_ID = '1715010575'; // Your Telegram ID

// Send message to Telegram
async function sendTelegramMessage(text: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: `📨 **Dashboard Message:**\n\n${text}`,
        parse_mode: 'Markdown',
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return { ok: false };
  }
}

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
    
    // If from user, forward to Telegram
    if (sender === 'user') {
      await sendTelegramMessage(text);
    }
    
    const newMessage = {
      id: Date.now().toString(),
      text,
      sender: sender || 'user',
      agentId: agentId || (sender === 'agent' ? 'kimi' : 'user'),
      agentName: sender === 'agent' ? 'Kimi' : 'Younes',
      agentIcon: sender === 'agent' ? '🤖' : '👤',
      timestamp: new Date().toISOString(),
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
    
    const data = await readData();
    const messages = data.chat.messages.slice(-limit);

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
