import { NextResponse } from 'next/server';
import { readData } from '@/lib/storage';

export async function GET() {
    try {
          const data = await readData();
          return NextResponse.json(data.dashboard || {
                  title: 'Dashboard YOYO',
                  subtitle: 'Younes AI Co.',
                  navItems: []
          });
    } catch (error) {
          console.error('Dashboard config error:', error);
          return NextResponse.json(
            { error: 'Failed to load dashboard config' },
            { status: 500 }
                );
    }
}
