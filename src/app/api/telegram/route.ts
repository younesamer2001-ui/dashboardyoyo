import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8564487018:AAFQ4ViP3-e84znrkMOdVZoqn0BYzOO_sr8';

// POST /api/telegram - Receive messages from Telegram bot webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Telegram webhook format
    const { message, callback_query } = body;
    
    // Handle regular messages
    if (message && message.text) {
      const { text, from, chat, message_id } = message;
      
      // Store incoming message in dashboard
      const data = await readData();
      
      // Only process if from Younes (your Telegram ID)
      // You can update this to your actual Telegram ID
      const isAuthorized = from.username === 'yoyokoko12' || from.id === 1715010575;
      
      if (!isAuthorized) {
        return Response.json({ success: false, error: 'Unauthorized' });
      }
      
      const newMessage = {
        id: `tg-${message_id}`,
        text: text,
        sender: 'agent' as const,
        agentId: 'kimi',
        agentName: 'Kimi',
        agentIcon: '🤖',
        timestamp: new Date().toISOString(),
        telegramChatId: chat.id,
      };

      data.chat.messages.push(newMessage);
      data.chat.lastUpdate = new Date().toISOString();
      
      // Add to feed for visibility
      data.feed.unshift({
        id: `feed-${Date.now()}`,
        type: 'message',
        message: `Kimi: "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`,
        agent: { name: 'Kimi', icon: '🤖' },
        timestamp: new Date().toISOString(),
      });

      await writeData(data);

      return Response.json({ 
        success: true, 
        message: 'Message stored',
        chatId: chat.id
      });
    }

    return Response.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - For verification and manual testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  // Test sending a message to Telegram
  if (action === 'test') {
    const chatId = searchParams.get('chatId');
    if (!chatId) {
      return Response.json({ success: false, error: 'chatId required' });
    }
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '👋 Hello from Dashboard YOYO! Connection established.',
        }),
      });
      
      const result = await response.json();
      return Response.json({ success: result.ok, result });
    } catch (error) {
      return Response.json({ success: false, error: String(error) });
    }
  }
  
  return Response.json({ 
    success: true, 
    message: 'Telegram webhook endpoint active',
    bot: '@testkimiiibot',
    timestamp: new Date().toISOString()
  });
}

// Function to send message back to Telegram (used by chat API)
export async function sendTelegramMessage(chatId: number | string, text: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return { ok: false, error };
  }
}
