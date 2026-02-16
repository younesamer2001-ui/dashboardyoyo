import { readData, writeData } from '@/lib/storage';
import {
    generateIdeaHash,
    classifyIdea,
    buildEvolutionPrompt,
    parseEvolutionResponse,
    formatTelegramSummary
} from '@/lib/evolution-utils';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

async function sendTelegram(text: string) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    try {
        await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: 'HTML',
            }),
        });
    } catch (err) {
        console.error('Telegram send error:', err);
    }
}

async function callKimiK2(prompt: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        return '[]';
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + OPENROUTER_API_KEY,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://dashboardyoyo.com',
                'X-Title': 'Dashboard YOYO Evolution',
            },
            body: JSON.stringify({
                model: 'moonshotai/kimi-k2',
                messages: [
                    { role: 'system', content: 'You are a JSON-only responder. Return only valid JSON arrays.' },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 2048,
                temperature: 0.8,
            }),
        });

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content;
        }
        return '[]';
    } catch (error) {
        console.error('Evolution AI call error:', error);
        return '[]';
    }
}

// Execute safe action blocks (memory and scout commands)
function executeSafeActions(actionBlocks: any[], data: any): string[] {
    const results: string[] = [];
    const now = new Date().toISOString();

    for (const block of actionBlocks) {
        try {
            if (block.type === 'MEMORY_CMD') {
                if (!data.memory) {
                    data.memory = { facts: [], entities: [], preferences: [], relationships: [] };
                }

                if (block.action === 'store_fact') {
                    const p = block.params;
                    if (!p.entity || !p.predicate || !p.object) continue;
                    const exists = data.memory.facts.some(function(f: any) {
                        return f.entity === p.entity && f.predicate === p.predicate && f.object === p.object;
                    });
                    if (!exists) {
                        data.memory.facts.push({
                            id: 'fact-evo-' + Date.now(),
                            entity: p.entity,
                            predicate: p.predicate,
                            object: p.object,
                            source: 'evolution',
                            confidence: 0.7,
                            extractedAt: now,
                            lastMentioned: now,
                        });
                        results.push('Stored fact: ' + p.entity + ' ' + p.predicate + ' ' + p.object);
                    }
                } else if (block.action === 'store_preference') {
                    const p = block.params;
                    if (!p.key || !p.value) continue;
                    const existingIdx = data.memory.preferences.findIndex(function(pr: any) { return pr.key === p.key; });
                    if (existingIdx >= 0) {
                        data.memory.preferences[existingIdx].value = p.value;
                        results.push('Updated preference: ' + p.key);
                    } else {
                        data.memory.preferences.push({
                            id: 'pref-evo-' + Date.now(),
                            category: p.category || 'workflow',
                            key: p.key,
                            value: p.value,
                            confidence: 0.6,
                            learnedAt: now,
                            corrections: 0,
                        });
                        results.push('Stored preference: ' + p.key + ' = ' + p.value);
                    }
                }
            } else if (block.type === 'SCOUT_CMD') {
                if (!data.scouts) {
                    data.scouts = { monitors: [], alerts: [] };
                }

                if (block.action === 'add_monitor') {
                    const p = block.params;
                    if (!p.type || !p.name) continue;
                    // Don't add duplicate monitors
                    const dupMonitor = data.scouts.monitors.some(function(m: any) {
                        return m.name === p.name || (p.config?.repo && m.config?.repo === p.config.repo) || (p.config?.url && m.config?.url === p.config.url);
                    });
                    if (dupMonitor) {
                        results.push('Monitor already exists: ' + p.name);
                        continue;
                    }
                    data.scouts.monitors.push({
                        id: 'monitor-evo-' + Date.now(),
                        type: p.type,
                        name: p.name,
                        config: {
                            ...(p.config || {}),
                            checkInterval: p.config?.checkInterval || 3600,
                            lastCheck: null,
                            lastHash: null,
                        },
                        enabled: true,
                        createdAt: now,
                    });
                    results.push('Created monitor: ' + p.name + ' (' + p.type + ')');
                }
            }
        } catch (err) {
            console.error('Error executing safe action:', err);
            results.push('Failed to execute: ' + block.action);
        }
    }

    return results;
}

