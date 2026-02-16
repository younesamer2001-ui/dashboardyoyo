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

// Build memory context for system prompt injection
async function buildMemoryContext(): Promise<string> {
    try {
        const data = await readData();
        const memory = data.memory || { facts: [], entities: [], preferences: [], relationships: [] };
        const scouts = data.scouts || { monitors: [], alerts: [] };
        const agents = data.agents || [];

        const lines: string[] = [];

        // User profile from facts
        const userFacts = memory.facts.filter((f: any) => f.entity === 'Younes' || f.entity === 'younes');
        if (userFacts.length > 0) {
            lines.push('USER PROFILE:');
            userFacts.slice(0, 10).forEach((f: any) => {
                lines.push('- ' + f.predicate + ': ' + f.object);
            });
            lines.push('');
        }

        // Communication preferences
        const allPrefs = memory.preferences || [];
        if (allPrefs.length > 0) {
            lines.push('STYLE PREFERENCES:');
            allPrefs.forEach((p: any) => {
                lines.push('- ' + p.key + ': ' + p.value + ' (confidence: ' + ((p.confidence * 100) || 0).toFixed(0) + '%)');
            });
            lines.push('');
        }

        // Known entities
        const recentEntities = memory.entities
            .sort((a: any, b: any) => (b.mentionCount || 0) - (a.mentionCount || 0))
            .slice(0, 8);
        if (recentEntities.length > 0) {
            lines.push('KNOWN ENTITIES:');
            recentEntities.forEach((e: any) => {
                lines.push('- ' + e.name + ' (' + e.type + '): ' + (e.description || 'no description'));
            });
            lines.push('');
        }

        // Other facts (non-user)
        const otherFacts = memory.facts.filter((f: any) => f.entity !== 'Younes' && f.entity !== 'younes');
        if (otherFacts.length > 0) {
            lines.push('REMEMBERED FACTS:');
            otherFacts.slice(0, 10).forEach((f: any) => {
                lines.push('- ' + f.entity + ' ' + f.predicate + ' ' + f.object);
            });
            lines.push('');
        }

        // Available agents
        if (agents.length > 0) {
            lines.push('AVAILABLE AGENTS:');
            agents.forEach((a: any) => {
                const caps = a.capabilities ? a.capabilities.map((c: any) => c.name).join(', ') : 'general';
                lines.push('- ' + a.name + ': ' + (a.role || a.currentTask || 'idle') + ' (capabilities: ' + caps + ')');
            });
            lines.push('');
        }

        // Active monitors
        const activeMonitors = scouts.monitors.filter((m: any) => m.enabled);
        if (activeMonitors.length > 0) {
            lines.push('ACTIVE MONITORS:');
            activeMonitors.forEach((m: any) => {
                const lastCheck = m.config.lastCheck ? new Date(m.config.lastCheck).toLocaleString() : 'never';
                lines.push('- ' + m.name + ' (' + m.type + '): last checked ' + lastCheck);
            });
            lines.push('');
        }

        // Unread alerts
        const unread = scouts.alerts.filter((a: any) => !a.read);
        if (unread.length > 0) {
            lines.push('UNREAD ALERTS (' + unread.length + '):');
            unread.slice(0, 5).forEach((a: any) => {
                lines.push('- [' + a.type + '] ' + a.title + ': ' + a.description);
            });
            lines.push('');
        }

        return lines.join('\n');
    } catch (error) {
        console.error('Failed to build memory context:', error);
        return '';
    }
}

// Extract knowledge from conversation (fire-and-forget)
async function extractKnowledge(messages: any[]) {
    try {
        const baseUrl = process.env.VERCEL_URL
            ? 'https://' + process.env.VERCEL_URL
            : process.env.NEXT_PUBLIC_VERCEL_URL
                ? 'https://' + process.env.NEXT_PUBLIC_VERCEL_URL
                : 'https://dashboardyoyo.com';

        await fetch(baseUrl + '/api/memory/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
        });
    } catch (error) {
        console.error('Knowledge extraction error:', error);
    }
}

