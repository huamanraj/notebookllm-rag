import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notebooks } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allNotebooks = await db.select().from(notebooks).where(eq(notebooks.userId, userId));
    return NextResponse.json(allNotebooks || []);
  } catch (error: any) {
    console.error("GET Notebooks Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name } = await req.json();
    
    const [newNotebook] = await db.insert(notebooks).values({
      id: nanoid(),
      userId,
      name: name || 'Untitled Notebook',
    }).returning();

    return NextResponse.json(newNotebook);
  } catch (error: any) {
    console.error("POST Notebooks Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
