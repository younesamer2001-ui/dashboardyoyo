// Evolution utilities for Kimi's self-improvement system

import crypto from 'crypto';

export function generateIdeaHash(category: string, title: string, actionBlocks: any[]): string {
    const raw = (category + title + JSON.stringify(actionBlocks)).toLowerCase();
    return crypto.createHash('md5').update(raw).digest('hex').slice(0, 12);
}

export function classifyIdea(idea: { category: string; actionBlocks: any[] }): 'auto_apply' | 'needs_approval' {
    // Safe to auto-apply: memory facts, preferences, new monitors
    const safeTypes = ['MEMORY_CMD', 'SCOUT_CMD'];
    const allSafe = idea.actionBlocks.every(function(block: any) {
        return safeTypes.includes(block.type);
    });

    // Dashboard changes and workflow changes need approval
    if (idea.category === 'dashboard' || idea.category === 'workflow') {
        return 'needs_approval';
    }

    return allSafe ? 'auto_apply' : 'needs_approval';
}

export function buildEvolutionPrompt(state: {
    navItems: any[];
    monitors: any[];
    memoryStats: { facts: number; entities: number; preferences: number };
    alerts: any[];
    recentFeed: any[];
    entities: any[];
    evolutionHistory: any[];
}): string {
    let prompt = 'You are Kimi, the AI brain behind Dashboard YOYO. You are running an evolution cycle to improve the dashboard for your user Younes.\n\n';

    prompt += 'CURRENT DASHBOARD STATE:\n';
    prompt += '- Sidebar items: ' + state.navItems.map(function(n: any) { return n.label; }).join(', ') + '\n';
    prompt += '- Active monitors: ' + state.monitors.length + '\n';
    if (state.monitors.length > 0) {
        prompt += '  Monitors: ' + state.monitors.map(function(m: any) { return m.name + ' (' + m.type + ')'; }).join(', ') + '\n';
    }
    prompt += '- Memory: ' + state.memoryStats.facts + ' facts, ' + state.memoryStats.entities + ' entities, ' + state.memoryStats.preferences + ' preferences\n';
    prompt += '- Unread alerts: ' + state.alerts.filter(function(a: any) { return !a.read; }).length + '\n';
    prompt += '- Known entities: ' + state.entities.map(function(e: any) { return e.name; }).join(', ') + '\n';

    if (state.recentFeed.length > 0) {
        prompt += '\nRECENT ACTIVITY:\n';
        state.recentFeed.slice(0, 5).forEach(function(f: any) {
            prompt += '- [' + f.type + '] ' + (f.content || f.title || f.description || '') + '\n';
        });
    }

    if (state.evolutionHistory.length > 0) {
        prompt += '\nRECENT EVOLUTION ACTIONS (avoid repeating):\n';
        state.evolutionHistory.slice(-5).forEach(function(h: any) {
            prompt += '- ' + h.summary + ' (' + h.type + ')\n';
        });
    }

    prompt += '\nYour job: suggest 3-5 concrete improvements. Each idea must be one of these categories:\n';
    prompt += '- "memory": Store useful facts or preferences (auto-applied)\n';
    prompt += '- "monitor": Add monitoring for useful sources (auto-applied)\n';
    prompt += '- "dashboard": UI changes like sidebar items (needs user approval)\n';
    prompt += '- "workflow": New automations or behaviors (needs user approval)\n\n';

    prompt += 'Respond with ONLY a JSON array. Each object must have:\n';
    prompt += '{\n';
    prompt += '  "category": "memory" | "monitor" | "dashboard" | "workflow",\n';
    prompt += '  "title": "short title",\n';
    prompt += '  "description": "why this helps Younes",\n';
    prompt += '  "priority": "low" | "medium" | "high",\n';
    prompt += '  "actionBlocks": [\n';
    prompt += '    { "type": "MEMORY_CMD" | "SCOUT_CMD" | "DASHBOARD_CMD" | "ACTION_CMD",\n';
    prompt += '      "action": "the action name",\n';
    prompt += '      "params": { ... } }\n';
    prompt += '  ]\n';
    prompt += '}\n\n';

    prompt += 'Focus on practical improvements that make the dashboard more useful as a daily tool. Think about what a personal AI assistant should track and remember.\n';
    prompt += 'IMPORTANT: Return ONLY the JSON array, no markdown, no explanation.';

    return prompt;
}

export function parseEvolutionResponse(text: string): any[] {
    try {
        // Try direct parse first
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
        return [];
    } catch (e) {
        // Try to extract JSON array from text
        const arrayMatch = text.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            try {
                const parsed = JSON.parse(arrayMatch[0]);
                if (Array.isArray(parsed)) return parsed;
            } catch (e2) {
                // ignore
            }
        }
        return [];
    }
}

export function formatTelegramSummary(
    applied: { title: string; category: string }[],
    pending: { id: string; title: string; category: string }[]
): string {
    let msg = '\u{1F9E0} <b>KIMI EVOLUTION REPORT</b>\n\n';

    if (applied.length > 0) {
        msg += '\u2705 <b>Auto-applied:</b>\n';
        applied.forEach(function(a) {
            msg += '  \u2022 ' + a.title + ' [' + a.category + ']\n';
        });
        msg += '\n';
    }

    if (pending.length > 0) {
        msg += '\u23F3 <b>Needs your approval:</b>\n';
        pending.forEach(function(p, i) {
            msg += '  \u2022 #' + (i + 1) + ': ' + p.title + '\n';
        });
        msg += '\nReply in chat: "apply idea #N" or "reject idea #N"';
    }

    if (applied.length === 0 && pending.length === 0) {
        msg += 'No new improvements this cycle. Everything looks good! \u{1F44D}';
    }

    return msg;
}
