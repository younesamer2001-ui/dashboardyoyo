import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
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

async function executeGenerateText(inputs: any): Promise<any> {
    if (!OPENROUTER_API_KEY) {
        return { error: 'API key not configured' };
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://dashboardyoyo.com',
            'X-Title': 'Dashboard YOYO Agent',
        },
        body: JSON.stringify({
            model: 'moonshotai/kimi-k2',
            messages: [
                { role: 'system', content: inputs.systemPrompt || 'You are a helpful assistant.' },
                { role: 'user', content: inputs.prompt || inputs.message || '' }
            ],
            max_tokens: inputs.maxTokens || 2048,
            temperature: inputs.temperature || 0.7,
        }),
    });

    const data = await response.json();
    return {
        text: data.choices?.[0]?.message?.content || '',
        model: data.model,
        usage: data.usage,
    };
}

async function executeHttpRequest(inputs: any): Promise<any> {
    const { url, method, headers, body } = inputs;
    if (!url) return { error: 'URL is required' };

    const response = await fetch(url, {
        method: method || 'GET',
        headers: headers || {},
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') || '';
    let responseData;
    if (contentType.includes('application/json')) {
        responseData = await response.json();
    } else {
        responseData = await response.text();
        if (typeof responseData === 'string' && responseData.length > 2000) {
            responseData = responseData.substring(0, 2000) + '... (truncated)';
        }
    }

    return {
        status: response.status,
        contentType,
        data: responseData,
    };
}

async function executeGitHubApi(inputs: any): Promise<any> {
    const { endpoint, repo } = inputs;
    if (!repo) return { error: 'repo is required' };

    const url = `https://api.github.com/repos/${repo}${endpoint || ''}`;
    const response = await fetch(url, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        cache: 'no-store',
    });

    if (!response.ok) {
        return { error: `GitHub API returned ${response.status}` };
    }

    const data = await response.json();
    return { data };
}

async function executeAnalyzeCode(inputs: any): Promise<any> {
    if (!OPENROUTER_API_KEY) {
        return { error: 'API key not configured' };
    }

    const code = inputs.code || '';
    const task = inputs.task || 'Review this code for issues, improvements, and best practices.';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://dashboardyoyo.com',
            'X-Title': 'Dashboard YOYO Code Analyzer',
        },
        body: JSON.stringify({
            model: 'moonshotai/kimi-k2',
            messages: [
                { role: 'system', content: 'You are an expert code reviewer. Analyze code and provide actionable feedback.' },
                { role: 'user', content: `${task}\n\n\`\`\`\n${code}\n\`\`\`` }
            ],
            max_tokens: 2048,
            temperature: 0.3,
        }),
    });

    const data = await response.json();
    return {
        analysis: data.choices?.[0]?.message?.content || '',
        model: data.model,
    };
}

// POST - Execute a task
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { agentId, capability, inputs } = body;

        if (!agentId || !capability) {
            return Response.json({ error: 'agentId and capability are required' }, { status: 400 });
        }

        const data = await readData();
        const agent = (data.agents || []).find((a: any) => a.id === agentId);

        if (!agent) {
            return Response.json({ error: `Agent ${agentId} not found` }, { status: 404 });
        }

        // Create execution record
        const taskId = `exec-${Date.now()}`;
        const execution = {
            id: taskId,
            agentId,
            capability,
            inputs: inputs || {},
            status: 'running',
            output: null as any,
            startedAt: new Date().toISOString(),
            completedAt: null as string | null,
            error: null as string | null,
        };

        if (!data.agent_executions) {
            data.agent_executions = [];
        }
        data.agent_executions.push(execution);
        await writeData(data);

        // Execute based on capability type
        let result: any;
        try {
            switch (capability) {
                case 'generate_text':
                    result = await executeGenerateText(inputs || {});
                    break;
                case 'http_request':
                    result = await executeHttpRequest(inputs || {});
                    break;
                case 'github_api':
                    result = await executeGitHubApi(inputs || {});
                    break;
                case 'analyze_code':
                    result = await executeAnalyzeCode(inputs || {});
                    break;
                default:
                    result = { error: `Unknown capability: ${capability}` };
            }
        } catch (execError: any) {
            result = { error: execError.message || 'Execution failed' };
        }

        // Update execution record
        const freshData = await readData();
        const execIdx = freshData.agent_executions.findIndex((e: any) => e.id === taskId);
        if (execIdx >= 0) {
            freshData.agent_executions[execIdx].output = result;
            freshData.agent_executions[execIdx].status = result.error ? 'failed' : 'completed';
            freshData.agent_executions[execIdx].completedAt = new Date().toISOString();
            if (result.error) {
                freshData.agent_executions[execIdx].error = result.error;
            }
        }

        // Add to feed
        if (!freshData.feed) freshData.feed = [];
        freshData.feed.unshift({
            id: `feed-exec-${Date.now()}`,
            type: 'agent',
            title: `${agent.name}: ${capability}`,
            description: result.error
                ? `Failed: ${result.error}`
                : `Completed successfully`,
            timestamp: new Date().toISOString(),
            source: agentId,
        });

        // Keep only last 20 executions
        if (freshData.agent_executions.length > 20) {
            freshData.agent_executions = freshData.agent_executions.slice(-20);
        }

        await writeData(freshData);

        // Telegram notification
        const statusEmoji = result.error ? 'â' : 'â';
        await sendTelegram(
            `${statusEmoji} <b>Agent Execution</b>\n` +
            `Agent: ${agent.name}\n` +
            `Task: ${capability}\n` +
            `Status: ${result.error ? 'Failed' : 'Completed'}`
        );

        return Response.json({
            taskId,
            status: result.error ? 'failed' : 'completed',
            output: result,
        });
    } catch (error) {
        console.error('Agent execute error:', error);
        return Response.json({ error: 'Execution failed' }, { status: 500 });
    }
}

// GET - Check execution status
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const taskId = url.searchParams.get('taskId');

        const data = await readData();
        if (!data.agent_executions) {
            return Response.json({ executions: [] });
        }

        if (taskId) {
            const execution = data.agent_executions.find((e: any) => e.id === taskId);
            if (!execution) {
                return Response.json({ error: 'Execution not found' }, { status: 404 });
            }
            return Response.json(execution);
        }

        // Return recent executions
        return Response.json({
            executions: data.agent_executions.slice(-10).reverse(),
        });
    } catch (error) {
        console.error('Agent execute GET error:', error);
        return Response.json({ executions: [] });
    }
}
