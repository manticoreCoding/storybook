import { NextResponse } from 'next/server';
import { getAllStories, saveStory, seedIfEmpty } from '@/lib/stories';
import { getActor } from '@/lib/authz';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const actor = await getActor();
    if (!actor.userId) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await seedIfEmpty();
    }
    const stories = await getAllStories(actor);
    return NextResponse.json(stories);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const actor = await getActor();
    if (!actor.userId) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }
    const data = await request.json();
    if (!data.id || !data.title) {
      return NextResponse.json({ error: 'id and title are required' }, { status: 400 });
    }
    await saveStory(data, actor);

    // Invalidate cached pages so the updated story shows immediately
    revalidatePath('/');
    revalidatePath(`/story/${data.id}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = /not authorized/i.test(err.message) ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
