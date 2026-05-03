import { NextResponse } from 'next/server';
import { getAllStories, saveStory, seedIfEmpty } from '@/lib/stories';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await seedIfEmpty();
    }
    const stories = await getAllStories();
    return NextResponse.json(stories);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.id || !data.title) {
      return NextResponse.json({ error: 'id and title are required' }, { status: 400 });
    }
    await saveStory(data);

    // Invalidate cached pages so the updated story shows immediately
    revalidatePath('/');
    revalidatePath(`/story/${data.id}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
