import StoryReader from '@/components/StoryReader';
import { getStory } from '@/lib/stories';
import { notFound } from 'next/navigation';

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
  return <StoryReader story={story} />;
}
