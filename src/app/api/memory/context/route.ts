import { readData } from '@/lib/storage';

// GET - Build memory context block for system prompt injection
export async function GET() {
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
                lines.push(`- ${f.predicate}: ${f.object}`);
            });
            lines.push('');
        }

        // Communication preferences
        const commPrefs = memory.preferences.filter((p: any) => p.category === 'communication' || p.category === 'style');
        if (commPrefs.length > 0) {
            lines.push('STYLE PREFERENCES:');
            commPrefs.forEach((p: any) => {
                lines.push(`- ${p.key}: ${p.value} (confidence: ${(p.confidence * 100).toFixed(0)}%)`);
            });
            lines.push('');
        }

        // Known entities
        const recentEntities = memory.entities
            .sort((a: any, b: any) => b.mentionCount - a.mentionCount)
            .slice(0, 8);
        if (recentEntities.length > 0) {
            lines.push('KNOWN ENTITIES:');
            recentEntities.forEach((e: any) => {
                lines.push(`- ${e.name} (${e.type}): ${e.description || 'no description'}`);
            });
            lines.push('');
        }

        // Other facts (non-user)
        const otherFacts = memory.facts.filter((f: any) => f.entity !== 'Younes' && f.entity !== 'younes');
        if (otherFacts.length > 0) {
            lines.push('REMEMBERED FACTS:');
            otherFacts.slice(0, 10).forEach((f: any) => {
                lines.push(`- ${f.entity} ${f.predicate} ${f.object}`);
            });
            lines.push('');
        }

        // Available agents
        if (agents.length > 0) {
            lines.push('AVAILABLE AGENTS:');
            agents.forEach((a: any) => {
                const caps = a.capabilities ? a.capabilities.map((c: any) => c.name).join(', ') : 'general';
                lines.push(`- ${a.name}: ${a.role || a.currentTask || 'idle'} (capabilities: ${caps})`);
            });
            lines.push('');
        }

        // Active monitors
        const activeMonitors = scouts.monitors.filter((m: any) => m.enabled);
        if (activeMonitors.length > 0) {
            lines.push('ACTIVE MONITORS:');
            activeMonitors.forEach((m: any) => {
                const lastCheck = m.config.lastCheck ? new Date(m.config.lastCheck).toLocaleString() : 'never';
                lines.push(`- ${m.name} (${m.type}): last checked ${lastCheck}`);
            });
            lines.push('');
        }

        // Unread alerts
        const unread = scouts.alerts.filter((a: any) => !a.read);
        if (unread.length > 0) {
            lines.push(`UNREAD ALERTS (${unread.length}):`);
            unread.slice(0, 5).forEach((a: any) => {
                lines.push(`- [${a.type}] ${a.title}: ${a.description}`);
            });
            lines.push('');
        }

        return Response.json({
            context: lines.join('\n'),
            counts: {
                facts: memory.facts.length,
                entities: memory.entities.length,
                preferences: memory.preferences.length,
                monitors: activeMonitors.length,
                unreadAlerts: unread.length
            }
        });
    } catch (error) {
        console.error('Memory context error:', error);
        return Response.json({ context: '', counts: {} });
    }
}
