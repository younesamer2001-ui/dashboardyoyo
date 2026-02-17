import { NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/storage';

// POST /api/notify - Create notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, message, taskId, priority } = body;
    
    const data = await readData();
    
    const notification = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      taskId,
      priority,
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    data.notifications = data.notifications || [];
    data.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (data.notifications.length > 50) {
      data.notifications = data.notifications.slice(0, 50);
    }
    
    await writeData(data);
    
    // Also send Telegram notification for blocked tasks
    if (type === 'blocked_task') {
      try {
        await fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `🚨 *Task Blocked - Need Your Help*\n\n${message}\n\nPriority: ${priority || 'medium'}`,
          }),
        });
      } catch (e) {
        console.error('Failed to send Telegram notification:', e);
      }
    }
    
    return Response.json({ success: true, notification });
  } catch (error) {
    console.error('Notify API error:', error);
    return Response.json({ success: false, error: 'Failed to create notification' }, { status: 500 });
  }
}

// GET /api/notify - Get notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    
    const data = await readData();
    let notifications = data.notifications || [];
    
    if (unreadOnly) {
      notifications = notifications.filter((n: any) => !n.read);
    }
    
    return Response.json({
      success: true,
      notifications,
      unreadCount: notifications.filter((n: any) => !n.read).length,
    });
  } catch (error) {
    console.error('Notify API error:', error);
    return Response.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH /api/notify - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    
    const data = await readData();
    const notifIndex = data.notifications?.findIndex((n: any) => n.id === id);
    
    if (notifIndex === -1 || notifIndex === undefined) {
      return Response.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }
    
    data.notifications[notifIndex].read = true;
    await writeData(data);
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Notify API error:', error);
    return Response.json({ success: false, error: 'Failed to update notification' }, { status: 500 });
  }
}