// Build system prompt with memory context
function buildSystemPrompt(memoryContext: string): string {
    let prompt = 'You are Kimi, Younes\'s AI second brain and command center on Dashboard YOYO. You are helpful, friendly, and speak casually. You help Younes manage his dashboard, remember things, monitor the web, and run agents.\n\n';

    if (memoryContext) {
        prompt += '=== YOUR MEMORY ===\n' + memoryContext + '=== END MEMORY ===\n\n';
    }

    prompt += 'COMMAND BLOCKS - Place at END of your response when needed:\n\n';

    prompt += '1. DASHBOARD COMMANDS (sidebar, title, subtitle):\n';
    prompt += '[DASHBOARD_CMD]{"action":"add_nav_item","params":{"label":"Reports","href":"/reports","icon":"BarChart3"}}[/DASHBOARD_CMD]\n';
    prompt += 'Actions: add_nav_item {label,href,icon}, remove_nav_item {label}, update_title {title}, update_subtitle {subtitle}, reorder_nav {labels}\n';
    prompt += 'Icons: BarChart3, FileText, Settings, Shield, Zap, Globe, Database, Brain, Activity, Users, MessageSquare, LayoutDashboard, Search, Bell, Code\n\n';

    prompt += '2. MEMORY COMMANDS (remember facts, preferences):\n';
    prompt += '[MEMORY_CMD]{"action":"store_fact","params":{"entity":"Younes","predicate":"prefers","object":"dark mode"}}[/MEMORY_CMD]\n';
    prompt += '[MEMORY_CMD]{"action":"store_preference","params":{"category":"communication","key":"tone","value":"casual and friendly"}}[/MEMORY_CMD]\n';
    prompt += 'Actions: store_fact {entity,predicate,object}, store_preference {category,key,value}\n\n';

    prompt += '3. SCOUT COMMANDS (monitor repos, websites):\n';
    prompt += '[SCOUT_CMD]{"action":"add_monitor","params":{"type":"github","name":"My Repo Watcher","config":{"repo":"owner/repo"}}}[/SCOUT_CMD]\n';
    prompt += '[SCOUT_CMD]{"action":"add_monitor","params":{"type":"web","name":"Page Watcher","config":{"url":"https://example.com"}}}[/SCOUT_CMD]\n';
    prompt += 'Actions: add_monitor {type,name,config}, remove_monitor {id}, enable_monitor {id}, disable_monitor {id}\n\n';

    prompt += '4. AGENT COMMANDS (execute tasks):\n';
    prompt += '[ACTION_CMD]{"action":"execute","params":{"agentId":"kimi","capability":"generate_text","inputs":{"prompt":"..."}}}[/ACTION_CMD]\n';
    prompt += 'Capabilities: generate_text {prompt,systemPrompt}, http_request {url,method}, github_api {repo,endpoint}, analyze_code {code,task}\n\n';

    prompt += 'GUIDELINES:\n';
    prompt += '- Reference stored memories when relevant ("As I recall, you...")\n';
    prompt += '- Proactively mention unread alerts if any\n';
    prompt += '- When user asks to remember something, use MEMORY_CMD\n';
    prompt += '- When user asks to monitor/watch something, use SCOUT_CMD\n';
    prompt += '- Suggest agent actions for complex tasks\n';
    prompt += '- Always put command blocks at the END of your response\n';
    prompt += '- If the user is just chatting, respond naturally without command blocks\n';
    prompt += '- Keep your tone consistent with learned style preferences\n';

    return prompt;
}

