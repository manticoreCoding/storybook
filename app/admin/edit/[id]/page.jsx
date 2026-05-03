import StoryForm from '@/components/StoryForm';
import { notFound } from 'next/navigation';
import { getStory } from '@/lib/stories';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const story = await getStory(id);
  return { title: story ? `Edit: ${story.title}` : 'Story Not Found' };
}

export default async function EditStoryPage({ params }) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) notFound();

  return <StoryForm initialData={story} storyId={id} mode="edit" />;
}
