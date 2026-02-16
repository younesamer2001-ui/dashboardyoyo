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
          const result = await response.json();
          console.log('Telegram message sent:', result.ok);
          return result;
    } catch (error) {
          console.error('Failed to send Telegram message:', error);
          return null;
    }
}

// Generate reply using Kimi K2 via OpenRouter
async function generateKimiReply(userMessage: string, chatHistory: any[]): Promise<string> {
    if (!OPENROUTER_API_KEY) {
          return "I'm Kimi, your AI assistant! (API key not configured - using fallback response)";
    }

  try {
        const recentHistory = chatHistory.slice(-10).map((msg: any) => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text,
        }));

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://dashboardyoyo.com',
                        'X-Title': 'Dashboard YOYO',
              },
              body: JSON.stringify({
                        model: 'moonshotai/kimi-k2',
                        messages: [
                          {
                                        role: 'system',
                                        content: `You are Kimi, the AI assistant for Dashboard YOYO - Younes's AI command center. You are helpful, friendly, and speak casually. You help Younes manage his dashboard and agents.

                                        When the user asks you to modify the dashboard (add menu items, remove pages, change title, change subtitle, etc.), you MUST include a command block in your response like this:
                                        [DASHBOARD_CMD]{"action":"add_nav_item","params":{"label":"Reports","href":"/reports","icon":"BarChart3"}}[/DASHBOARD_CMD]

                                        Available actions:
                                        - add_nav_item: params: {label, href, icon} - Add a new page to the sidebar. Icon should be a Lucide icon name like BarChart3, FileText, Settings, Shield, Zap, Globe, Database, etc.
                                        - remove_nav_item: params: {label} - Remove a page from the sidebar by its label name. You cannot remove "Chat with Kimi".
                                        - update_title: params: {title} - Change the dashboard title shown in the sidebar.
                                        - update_subtitle: params: {subtitle} - Change the subtitle shown in the sidebar.
                                        - reorder_nav: params: {labels} - Reorder sidebar items. labels is an array of label strings in the new order.

                                        IMPORTANT: Always include the command block when the user asks for a dashboard change. Put the command block at the END of your message. Write your friendly response first, then add the command block.

                                        If the user is just chatting normally (not asking for dashboard changes), respond normally without any command blocks.`
                          },
                                    ...recentHistory,
                          { role: 'user', content: userMessage },
                                  ],
                        max_tokens: 1024,
                        temperature: 0.7,
              }),
      });

      const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
                return data.choices[0].message.content;
        }
        return "Hmm, I couldn't generate a response. Try again!";
  } catch (error) {
        console.error('Kimi API error:', error);
        return "Sorry, I'm having trouble connecting right now. Try again in a moment!";
  }
}

