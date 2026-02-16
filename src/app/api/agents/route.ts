import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

// GET /api/agents - Get all agents status
export async function GET(request: NextRequest) {
  try {
    const data = await readData();
    const agents = data.agents || [];

    return Response.json({
      success: true,
      agents,
      count: agents.length,
      active: agents.filter((a: any) => a.status === 'active').length
    });
  } catch (error) {
    console.error('Agents API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Update agent status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, status } = body;

    if (!agentId || !status) {
      return Response.json(
        { error: 'Missing required fields: agentId, status' },
        { status: 400 }
      );
    }

    const data = await readData();

    // Find or create agent
    const agentIndex = data.agents.findIndex((a: any) => a.id === agentId);

    // Build update object - only include fields that were provided
    const agentData: Record<string, any> = {
      id: agentId,
      name: body.name || (agentIndex >= 0 ? data.agents[agentIndex].name : agentId),
      icon: body.icon || (agentIndex >= 0 ? data.agents[agentIndex].icon : undefined),
      status,
      currentTask: body.currentTask !== undefined ? body.currentTask : (agentIndex >= 0 ? data.agents[agentIndex].currentTask : null),
      lastActive: new Date().toISOString(),
      metrics: body.metrics || (agentIndex >= 0 ? data.agents[agentIndex].metrics : {}),
      updatedAt: new Date().toISOString()
    };

    // Persist systemPrompt if provided
    if (body.systemPrompt !== undefined) {
      agentData.systemPrompt = body.systemPrompt;
    }

    // Persist files if provided
    if (body.files !== undefined) {
      agentData.files = body.files;
    }

    // Persist role if provided
    if (body.role !== undefined) {
      agentData.role = body.role;
    }

    // Persist capabilities if provided
    if (body.capabilities !== undefined) {
      agentData.capabilities = body.capabilities;
    }

    if (agentIndex >= 0) {
      data.agents[agentIndex] = { ...data.agents[agentIndex], ...agentData };
    } else {
      data.agents.push(agentData);
    }

    await writeData(data);

    return Response.json({
      success: true,
      agent: agentIndex >= 0 ? data.agents[agentIndex] : agentData
    });
  } catch (error) {
    console.error('Agents API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents - Batch update multiple agents
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { agents } = body;

    if (!Array.isArray(agents)) {
      return Response.json(
        { error: 'agents must be an array' },
        { status: 400 }
      );
    }

    const data = await readData();

    for (const agentUpdate of agents) {
      const agentIndex = data.agents.findIndex((a: any) => a.id === agentUpdate.id);

      if (agentIndex >= 0) {
        data.agents[agentIndex] = {
          ...data.agents[agentIndex],
          ...agentUpdate,
          lastActive: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        data.agents.push({
          ...agentUpdate,
          lastActive: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    await writeData(data);

    return Response.json({
      success: true,
      updated: agents.length
    });
  } catch (error) {
    console.error('Agents API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