// Generate reply using Kimi K2 via OpenRouter
async function generateKimiReply(userMessage: string, chatHistory: any[], memoryContext: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        return "I'm Kimi, your AI assistant! (API key not configured - using fallback response)";
    }

    try {
        const recentHistory = chatHistory.slice(-10).map((msg: any) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
        }));

        const systemPrompt = buildSystemPrompt(memoryContext);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + OPENROUTER_API_KEY,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://dashboardyoyo.com',
                'X-Title': 'Dashboard YOYO',
            },
            body: JSON.stringify({
                model: 'moonshotai/kimi-k2',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...recentHistory,
                    { role: 'user', content: userMessage },
                ],
                max_tokens: 1536,
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
async function processDashboardCommands(kimiReply: string, data: any): Promise<{ cleanReply: string; updates: string[] }> {
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
                        href: cmd.params.href || '/' + cmd.params.label.toLowerCase().replace(/\s+/g, '-'),
                        label: cmd.params.label,
                        icon: cmd.params.icon || 'FileText',
                        order: data.dashboard.navItems.length,
                    };
                    data.dashboard.navItems.push(newItem);
                    updates.push('Added "' + cmd.params.label + '" to sidebar');
                    break;
                }
                case 'remove_nav_item': {
                    const label = cmd.params.label;
                    const item = data.dashboard.navItems.find((n: any) => n.label === label);
                    if (item?.protected) {
                        updates.push('Cannot remove "' + label + '" (protected)');
                        break;
                    }
                    data.dashboard.navItems = data.dashboard.navItems.filter((n: any) => n.label !== label);
                    updates.push('Removed "' + label + '" from sidebar');
                    break;
                }
                case 'update_title': {
                    data.dashboard.title = cmd.params.title;
                    updates.push('Title changed to "' + cmd.params.title + '"');
                    break;
                }
                case 'update_subtitle': {
                    data.dashboard.subtitle = cmd.params.subtitle;
                    updates.push('Subtitle changed to "' + cmd.params.subtitle + '"');
                    break;
                }
                case 'reorder_nav': {
                    const labels = cmd.params.labels;
                    const reordered = labels.map((l: string, i: number) => {
                        const item = data.dashboard.navItems.find((n: any) => n.label === l);
                        return item ? { ...item, order: i } : null;
                    }).filter(Boolean);
                    const remaining = data.dashboard.navItems.filter((n: any) => !labels.includes(n.label));
                    data.dashboard.navItems = [...reordered, ...remaining];
                    updates.push('Sidebar reordered');
                    break;
                }
                default:
                    updates.push('Unknown command: ' + cmd.action);
            }
        } catch (e) {
            console.error('Dashboard command parse error:', e);
            updates.push('Failed to process a dashboard command');
        }
    }

    return { cleanReply, updates };
}

// Process memory commands
async function processMemoryCommands(kimiReply: string, data: any): Promise<{ cleanReply: string; updates: string[] }> {
    const cmdRegex = /\[MEMORY_CMD\]([\s\S]*?)\[\/MEMORY_CMD\]/g;
    const updates: string[] = [];
    let cleanReply = kimiReply;
    let match;

    if (!data.memory) {
        data.memory = { facts: [], entities: [], preferences: [], relationships: [] };
    }

    while ((match = cmdRegex.exec(kimiReply)) !== null) {
        try {
            const cmd = JSON.parse(match[1]);
            cleanReply = cleanReply.replace(match[0], '');
            const now = new Date().toISOString();

            switch (cmd.action) {
                case 'store_fact': {
                    const p = cmd.params;
                    if (!p.entity || !p.predicate || !p.object) break;
                    const exists = data.memory.facts.some((f: any) =>
                        f.entity === p.entity && f.predicate === p.predicate && f.object === p.object
                    );
                    if (!exists) {
                        data.memory.facts.push({
                            id: 'fact-' + Date.now(),
                            entity: p.entity,
                            predicate: p.predicate,
                            object: p.object,
                            source: 'chat',
                            confidence: 0.9,
                            extractedAt: now,
                            lastMentioned: now,
                        });
                        updates.push('Stored fact: ' + p.entity + ' ' + p.predicate + ' ' + p.object);
                    }
                    break;
                }
                case 'store_preference': {
                    const p = cmd.params;
                    if (!p.key || !p.value) break;
                    const existingIdx = data.memory.preferences.findIndex((pr: any) => pr.key === p.key);
                    if (existingIdx >= 0) {
                        data.memory.preferences[existingIdx].value = p.value;
                        data.memory.preferences[existingIdx].confidence = Math.min(1, data.memory.preferences[existingIdx].confidence + 0.1);
                        updates.push('Updated preference: ' + p.key);
                    } else {
                        data.memory.preferences.push({
                            id: 'pref-' + Date.now(),
                            category: p.category || 'workflow',
                            key: p.key,
                            value: p.value,
                            confidence: 0.7,
                            learnedAt: now,
                            corrections: 0,
                        });
                        updates.push('Stored preference: ' + p.key + ' = ' + p.value);
                    }
                    break;
                }
                default:
                    updates.push('Unknown memory action: ' + cmd.action);
            }
        } catch (e) {
            console.error('Memory command parse error:', e);
            updates.push('Failed to process a memory command');
        }
    }

    return { cleanReply, updates };
}

