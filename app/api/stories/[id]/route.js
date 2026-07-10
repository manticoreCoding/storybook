import { NextResponse } from 'next/server';
import { deleteStory } from '@/lib/stories';
import { getActor } from '@/lib/authz';
import { revalidatePath } from 'next/cache';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const actor = await getActor();
    if (!actor.userId) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }
    await deleteStory(id, actor);

    revalidatePath('/');
    revalidatePath(`/story/${id}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = /not authorized/i.test(err.message) ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
