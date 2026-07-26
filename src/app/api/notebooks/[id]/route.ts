import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notebooks, sources } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const [notebook] = await db.select().from(notebooks).where(
    and(
      eq(notebooks.id, id),
      eq(notebooks.userId, userId)
    )
  );

  if (!notebook) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const notebookSources = await db.select().from(sources).where(eq(sources.notebookId, id));

  return NextResponse.json({ ...notebook, sources: notebookSources });
}
