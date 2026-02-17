import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

// POST /api/spawn-agent - Mark task as having an agent working on it
// Note: Actual sub-agent spawning happens via OpenClaw sessions_spawn tool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, taskTitle, priority } = body;
    
    if (!taskId) {
      return Response.json({ success: false, error: 'Task ID is required' }, { status: 400 });
    }

    // Update task to mark as "working" with agent
    const data = await readData();
    const todoIndex = data.todos?.findIndex((t: any) => t.id === taskId);
    
    if (todoIndex === -1 || todoIndex === undefined) {
      return Response.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    data.todos[todoIndex].workStatus = 'working';
    data.todos[todoIndex].hasAgent = true;
    data.todos[todoIndex].agentStartedAt = new Date().toISOString();
    
    await writeData(data);

    // In a real implementation, this would trigger a webhook or message
    // to spawn an actual sub-agent via OpenClaw's sessions_spawn tool
    console.log(`[AGENT SPAWN REQUEST] Task: ${taskTitle} (ID: ${taskId}, Priority: ${priority})`);

    return Response.json({
      success: true,
      message: 'Agent marked as working on task',
      taskId: taskId,
    });
  } catch (error) {
    console.error('Spawn agent error:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to spawn agent: ' + (error as Error).message 
    }, { status: 500 });
  }
}