// Process scout commands
async function processScoutCommands(kimiReply: string, data: any): Promise<{ cleanReply: string; updates: string[] }> {
    const cmdRegex = /\[SCOUT_CMD\]([\s\S]*?)\[\/SCOUT_CMD\]/g;
    const updates: string[] = [];
    let cleanReply = kimiReply;
    let match;

    if (!data.scouts) {
        data.scouts = { monitors: [], alerts: [] };
    }

    while ((match = cmdRegex.exec(kimiReply)) !== null) {
        try {
            const cmd = JSON.parse(match[1]);
            cleanReply = cleanReply.replace(match[0], '');

            switch (cmd.action) {
                case 'add_monitor': {
                    const p = cmd.params;
                    if (!p.type || !p.name) break;
                    const monitor = {
                        id: 'monitor-' + Date.now(),
                        type: p.type,
                        name: p.name,
                        config: {
                            ...(p.config || {}),
                            checkInterval: p.config?.checkInterval || 3600,
                            lastCheck: null,
                            lastHash: null,
                        },
                        enabled: true,
                        createdAt: new Date().toISOString(),
                    };
                    data.scouts.monitors.push(monitor);
                    updates.push('Created monitor: ' + p.name + ' (' + p.type + ')');
                    break;
                }
                case 'remove_monitor': {
                    const id = cmd.params.id;
                    data.scouts.monitors = data.scouts.monitors.filter((m: any) => m.id !== id);
                    updates.push('Removed monitor ' + id);
                    break;
                }
                case 'enable_monitor': {
                    const idx = data.scouts.monitors.findIndex((m: any) => m.id === cmd.params.id);
                    if (idx >= 0) {
                        data.scouts.monitors[idx].enabled = true;
                        updates.push('Enabled monitor: ' + data.scouts.monitors[idx].name);
                    }
                    break;
                }
                case 'disable_monitor': {
                    const idx2 = data.scouts.monitors.findIndex((m: any) => m.id === cmd.params.id);
                    if (idx2 >= 0) {
                        data.scouts.monitors[idx2].enabled = false;
                        updates.push('Disabled monitor: ' + data.scouts.monitors[idx2].name);
                    }
                    break;
                }
                default:
                    updates.push('Unknown scout action: ' + cmd.action);
            }
        } catch (e) {
            console.error('Scout command parse error:', e);
            updates.push('Failed to process a scout command');
        }
    }

    return { cleanReply, updates };
}

