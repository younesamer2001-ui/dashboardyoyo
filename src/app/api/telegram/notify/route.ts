import { NextRequest } from 'next/server';

// POST /api/telegram/notify - Send Telegram notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;
    
    // Telegram bot token and chat ID should be in environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.log('Telegram not configured, skipping notification');
      return Response.json({ success: false, error: 'Telegram not configured' });
    }
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send Telegram message');
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Telegram notify error:', error);
    return Response.json({ success: false, error: 'Failed to send notification' });
  }
}
