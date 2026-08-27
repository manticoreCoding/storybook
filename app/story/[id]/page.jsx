import StoryReader from '@/components/StoryReader';
import { getStory } from '@/lib/stories';
import { getActor, canManage, canView } from '@/lib/authz';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const story = await getStory(id);
  return { title: story ? story.title : 'Story Not Found' };
}

export default async function StoryPage({ params }) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) notFound();

  const actor = await getActor();
  if (!canView(story, actor)) {
    if (!actor.userId) redirect(`/sign-in?redirect_url=/story/${id}`);
    notFound();
  }

  return <StoryReader story={story} canEdit={canManage(story, actor)} />;
}
