import { readData, writeData } from '@/lib/storage';
import crypto from 'crypto';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

async function sendTelegram(text: string) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text,
                parse_mode: 'HTML',
            }),
        });
    } catch (err) {
        console.error('Telegram send error:', err);
    }
}

function hashContent(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
}

async function checkGitHub(monitor: any): Promise<any | null> {
    const repo = monitor.config.repo;
    if (!repo) return null;

    try {
        const since = monitor.config.lastCheck || new Date(Date.now() - 3600000).toISOString();
        const response = await fetch(
            `https://api.github.com/repos/${repo}/events?per_page=10`,
            {
                headers: { 'Accept': 'application/vnd.github.v3+json' },
                cache: 'no-store'
            }
        );

        if (!response.ok) {
            console.error(`GitHub API error for ${repo}:`, response.status);
            return null;
        }

        const events = await response.json();
        const sinceDate = new Date(since);
        const newEvents = events.filter((e: any) => new Date(e.created_at) > sinceDate);

        if (newEvents.length === 0) return null;

        const summaries = newEvents.slice(0, 5).map((e: any) => {
            const actor = e.actor?.login || 'unknown';
            switch (e.type) {
                case 'PushEvent':
                    const commits = e.payload?.commits?.length || 0;
                    return `${actor} pushed ${commits} commit(s)`;
                case 'PullRequestEvent':
                    return `${actor} ${e.payload?.action} PR #${e.payload?.pull_request?.number}`;
                case 'IssuesEvent':
                    return `${actor} ${e.payload?.action} issue #${e.payload?.issue?.number}`;
                case 'CreateEvent':
                    return `${actor} created ${e.payload?.ref_type} ${e.payload?.ref || ''}`;
                case 'WatchEvent':
                    return `${actor} starred the repo`;
                default:
                    return `${actor}: ${e.type}`;
            }
        });

        return {
            type: 'github',
            title: `${newEvents.length} new event(s) on ${repo}`,
            description: summaries.join('; '),
            eventCount: newEvents.length,
        };
    } catch (error) {
        console.error(`GitHub check error for ${repo}:`, error);
        return null;
    }
}

async function checkWeb(monitor: any): Promise<any | null> {
    const url = monitor.config.url;
    if (!url) return null;

    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) return null;

        const content = await response.text();
        const newHash = hashContent(content);

        if (monitor.config.lastHash && monitor.config.lastHash !== newHash) {
            return {
                type: 'web_change',
                title: `Content changed: ${monitor.name}`,
                description: `The page at ${url} has been updated since last check.`,
                newHash,
            };
        }

        // Update hash even if no change (first run)
        return { type: 'no_change', newHash };
    } catch (error) {
        console.error(`Web check error for ${url}:`, error);
        return null;
    }
}

export async function GET() {
    try {
        const data = await readData();
        if (!data.scouts) {
            data.scouts = { monitors: [], alerts: [] };
        }

        const enabledMonitors = data.scouts.monitors.filter((m: any) => m.enabled);
        if (enabledMonitors.length === 0) {
            return Response.json({ checked: 0, alerts: 0, message: 'No active monitors' });
        }

        let alertsCreated = 0;
        const now = new Date().toISOString();

        for (const monitor of enabledMonitors) {
            let result: any = null;

            switch (monitor.type) {
                case 'github':
                    result = await checkGitHub(monitor);
                    break;
                case 'web':
                    result = await checkWeb(monitor);
                    break;
            }

            // Update lastCheck
            const idx = data.scouts.monitors.findIndex((m: any) => m.id === monitor.id);
            if (idx >= 0) {
                data.scouts.monitors[idx].config.lastCheck = now;
            }

            if (result && result.type !== 'no_change') {
                // Create alert
                const alert = {
                    id: `alert-${Date.now()}-${alertsCreated}`,
                    monitorId: monitor.id,
                    type: result.type,
                    title: result.title,
                    description: result.description,
                    read: false,
                    createdAt: now,
                };
                data.scouts.alerts.push(alert);
                alertsCreated++;

                // Post to feed
                if (!data.feed) data.feed = [];
                data.feed.unshift({
                    id: `feed-scout-${Date.now()}`,
                    type: 'scout',
                    title: result.title,
                    description: result.description,
                    timestamp: now,
                    source: 'scout',
                });

                // Telegram notification
                await sendTelegram(
                    `ð <b>Scout Alert</b>\n` +
                    `<b>${result.title}</b>\n` +
                    `${result.description}\n` +
                    `Monitor: ${monitor.name}`
                );
            }

            // Update hash for web monitors
            if (result && result.newHash && idx >= 0) {
                data.scouts.monitors[idx].config.lastHash = result.newHash;
            }
        }

        // Keep only last 100 alerts
        if (data.scouts.alerts.length > 100) {
            data.scouts.alerts = data.scouts.alerts.slice(-100);
        }

        // Keep only last 50 feed items
        if (data.feed && data.feed.length > 50) {
            data.feed = data.feed.slice(0, 50);
        }

        await writeData(data);

        return Response.json({
            checked: enabledMonitors.length,
            alerts: alertsCreated,
            timestamp: now,
        });
    } catch (error) {
        console.error('Scout cron error:', error);
        return Response.json({ error: 'Cron execution failed' }, { status: 500 });
    }
}
