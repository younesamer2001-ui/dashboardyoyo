import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

// GET - List monitors and recent alerts
export async function GET(request: NextRequest) {
    try {
        const data = await readData();
        const scouts = data.scouts || { monitors: [], alerts: [] };
        return Response.json(scouts);
    } catch (error) {
        console.error('Scouts GET error:', error);
        return Response.json({ monitors: [], alerts: [] });
    }
}

// POST - Add new monitor
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, name, config } = body;

        if (!type || !name) {
            return Response.json({ error: 'type and name are required' }, { status: 400 });
        }

        const data = await readData();
        if (!data.scouts) {
            data.scouts = { monitors: [], alerts: [] };
        }

        const monitor = {
            id: `monitor-${Date.now()}`,
            type,
            name,
            config: {
                ...config,
                checkInterval: config?.checkInterval || 3600,
                lastCheck: null,
                lastHash: null
            },
            enabled: true,
            createdAt: new Date().toISOString()
        };

        data.scouts.monitors.push(monitor);
        await writeData(data);

        return Response.json({ success: true, monitor });
    } catch (error) {
        console.error('Scouts POST error:', error);
        return Response.json({ error: 'Failed to create monitor' }, { status: 500 });
    }
}

// PATCH - Enable/disable or update a monitor
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, enabled, config } = body;

        if (!id) {
            return Response.json({ error: 'id is required' }, { status: 400 });
        }

        const data = await readData();
        if (!data.scouts) {
            return Response.json({ error: 'No scouts data' }, { status: 404 });
        }

        const idx = data.scouts.monitors.findIndex((m: any) => m.id === id);
        if (idx < 0) {
            return Response.json({ error: 'Monitor not found' }, { status: 404 });
        }

        if (typeof enabled === 'boolean') {
            data.scouts.monitors[idx].enabled = enabled;
        }
        if (config) {
            data.scouts.monitors[idx].config = { ...data.scouts.monitors[idx].config, ...config };
        }

        await writeData(data);
        return Response.json({ success: true, monitor: data.scouts.monitors[idx] });
    } catch (error) {
        console.error('Scouts PATCH error:', error);
        return Response.json({ error: 'Failed to update monitor' }, { status: 500 });
    }
}

// DELETE - Remove a monitor
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return Response.json({ error: 'id is required' }, { status: 400 });
        }

        const data = await readData();
        if (!data.scouts) {
            return Response.json({ error: 'No scouts data' }, { status: 404 });
        }

        data.scouts.monitors = data.scouts.monitors.filter((m: any) => m.id !== id);
        await writeData(data);

        return Response.json({ success: true });
    } catch (error) {
        console.error('Scouts DELETE error:', error);
        return Response.json({ error: 'Failed to delete monitor' }, { status: 500 });
    }
}