export async function GET() {
    const startTime = Date.now();

    try {
        const data = await readData();
        const now = new Date().toISOString();

        // Initialize evolution if missing
        if (!data.evolution) {
            data.evolution = { ideas: [], history: [], lastRun: '', hashes: [] };
        }

        // Build dashboard state for the prompt
        const state = {
            navItems: data.dashboard?.navItems || [],
            monitors: (data.scouts?.monitors || []).filter(function(m: any) { return m.enabled; }),
            memoryStats: {
                facts: (data.memory?.facts || []).length,
                entities: (data.memory?.entities || []).length,
                preferences: (data.memory?.preferences || []).length,
            },
            alerts: data.scouts?.alerts || [],
            recentFeed: (data.feed || []).slice(0, 10),
            entities: data.memory?.entities || [],
            evolutionHistory: data.evolution.history || [],
        };

        // Build prompt and call AI
        const prompt = buildEvolutionPrompt(state);
        const aiResponse = await callKimiK2(prompt);
        const rawIdeas = parseEvolutionResponse(aiResponse);

        if (rawIdeas.length === 0) {
            // No ideas generated, still update lastRun
            data.evolution.lastRun = now;
            await writeData(data);
            return Response.json({ message: 'No ideas generated this cycle', timestamp: now });
        }

        // Process ideas
        const applied: { title: string; category: string }[] = [];
        const pending: { id: string; title: string; category: string }[] = [];
        let idCounter = 0;

        for (const raw of rawIdeas) {
            if (!raw.category || !raw.title || !raw.actionBlocks) continue;

            const hash = generateIdeaHash(raw.category, raw.title, raw.actionBlocks);

            // Dedup check
            if (data.evolution.hashes.includes(hash)) continue;

            const ideaId = 'idea-' + Date.now() + '-' + idCounter;
            idCounter++;

            const classification = classifyIdea(raw);

            const idea = {
                id: ideaId,
                category: raw.category,
                title: raw.title,
                description: raw.description || '',
                priority: raw.priority || 'medium',
                status: classification === 'auto_apply' ? 'applied' : 'pending',
                actionBlocks: raw.actionBlocks,
                suggestedAt: now,
                hash: hash,
            };

            // Add hash to dedup list
            data.evolution.hashes.push(hash);

            if (classification === 'auto_apply') {
                // Execute safe actions immediately
                const results = executeSafeActions(raw.actionBlocks, data);
                idea.status = 'applied';

                data.evolution.history.push({
                    id: 'action-' + Date.now() + '-' + idCounter,
                    ideaId: ideaId,
                    type: 'auto_applied',
                    executedAt: now,
                    summary: idea.title + ': ' + results.join(', '),
                });

                applied.push({ title: idea.title, category: idea.category });
            } else {
                // Queue for user approval
                idea.status = 'pending';
                pending.push({ id: ideaId, title: idea.title, category: idea.category });
            }

            data.evolution.ideas.push(idea);
        }

        // Prune old hashes (keep last 100)
        if (data.evolution.hashes.length > 100) {
            data.evolution.hashes = data.evolution.hashes.slice(-100);
        }

        // Prune old ideas (keep last 50)
        if (data.evolution.ideas.length > 50) {
            data.evolution.ideas = data.evolution.ideas.slice(-50);
        }

        // Prune old history (keep last 50)
        if (data.evolution.history.length > 50) {
            data.evolution.history = data.evolution.history.slice(-50);
        }

        // Post to feed
        if (!data.feed) data.feed = [];
        data.feed.unshift({
            id: 'feed-evo-' + Date.now(),
            type: 'evolution',
            agentName: 'Kimi',
            agentEmoji: '\u{1F9E0}',
            content: 'Evolution cycle: ' + applied.length + ' improvement(s) applied, ' + pending.length + ' pending approval',
            timestamp: now,
        });

        // Keep feed at max 100
        if (data.feed.length > 100) {
            data.feed = data.feed.slice(0, 100);
        }

        // Update lastRun
        data.evolution.lastRun = now;

        // Save everything
        await writeData(data);

        // Send Telegram digest
        const telegramMsg = formatTelegramSummary(applied, pending);
        await sendTelegram(telegramMsg);

        const duration = Date.now() - startTime;
        return Response.json({
            applied: applied.length,
            pending: pending.length,
            ideas: rawIdeas.length,
            duration: duration + 'ms',
            timestamp: now,
        });
    } catch (error) {
        console.error('Evolution cron error:', error);
        return Response.json({ error: 'Evolution cycle failed' }, { status: 500 });
    }
}
