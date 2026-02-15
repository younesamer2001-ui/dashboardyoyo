import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

// POST /api/telegram - Receive messages from Telegram bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, from, chat, text } = body;

    // This endpoint receives webhook calls from Telegram
    // Format: https://api.telegram.org/bot<TOKEN>/sendMessage
    
    if (text) {
      // Store incoming message as chat message
      const data = await readData();
      const newMessage = {
        id: `tg-${Date.now()}`,
        text: text,
        sender: 'agent',
        agentId: 'kimi',
        agentName: 'Kimi',
        agentIcon: '🤖',
        timestamp: new Date().toISOString(),
        telegramFrom: from,
      };

      data.chat.messages.push(newMessage);
      data.chat.lastUpdate = new Date().toISOString();
      
      // Also add to feed
      data.feed.unshift({
        id: `feed-${Date.now()}`,
        type: 'message',
        message: `Kimi sent message: ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`,
        agent: { name: 'Kimi', icon: '🤖' },
        timestamp: new Date().toISOString(),
      });

      await writeData(data);

      return Response.json({ success: true, message: newMessage });
    }

    return Response.json({ success: false, error: 'No text provided' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// For Telegram to verify webhook
export async function GET(request: NextRequest) {
  return Response.json({ 
    success: true, 
    message: 'Telegram webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}
