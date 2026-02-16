import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8564487018:AAFQ4ViP3-e84znrkMOdVZoqn0BYzOO_sr8';

async function sendTelegramReply(chatId: number | string, text: string) {
    try {
        const maxLen = 4000;
        const chunks: string[] = [];
        let remaining = text;
        while (remaining.length > 0) {
            if (remaining.length <= maxLen) { chunks.push(remaining); break; }
            let splitAt = remaining.lastIndexOf('\n', maxLen);
            if (splitAt < maxLen * 0.5) splitAt = maxLen;
            chunks.push(remaining.slice(0, splitAt));
            remaining = remaining.slice(splitAt).trimStart();
        }
        for (const chunk of chunks) {
            await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: chunk, parse_mode: 'Markdown' }),
            });
        }
        return true;
    } catch (error) {
        console.error('Failed to send Telegram reply:', error);
        try {
            await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4000) }),
            });
        } catch (e) { console.error('Retry failed:', e); }
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message } = body;
        if (message && message.text) {
            const { text, from, chat, message_id } = message;
            const isYounes = from.username === 'yoyokoko12' || from.id === 1715010575;
            if (isYounes) {
                const baseUrl = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : process.env.NEXT_PUBLIC_VERCEL_URL ? 'https://' + process.env.NEXT_PUBLIC_VERCEL_URL : 'https://dashboardyoyo.com';
                try {
                    const chatResponse = await fetch(baseUrl + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, source: 'telegram' }) });
                    const chatResult = await chatResponse.json();
                    if (chatResult.reply) {
                        await sendTelegramReply(chat.id, chatResult.reply);
                        return Response.json({ success: true, message: 'Processed via AI pipeline', chatId: chat.id, dashboardUpdates: chatResult.dashboardUpdates || [] });
                    } else if (chatResult.error) {
                        await sendTelegramReply(chat.id, 'Error: ' + chatResult.error);
                        return Response.json({ success: false, error: chatResult.error });
                    }
                } catch (error) {
                    console.error('Chat API failed:', error);
                    const data = await readData();
                    if (!data.chat) data.chat = { messages: [], lastUpdate: new Date().toISOString() };
                    data.chat.messages.push({ id: 'tg-' + message_id, text, sender: 'user', agentId: 'user', agentName: 'Younes', agentIcon: 'Y', timestamp: new Date().toISOString(), telegramChatId: chat.id });
                    data.chat.lastUpdate = new Date().toISOString();
                    await writeData(data);
                    await sendTelegramReply(chat.id, 'Stored but had trouble processing. Try dashboardyoyo.com/chat');
                    return Response.json({ success: false, error: String(error) });
                }
            } else {
                const data = await readData();
                const senderName = from.first_name || 'Kimi';
                data.chat.messages.push({ id: 'tg-' + message_id, text, sender: 'agent', agentId: 'kimi', agentName: senderName, agentIcon: 'K', timestamp: new Date().toISOString(), telegramChatId: chat.id });
                data.chat.lastUpdate = new Date().toISOString();
                data.feed.unshift({ id: 'feed-' + Date.now(), type: 'message', message: senderName + ': "' + text.slice(0, 80) + (text.length > 80 ? '...' : '') + '"', agent: { name: senderName, icon: 'K' }, timestamp: new Date().toISOString() });
                await writeData(data);
                return Response.json({ success: true, message: 'Agent message stored', chatId: chat.id, sender: 'agent' });
            }
        }
        return Response.json({ success: true, message: 'Webhook received' });
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('action') === 'test') {
        const chatId = searchParams.get('chatId');
        if (!chatId) return Response.json({ success: false, error: 'chatId required' });
        try {
            const r = await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: 'Hello from Dashboard YOYO!' }) });
            return Response.json({ success: (await r.json()).ok });
        } catch (e) { return Response.json({ success: false, error: String(e) }); }
    }
    return Response.json({ success: true, message: 'Telegram webhook active', bot: '@testkimiiibot', timestamp: new Date().toISOString() });
}
