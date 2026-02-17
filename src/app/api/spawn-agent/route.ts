import { NextRequest } from 'next/server';
import { sessions_spawn } from '@/lib/sessions';

// POST /api/spawn-agent - Spawn a sub-agent to work on a task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, taskTitle, taskDescription, priority } = body;
    
    if (!taskId || !taskTitle) {
      return Response.json({ success: false, error: 'Task ID and title are required' }, { status: 400 });
    }

    // Create a detailed task prompt for the sub-agent
    const taskPrompt = `
You are working on a task assigned by Younes.

TASK: ${taskTitle}
${taskDescription ? `DESCRIPTION: ${taskDescription}` : ''}
PRIORITY: ${priority || 'medium'}
TASK ID: ${taskId}

Your job is to:
1. Analyze what needs to be done
2. Complete the task to the best of your ability
3. Report back with:
   - What you did
   - What was completed
   - Any issues or blockers (if you need help)
   - Files changed or created

Work autonomously. If you get stuck or need clarification, mark the task as "blocked" and explain what you need.

Start working now:
`;

    // Spawn the sub-agent
    const result = await sessions_spawn({
      task: taskPrompt,
      label: `task-${taskId}`,
      timeoutSeconds: 300, // 5 minutes
    });

    return Response.json({
      success: true,
      message: 'Sub-agent spawned successfully',
      sessionKey: result.sessionKey,
    });
  } catch (error) {
    console.error('Spawn agent error:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to spawn agent: ' + (error as Error).message 
    }, { status: 500 });
  }
}