// Process agent/action commands
async function processActionCommands(kimiReply: string, data: any): Promise<{ cleanReply: string; updates: string[] }> {
    const cmdRegex = /\[ACTION_CMD\]([\s\S]*?)\[\/ACTION_CMD\]/g;
    const updates: string[] = [];
    let cleanReply = kimiReply;
    let match;

    while ((match = cmdRegex.exec(kimiReply)) !== null) {
        try {
            const cmd = JSON.parse(match[1]);
            cleanReply = cleanReply.replace(match[0], '');

            if (cmd.action === 'execute') {
                const p = cmd.params;
                // Queue execution (fire-and-forget to avoid blocking chat)
                const baseUrl = process.env.VERCEL_URL
                    ? 'https://' + process.env.VERCEL_URL
                    : process.env.NEXT_PUBLIC_VERCEL_URL
                        ? 'https://' + process.env.NEXT_PUBLIC_VERCEL_URL
                        : 'https://dashboardyoyo.com';

                fetch(baseUrl + '/api/agents/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agentId: p.agentId || 'kimi',
                        capability: p.capability,
                        inputs: p.inputs || {},
                    }),
                }).catch((err) => console.error('Agent execution dispatch error:', err));

                updates.push('Dispatched ' + p.capability + ' task to ' + (p.agentId || 'kimi'));
            } else if (cmd.action === 'create_agent') {
                const p = cmd.params;
                if (!data.agents) data.agents = [];
                const agent = {
                    id: p.id || 'agent-' + Date.now(),
                    name: p.name || 'New Agent',
                    icon: p.icon || '\u{1F916}',
                    role: p.role || 'Assistant',
                    status: 'active',
                    currentTask: 'Idle',
                    lastActive: new Date().toISOString(),
                    metrics: { tasksCompleted: 0, messagesSent: 0 },
                    capabilities: p.capabilities || [],
                    tools: [],
                };
                data.agents.push(agent);
                updates.push('Created agent: ' + agent.name);
            }
        } catch (e) {
            console.error('Action command parse error:', e);
            updates.push('Failed to process an action command');
        }
    }

    return { cleanReply, updates };
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
            id: 'msg-' + Date.now(),
            sender: 'user',
            text: message,
            timestamp: new Date().toISOString(),
        };
        data.chat.messages.push(userMsg);
        data.chat.lastUpdate = new Date().toISOString();

        // Save user message first
        await writeData(data);

        // Send to Telegram
        await sendTelegramMessage('From Dashboard: ' + message);

        // Build memory context
        const memoryContext = await buildMemoryContext();

        // Generate Kimi reply with memory context
        const kimiReply = await generateKimiReply(message, data.chat.messages, memoryContext);

        // Process all 4 command types
        const allUpdates: string[] = [];

        const dash = await processDashboardCommands(kimiReply, data);
        allUpdates.push(...dash.updates);

        const mem = await processMemoryCommands(dash.cleanReply, data);
        allUpdates.push(...mem.updates);

        const scout = await processScoutCommands(mem.cleanReply, data);
        allUpdates.push(...scout.updates);

        const action = await processActionCommands(scout.cleanReply, data);
        allUpdates.push(...action.updates);

        // Build final reply text
        let finalReply = action.cleanReply.trim();
        if (allUpdates.length > 0) {
            finalReply += '\n\n' + allUpdates.map(function(u) { return '\u2705 ' + u; }).join('\n');
        }

        // Add Kimi's reply
        const kimiMsg = {
            id: 'msg-' + (Date.now() + 1),
            sender: 'agent',
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

        // Save everything
        if (allUpdates.length > 0) {
            await writeData(data);
        } else {
            await writeData(data);
        }

        // Fire-and-forget: extract knowledge from last 5 messages
        const recentMessages = data.chat.messages.slice(-5);
        extractKnowledge(recentMessages);

        return Response.json({
            reply: finalReply,
            dashboardUpdates: allUpdates,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Chat POST error:', error);
        return Response.json({ error: 'Failed to process message' }, { status: 500 });
    }
}
