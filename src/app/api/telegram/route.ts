import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8564487018:AAFQ4ViP3-e84znrkMOdVZoqn0BYzOO_sr8';

// POST /api/telegram - Receive messages from Telegram bot webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    // Handle regular messages
    if (message && message.text) {
      const { text, from, chat, message_id } = message;

      const data = await readData();

      // Determine if sender is "agent" (anyone messaging the bot) or "user"
      // Messages from Younes show as user, all others show as agent (Kimi)
      const isYounes = from.username === 'yoyokoko12' || from.id === 1715010575;
      const senderType = isYounes ? 'user' : 'agent';
      const senderName = isYounes ? 'Younes' : (from.first_name || 'Kimi');

      const newMessage = {
        id: `tg-${message_id}`,
        text: text,
        sender: senderType,
        agentId: senderType === 'agent' ? 'kimi' : 'user',
        agentName: senderName,
        agentIcon: senderType === 'agent' ? 'K' : 'Y',
        timestamp: new Date().toISOString(),
        telegramChatId: chat.id,
      };

      data.chat.messages.push(newMessage);
      data.chat.lastUpdate = new Date().toISOString();

      // Add to feed for visibility (only agent messages)
      if (senderType === 'agent') {
        data.feed.unshift({
          id: `feed-${Date.now()}`,
          type: 'message',
          message: `${senderName}: "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`,
          agent: { name: senderName, icon: 'K' },
          timestamp: new Date().toISOString(),
        });
      }

      await writeData(data);

      return Response.json({
        success: true,
        message: 'Message stored',
        chatId: chat.id,
        sender: senderType,
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
          text: 'Hello from Dashboard YOYO! Connection established.',
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
    timestamp: new Date().toISOString(),
  });
}