// Process dashboard commands from Kimi's response
async function processDashboardCommands(kimiReply: string, data: any): Promise<{cleanReply: string, updates: string[]}> {
    const cmdRegex = /\[DASHBOARD_CMD\]([\s\S]*?)\[\/DASHBOARD_CMD\]/g;
    const updates: string[] = [];
    let cleanReply = kimiReply;
    let match;

  while ((match = cmdRegex.exec(kimiReply)) !== null) {
        try {
                const cmd = JSON.parse(match[1]);
                cleanReply = cleanReply.replace(match[0], '');

          if (!data.dashboard) {
                    data.dashboard = { title: 'Dashboard YOYO', subtitle: 'Younes AI Co.', navItems: [] };
          }

          switch (cmd.action) {
            case 'add_nav_item': {
                        if (data.dashboard.navItems.length >= 15) {
                                      updates.push('Cannot add more items (max 15)');
                                      break;
                        }
                        const newItem = {
                                      id: cmd.params.label.toLowerCase().replace(/\s+/g, '-'),
                                      href: cmd.params.href || `/${cmd.params.label.toLowerCase().replace(/\s+/g, '-')}`,
                                      label: cmd.params.label,
                                      icon: cmd.params.icon || 'FileText',
                                      order: data.dashboard.navItems.length,
                        };
                        data.dashboard.navItems.push(newItem);
                        updates.push(`Added "${cmd.params.label}" to sidebar`);
                        break;
            }

            case 'remove_nav_item': {
                        const label = cmd.params.label;
                        const item = data.dashboard.navItems.find((n: any) => n.label === label);
                        if (item?.protected) {
                                      updates.push(`Cannot remove "${label}" (protected)`);
                                      break;
                        }
                        data.dashboard.navItems = data.dashboard.navItems.filter((n: any) => n.label !== label);
                        updates.push(`Removed "${label}" from sidebar`);
                        break;
            }

            case 'update_title': {
                        data.dashboard.title = cmd.params.title;
                        updates.push(`Title changed to "${cmd.params.title}"`);
                        break;
            }

            case 'update_subtitle': {
                        data.dashboard.subtitle = cmd.params.subtitle;
                        updates.push(`Subtitle changed to "${cmd.params.subtitle}"`);
                        break;
            }

            case 'reorder_nav': {
                        const labels = cmd.params.labels;
                        const reordered = labels.map((label: string, i: number) => {
                                      const item = data.dashboard.navItems.find((n: any) => n.label === label);
                                      return item ? { ...item, order: i } : null;
                        }).filter(Boolean);
                        const remaining = data.dashboard.navItems.filter((n: any) => !labels.includes(n.label));
                        data.dashboard.navItems = [...reordered, ...remaining];
                        updates.push('Sidebar reordered');
                        break;
            }

            default:
                        updates.push(`Unknown command: ${cmd.action}`);
          }
        } catch (e) {
                console.error('Command parse error:', e);
                updates.push('Failed to process a command');
        }
  }

  if (updates.length > 0) {
        await writeData(data);
  }

  return { cleanReply: cleanReply.trim(), updates };
}

// GET - Fetch chat messages
export async function GET() {
    try {
          const data = await readData();
          return Response.json({
                  messages: data.chat?.messages || [],
                  lastUpdate: data.chat?.lastUpdate || new Date().toISOString(),
          });
    } catch (error) {
          console.error('Chat GET error:', error);
          return Response.json({ messages: [], lastUpdate: new Date().toISOString() });
    }
}

// POST - Send message and get Kimi reply
export async function POST(request: NextRequest) {
    try {
          const body = await request.json();
          const { message } = body;

      if (!message) {
              return Response.json({ error: 'Message is required' }, { status: 400 });
      }

      const data = await readData();

      if (!data.chat) {
              data.chat = { messages: [], lastUpdate: new Date().toISOString() };
      }

      // Add user message
      const userMsg = {
              id: `msg-${Date.now()}`,
              sender: 'user',
              text: message,
              timestamp: new Date().toISOString(),
      };
          data.chat.messages.push(userMsg);
          data.chat.lastUpdate = new Date().toISOString();

      // Save user message first
      await writeData(data);

      // Send to Telegram
      await sendTelegramMessage(`From Dashboard: ${message}`);

      // Generate Kimi reply
      const kimiReply = await generateKimiReply(message, data.chat.messages);

      // Process any dashboard commands in the reply
      const { cleanReply, updates } = await processDashboardCommands(kimiReply, data);

      // Build final reply text
      let finalReply = cleanReply;
          if (updates.length > 0) {
                  finalReply += '\n\n' + updates.map(u => `Dashboard updated: ${u}`).join('\n');
          }

      // Add Kimi's reply
      const kimiMsg = {
              id: `msg-${Date.now() + 1}`,
              sender: 'kimi',
              text: finalReply,
              timestamp: new Date().toISOString(),
      };
          data.chat.messages.push(kimiMsg);
          data.chat.lastUpdate = new Date().toISOString();

      // Update agent metrics
      if (data.agents?.[0]) {
              data.agents[0].metrics.messagesSent += 1;
              data.agents[0].lastActive = new Date().toISOString();
      }

      await writeData(data);

      return Response.json({
              reply: finalReply,
              dashboardUpdates: updates,
              timestamp: new Date().toISOString(),
      });
    } catch (error) {
          console.error('Chat POST error:', error);
          return Response.json({ error: 'Failed to process message' }, { status: 500 });
    }
}
