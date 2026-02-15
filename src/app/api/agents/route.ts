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
    const { agentId, status, currentTask, metrics } = body;

    if (!agentId || !status) {
      return Response.json(
        { error: 'Missing required fields: agentId, status' },
        { status: 400 }
      );
    }

    const data = await readData();
    
    // Find or create agent
    const agentIndex = data.agents.findIndex((a: any) => a.id === agentId);
    
    const agentData = {
      id: agentId,
      name: body.name || agentId,
      icon: body.icon || '🤖',
      status,
      currentTask: currentTask || null,
      lastActive: new Date().toISOString(),
      metrics: metrics || {},
      updatedAt: new Date().toISOString()
    };

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
