import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8564487018:AAFQ4ViP3-e84znrkMOdVZoqn0BYzOO_sr8';
const TELEGRAM_CHAT_ID = '1715010575';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Send message to Telegram
async function sendTelegramMessage(text: string) {
    try {
        const response = await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
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
        const userFacts = memory.facts.filter(function(f: any) { return f.entity === 'Younes' || f.entity === 'younes'; });
        if (userFacts.length > 0) {
            lines.push('USER PROFILE:');
            userFacts.slice(0, 10).forEach(function(f: any) {
                lines.push('- ' + f.predicate + ': ' + f.object);
            });
            lines.push('');
        }

        // Communication preferences
        const allPrefs = memory.preferences || [];
        if (allPrefs.length > 0) {
            lines.push('STYLE PREFERENCES:');
            allPrefs.forEach(function(p: any) {
                lines.push('- ' + p.key + ': ' + p.value + ' (confidence: ' + ((p.confidence * 100) || 0).toFixed(0) + '%)');
            });
            lines.push('');
        }

        // Known entities
        const recentEntities = memory.entities
            .sort(function(a: any, b: any) { return (b.mentionCount || 0) - (a.mentionCount || 0); })
            .slice(0, 8);
        if (recentEntities.length > 0) {
            lines.push('KNOWN ENTITIES:');
            recentEntities.forEach(function(e: any) {
                lines.push('- ' + e.name + ' (' + e.type + '): ' + (e.description || 'no description'));
            });
            lines.push('');
        }

        // Other facts (non-user)
        const otherFacts = memory.facts.filter(function(f: any) { return f.entity !== 'Younes' && f.entity !== 'younes'; });
        if (otherFacts.length > 0) {
            lines.push('REMEMBERED FACTS:');
            otherFacts.slice(0, 10).forEach(function(f: any) {
                lines.push('- ' + f.entity + ' ' + f.predicate + ' ' + f.object);
            });
            lines.push('');
        }

        // Available agents
        if (agents.length > 0) {
            lines.push('AVAILABLE AGENTS:');
            agents.forEach(function(a: any) {
                const caps = a.capabilities ? a.capabilities.map(function(c: any) { return c.name; }).join(', ') : 'general';
                lines.push('- ' + a.name + ': ' + (a.role || a.currentTask || 'idle') + ' (capabilities: ' + caps + ')');
            });
            lines.push('');
        }

        // Active monitors
        const activeMonitors = scouts.monitors.filter(function(m: any) { return m.enabled; });
        if (activeMonitors.length > 0) {
            lines.push('ACTIVE MONITORS:');
            activeMonitors.forEach(function(m: any) {
                const lastCheck = m.config.lastCheck ? new Date(m.config.lastCheck).toLocaleString() : 'never';
                lines.push('- ' + m.name + ' (' + m.type + '): last checked ' + lastCheck);
            });
            lines.push('');
        }

        // Unread alerts
        const unread = scouts.alerts.filter(function(a: any) { return !a.read; });
        if (unread.length > 0) {
            lines.push('UNREAD ALERTS (' + unread.length + '):');
            unread.slice(0, 5).forEach(function(a: any) {
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

// Build evolution context for system prompt
function buildEvolutionContext(evolution: any): string {
    if (!evolution) return '';

    const lines: string[] = [];
    const pendingIdeas = (evolution.ideas || []).filter(function(i: any) { return i.status === 'pending'; });
    const recentApplied = (evolution.history || []).filter(function(h: any) { return h.type === 'auto_applied' || h.type === 'user_approved'; }).slice(-5);

    if (pendingIdeas.length > 0) {
        lines.push('PENDING EVOLUTION IDEAS (' + pendingIdeas.length + '):');
        pendingIdeas.forEach(function(idea: any, idx: number) {
            lines.push('#' + (idx + 1) + ' [' + idea.category + '] ' + idea.title + ': ' + idea.description);
        });
        lines.push('');
        lines.push('You can mention these to Younes. He can say "apply idea #N" or "reject idea #N".');
        lines.push('');
    }

    if (recentApplied.length > 0) {
        lines.push('RECENTLY APPLIED IMPROVEMENTS:');
        recentApplied.forEach(function(h: any) {
            lines.push('- ' + h.summary);
        });
        lines.push('');
    }

    if (evolution.lastRun) {
        lines.push('Last evolution cycle: ' + new Date(evolution.lastRun).toLocaleString());
        lines.push('');
    }

    return lines.join('\n');
}

// Handle evolution commands from user (apply/reject ideas)
async function handleEvolutionCommand(message: string, data: any): Promise<string | null> {
    const lowerMsg = message.toLowerCase().trim();

    // Show pending ideas
    if (lowerMsg === 'show ideas' || lowerMsg === 'show improvements' || lowerMsg === 'what improvements' || lowerMsg === 'pending ideas') {
        if (!data.evolution) return 'No evolution data yet. The evolution system runs every 6 hours to suggest improvements!';

        const pendingIdeas = data.evolution.ideas.filter(function(i: any) { return i.status === 'pending'; });
        if (pendingIdeas.length === 0) {
            return 'No pending improvement ideas right now! I\'ll come up with more in the next evolution cycle.';
        }

        let reply = 'Here are the pending improvement ideas:\n\n';
        pendingIdeas.forEach(function(idea: any, idx: number) {
            reply += '#' + (idx + 1) + ' [' + idea.category.toUpperCase() + '] ' + idea.title + '\n';
            reply += idea.description + '\n';
            reply += 'Priority: ' + idea.priority + '\n\n';
        });
        reply += 'Say "apply idea #N" to approve or "reject idea #N" to dismiss.';
        return reply;
    }

    // Apply idea
    const applyMatch = lowerMsg.match(/apply idea #?(\d+)/);
    if (applyMatch) {
        const ideaNum = parseInt(applyMatch[1], 10);
        if (!data.evolution) return 'No evolution data yet.';

        const pendingIdeas = data.evolution.ideas.filter(function(i: any) { return i.status === 'pending'; });
        if (ideaNum < 1 || ideaNum > pendingIdeas.length) {
            return 'Invalid idea number. I have ' + pendingIdeas.length + ' pending idea(s). Use "show ideas" to see them.';
        }

        const idea = pendingIdeas[ideaNum - 1];
        const now = new Date().toISOString();

        // Execute action blocks
        const results: string[] = [];
        for (const block of idea.actionBlocks) {
            try {
                if (block.type === 'DASHBOARD_CMD') {
                    if (block.action === 'add_nav_item') {
                        const p = block.params;
                        if (!data.dashboard) data.dashboard = { title: 'Dashboard YOYO', subtitle: 'Younes AI Co.', navItems: [] };
                        if (data.dashboard.navItems.length < 15) {
                            data.dashboard.navItems.push({
                                id: p.label.toLowerCase().replace(/\s+/g, '-'),
                                href: p.href || '/' + p.label.toLowerCase().replace(/\s+/g, '-'),
                                label: p.label,
                                icon: p.icon || 'FileText',
                                order: data.dashboard.navItems.length,
                            });
                            results.push('Added "' + p.label + '" to sidebar');
                        }
                    } else if (block.action === 'remove_nav_item') {
                        const item = data.dashboard.navItems.find(function(n: any) { return n.label === block.params.label; });
                        if (item && !item.protected) {
                            data.dashboard.navItems = data.dashboard.navItems.filter(function(n: any) { return n.label !== block.params.label; });
                            results.push('Removed "' + block.params.label + '" from sidebar');
                        }
                    }
                } else if (block.type === 'MEMORY_CMD') {
                    if (block.action === 'store_fact') {
                        const p = block.params;
                        if (p.entity && p.predicate && p.object) {
                            if (!data.memory) data.memory = { facts: [], entities: [], preferences: [], relationships: [] };
                            data.memory.facts.push({
                                id: 'fact-evo-' + Date.now(),
                                entity: p.entity,
                                predicate: p.predicate,
                                object: p.object,
                                source: 'evolution',
                                confidence: 0.9,
                                extractedAt: now,
                                lastMentioned: now,
                            });
                            results.push('Stored fact: ' + p.entity + ' ' + p.predicate + ' ' + p.object);
                        }
                    }
                } else if (block.type === 'SCOUT_CMD') {
                    if (block.action === 'add_monitor') {
                        const p = block.params;
                        if (!data.scouts) data.scouts = { monitors: [], alerts: [] };
                        data.scouts.monitors.push({
                            id: 'monitor-evo-' + Date.now(),
                            type: p.type,
                            name: p.name,
                            config: { ...(p.config || {}), checkInterval: 3600, lastCheck: null, lastHash: null },
                            enabled: true,
                            createdAt: now,
                        });
                        results.push('Created monitor: ' + p.name);
                    }
                }
            } catch (err) {
                console.error('Error applying idea action:', err);
                results.push('Failed: ' + block.action);
            }
        }

        // Update idea status
        const ideaIdx = data.evolution.ideas.findIndex(function(i: any) { return i.id === idea.id; });
        if (ideaIdx >= 0) {
            data.evolution.ideas[ideaIdx].status = 'applied';
        }

        // Record in history
        data.evolution.history.push({
            id: 'action-' + Date.now(),
            ideaId: idea.id,
            type: 'user_approved',
            executedAt: now,
            summary: idea.title + ': ' + results.join(', '),
        });

        await writeData(data);

        return 'Applied idea #' + ideaNum + ': ' + idea.title + '\n\n' + results.map(function(r) { return '\u2705 ' + r; }).join('\n');
    }

    // Reject idea
    const rejectMatch = lowerMsg.match(/reject idea #?(\d+)/);
    if (rejectMatch) {
        const ideaNum = parseInt(rejectMatch[1], 10);
        if (!data.evolution) return 'No evolution data yet.';

        const pendingIdeas = data.evolution.ideas.filter(function(i: any) { return i.status === 'pending'; });
        if (ideaNum < 1 || ideaNum > pendingIdeas.length) {
            return 'Invalid idea number. I have ' + pendingIdeas.length + ' pending idea(s). Use "show ideas" to see them.';
        }

        const idea = pendingIdeas[ideaNum - 1];
        const now = new Date().toISOString();

        // Update idea status
        const ideaIdx = data.evolution.ideas.findIndex(function(i: any) { return i.id === idea.id; });
        if (ideaIdx >= 0) {
            data.evolution.ideas[ideaIdx].status = 'rejected';
        }

        // Record in history
        data.evolution.history.push({
            id: 'action-' + Date.now(),
            ideaId: idea.id,
            type: 'rejected',
            executedAt: now,
            summary: 'Rejected: ' + idea.title,
        });

        await writeData(data);

        return 'Rejected idea #' + ideaNum + ': ' + idea.title + '. I\'ll keep that in mind for future suggestions.';
    }

    return null;
}

// Build system prompt with memory context
function buildSystemPrompt(memoryContext: string, evolutionContext: string): string {
    let prompt = 'You are Kimi \u2014 an AI CEO, coach, and command center for Younes. You live inside Dashboard YOYO.\n\n';
    
    prompt += 'CRITICAL RULE: You are an ACTION-TAKER, not just a talker. When Younes asks you to DO something (create an agent, save a memory, check a website, update the dashboard), you MUST include the appropriate command block in your response. NEVER just say "I will do that" or "Sure, I can help" without actually including the command block that makes it happen.\n\n';
    
    prompt += 'AVAILABLE COMMANDS \u2014 use these to take real actions:\n\n';
    
    prompt += '1. DASHBOARD COMMANDS (change sidebar/title):\n';
    prompt += '[DASHBOARD_CMD]{"action":"update_sidebar","params":{"items":[{"label":"Name","href":"/path","icon":"emoji"}]}}[/DASHBOARD_CMD]\n';
    prompt += '[DASHBOARD_CMD]{"action":"update_title","params":{"title":"New Title"}}[/DASHBOARD_CMD]\n\n';
    
    prompt += '2. MEMORY COMMANDS (remember facts/preferences):\n';
    prompt += '[MEMORY_CMD]{"action":"store","params":{"key":"topic","value":"what to remember","category":"preference|fact|goal|project"}}[/MEMORY_CMD]\n\n';
    
    prompt += '3. SCOUT COMMANDS (monitor websites/repos):\n';
    prompt += '[SCOUT_CMD]{"action":"create_monitor","params":{"name":"Monitor Name","url":"https://...","type":"web|github|api","schedule":"0 */6 * * *","notify":true}}[/SCOUT_CMD]\n\n';
    
    prompt += '4. AGENT COMMANDS (create agents and execute tasks):\n';
    prompt += 'To CREATE a new agent:\n';
    prompt += '[ACTION_CMD]{"action":"create_agent","params":{"name":"Agent Name","role":"What this agent does","icon":"emoji","id":"agent-id","capabilities":["generate_text","http_request","github_api","analyze_code"]}}[/ACTION_CMD]\n';
    prompt += 'To EXECUTE a task:\n';
    prompt += '[ACTION_CMD]{"action":"execute","params":{"agentId":"kimi","capability":"generate_text","inputs":{"prompt":"..."}}}[/ACTION_CMD]\n\n';
    
    prompt += 'WHEN TO USE COMMANDS (trigger patterns):\n';
    prompt += '- User says "add agent" / "create agent" / "I need a bot for X" / "make an agent" -> use ACTION_CMD with create_agent\n';
    prompt += '- User says "remember" / "save this" / "note that" / "don\'t forget" -> use MEMORY_CMD\n';
    prompt += '- User says "monitor" / "watch" / "track" / "alert me" -> use SCOUT_CMD\n';
    prompt += '- User says "change sidebar" / "update menu" / "rename dashboard" -> use DASHBOARD_CMD\n';
    prompt += '- User says "run" / "execute" / "do this task" / "analyze" -> use ACTION_CMD with execute\n\n';
    
    if (memoryContext) {
        prompt += 'MEMORY CONTEXT:\n' + memoryContext + '\n\n';
    }
    
    if (evolutionContext) {
        prompt += 'EVOLUTION CONTEXT:\n' + evolutionContext + '\n\n';
    }
    
    prompt += 'GUIDELINES:\n';
    prompt += '- ALWAYS include command blocks when the user requests an action. Do NOT just say "I will do that" without the command block.\n';
    prompt += '- You can include MULTIPLE command blocks in one response if needed.\n';
    prompt += '- Respond conversationally AND include commands. Example: "Great, I am creating a Research Bot for you now! [ACTION_CMD]...[/ACTION_CMD]"\n';
    prompt += '- Be proactive: if the user describes a need, suggest AND create the right agent/monitor/memory.\n';
    prompt += '- Keep responses concise but warm. You are Younes\'s AI partner.\n';
    
    return prompt;
}

// Generate reply using Kimi K2 via OpenRouter
async function generateKimiReply(userMessage: string, chatHistory: any[], memoryContext: string, evolutionContext: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        return "I'm Kimi, your AI assistant! (API key not configured - using fallback response)";
    }

    try {
        const recentHistory = chatHistory.slice(-10).map(function(msg: any) {
            return {
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text,
            };
        });

        const systemPrompt = buildSystemPrompt(memoryContext, evolutionContext);

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
                    const item = data.dashboard.navItems.find(function(n: any) { return n.label === label; });
                    if (item?.protected) {
                        updates.push('Cannot remove "' + label + '" (protected)');
                        break;
                    }
                    data.dashboard.navItems = data.dashboard.navItems.filter(function(n: any) { return n.label !== label; });
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
                    const reordered = labels.map(function(l: string, i: number) {
                        const item = data.dashboard.navItems.find(function(n: any) { return n.label === l; });
                        return item ? { ...item, order: i } : null;
                    }).filter(Boolean);
                    const remaining = data.dashboard.navItems.filter(function(n: any) { return !labels.includes(n.label); });
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
                    const exists = data.memory.facts.some(function(f: any) {
                        return f.entity === p.entity && f.predicate === p.predicate && f.object === p.object;
                    });
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
                    const existingIdx = data.memory.preferences.findIndex(function(pr: any) { return pr.key === p.key; });
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
                    data.scouts.monitors = data.scouts.monitors.filter(function(m: any) { return m.id !== id; });
                    updates.push('Removed monitor ' + id);
                    break;
                }
                case 'enable_monitor': {
                    const idx = data.scouts.monitors.findIndex(function(m: any) { return m.id === cmd.params.id; });
                    if (idx >= 0) {
                        data.scouts.monitors[idx].enabled = true;
                        updates.push('Enabled monitor: ' + data.scouts.monitors[idx].name);
                    }
                    break;
                }
                case 'disable_monitor': {
                    const idx2 = data.scouts.monitors.findIndex(function(m: any) { return m.id === cmd.params.id; });
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
                }).catch(function(err) { console.error('Agent execution dispatch error:', err); });

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

        // Initialize evolution if missing
        if (!data.evolution) {
            data.evolution = { ideas: [], history: [], lastRun: '', hashes: [] };
        }

        // Check for evolution commands first
        const evoResult = await handleEvolutionCommand(message, data);
        if (evoResult) {
            // Add user message
            const userMsg = {
                id: 'msg-' + Date.now(),
                sender: 'user',
                text: message,
                timestamp: new Date().toISOString(),
            };
            data.chat.messages.push(userMsg);

            // Add evolution response
            const kimiMsg = {
                id: 'msg-' + (Date.now() + 1),
                sender: 'agent',
                text: evoResult,
                timestamp: new Date().toISOString(),
            };
            data.chat.messages.push(kimiMsg);
            data.chat.lastUpdate = new Date().toISOString();

            await writeData(data);

            return Response.json({
                reply: evoResult,
                dashboardUpdates: [],
                timestamp: new Date().toISOString(),
            });
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

        // Build evolution context
        const evolutionContext = buildEvolutionContext(data.evolution);

        // Generate Kimi reply with memory and evolution context
        const kimiReply = await generateKimiReply(message, data.chat.messages, memoryContext, evolutionContext);

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
        await writeData(data);

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
