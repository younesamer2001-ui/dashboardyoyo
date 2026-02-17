import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

// GET /api/todos - List all todos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const data = await readData();
    let todos = data.todos || [];
    
    if (status && status !== 'all') {
      todos = todos.filter((t: any) => t.workStatus === status || t.status === status);
    }
    
    // Sort: working first, then next, then blocked, then pending
    const statusOrder = { working: 0, next: 1, blocked: 2, pending: 3, completed: 4 };
    todos.sort((a: any, b: any) => {
      const orderA = statusOrder[a.workStatus as keyof typeof statusOrder] ?? 3;
      const orderB = statusOrder[b.workStatus as keyof typeof statusOrder] ?? 3;
      if (orderA !== orderB) return orderA - orderB;
      // Then by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const prioA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const prioB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
      if (prioA !== prioB) return prioA - prioB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return Response.json({
      success: true,
      todos,
      counts: {
        total: todos.length,
        pending: todos.filter((t: any) => t.status === 'pending').length,
        completed: todos.filter((t: any) => t.status === 'completed').length,
        working: todos.filter((t: any) => t.workStatus === 'working').length,
        next: todos.filter((t: any) => t.workStatus === 'next').length,
        blocked: todos.filter((t: any) => t.workStatus === 'blocked').length,
        kimisTasks: todos.filter((t: any) => t.assignee === 'kimi').length,
      }
    });
  } catch (error) {
    console.error('Todos API error:', error);
    return Response.json({ success: false, error: 'Failed to fetch todos' }, { status: 500 });
  }
}

// POST /api/todos - Create new todo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority = 'medium', dueDate, tags = [], assignee = 'kimi', workStatus = 'pending' } = body;
    
    if (!title) {
      return Response.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    
    const data = await readData();
    
    const newTodo = {
      id: `todo-${Date.now()}`,
      title,
      description: description || '',
      status: 'pending',
      priority,
      dueDate: dueDate || null,
      tags,
      assignee, // 'kimi' or 'user'
      workStatus, // 'pending', 'working', 'next', 'blocked', 'completed'
      createdAt: new Date().toISOString(),
      completedAt: null,
      createdBy: 'user',
    };
    
    data.todos = data.todos || [];
    data.todos.unshift(newTodo);
    
    await writeData(data);
    
    return Response.json({ success: true, todo: newTodo });
  } catch (error) {
    console.error('Todos API error:', error);
    return Response.json({ success: false, error: 'Failed to create todo' }, { status: 500 });
  }
}

// PATCH /api/todos - Update todo
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, title, description, priority, assignee, workStatus } = body;
    
    const data = await readData();
    const todoIndex = data.todos?.findIndex((t: any) => t.id === id);
    
    if (todoIndex === -1 || todoIndex === undefined) {
      return Response.json({ success: false, error: 'Todo not found' }, { status: 404 });
    }
    
    const todo = data.todos[todoIndex];
    
    if (status) {
      todo.status = status;
      if (status === 'completed') {
        todo.completedAt = new Date().toISOString();
        todo.workStatus = 'completed';
      }
    }
    if (title) todo.title = title;
    if (description) todo.description = description;
    if (priority) todo.priority = priority;
    if (assignee) todo.assignee = assignee;
    if (workStatus) todo.workStatus = workStatus;
    
    await writeData(data);
    
    return Response.json({ success: true, todo });
  } catch (error) {
    console.error('Todos API error:', error);
    return Response.json({ success: false, error: 'Failed to update todo' }, { status: 500 });
  }
}

// DELETE /api/todos - Delete todo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    
    const data = await readData();
    data.todos = data.todos?.filter((t: any) => t.id !== id) || [];
    
    await writeData(data);
    
    return Response.json({ success: true, message: 'Todo deleted' });
  } catch (error) {
    console.error('Todos API error:', error);
    return Response.json({ success: false, error: 'Failed to delete todo' }, { status: 500 });
  }
}
