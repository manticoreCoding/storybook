import { NextResponse } from 'next/server';
import { getStory } from '@/lib/stories';
import { getActor, canManage } from '@/lib/authz';
import { incrementViewCount } from '@/lib/views';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const story = await getStory(id);
    if (!story) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const actor = await getActor();
    if (!story.isPublic || canManage(story, actor)) {
      return NextResponse.json({ counted: false });
    }

    await incrementViewCount(id);
    return NextResponse.json({ counted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
