import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8564487018:AAFQ4ViP3-e84znrkMOdVZoqn0BYzOO_sr8';
const TELEGRAM_CHAT_ID = '1715010575';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Send message to Telegram
async function sendTelegramMessage(text: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return { ok: false };
  }
}

// Generate AI reply using OpenRouter + Kimi 2.5
async function generateKimiReply(userMessage: string, recentMessages: Array<{ text: string; sender: string }>) {
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY not set');
    return null;
  }

  try {
    // Build conversation history for context
    const messages = [
      {
        role: 'system',
        content: `You are Kimi, an advanced AI assistant and agent working for Younes. You are part of Younes' AI Command Center dashboard. You help with tasks, answer questions, and proactively assist Younes. Keep responses concise but helpful. You can use emojis occasionally. Be friendly and professional.`,
      },
      ...recentMessages.slice(-10).map((msg) => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://www.dashboardyoyo.com',
        'X-Title': 'Dashboard YOYO',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2',
        messages,
        temperature: 0.6,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Failed to generate Kimi reply:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sender, agentId } = body;

    if (!text) {
      return Response.json({ error: 'Missing required field: text' }, { status: 400 });
    }

    const data = await readData();

    // Forward user messages to Telegram
    if (sender === 'user') {
      await sendTelegramMessage(`\u{1F4E8} **Dashboard Message:**\n\n${text}`);
    }

    // Store the user message
    const newMessage = {
      id: Date.now().toString(),
      text,
      sender: sender || 'user',
      agentId: agentId || (sender === 'agent' ? 'kimi' : 'user'),
      agentName: sender === 'agent' ? 'Kimi' : 'Younes',
      agentIcon: sender === 'agent' ? '\u{1F916}' : '\u{1F464}',
      timestamp: new Date().toISOString(),
    };

    data.chat.messages.push(newMessage);

    if (data.chat.messages.length > 200) {
      data.chat.messages = data.chat.messages.slice(-200);
    }

    data.chat.lastUpdate = new Date().toISOString();
    await writeData(data);

    // Generate AI reply if the message is from the user
    let aiReply = null;
    if (sender === 'user') {
      const recentMessages = data.chat.messages.slice(-20);
      const kimiResponse = await generateKimiReply(text, recentMessages);

      if (kimiResponse) {
        aiReply = {
          id: (Date.now() + 1).toString(),
          text: kimiResponse,
          sender: 'agent',
          agentId: 'kimi',
          agentName: 'Kimi',
          agentIcon: '\u{1F916}',
          timestamp: new Date().toISOString(),
        };

        // Store the AI reply
        const freshData = await readData();
        freshData.chat.messages.push(aiReply);
        freshData.chat.lastUpdate = new Date().toISOString();
        await writeData(freshData);

        // Send AI reply to Telegram too
        await sendTelegramMessage(`\u{1F916} **Kimi:**\n\n${kimiResponse}`);
      }
    }

    return Response.json({ success: true, message: newMessage, aiReply });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const data = await readData();
    const messages = data.chat.messages.slice(-limit);
    return Response.json({ success: true, messages, lastUpdate: data.chat.lastUpdate });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
