import StoryForm from '@/components/StoryForm';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';

function getStoryLocal(id) {
  const filePath = path.join(process.cwd(), 'data', 'stories', `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const story = getStoryLocal(id);
  return { title: story ? `Edit: ${story.title}` : 'Story Not Found' };
}

export default async function EditStoryPage({ params }) {
  const { id } = await params;
  const story = getStoryLocal(id);
  if (!story) notFound();

  return <StoryForm initialData={story} storyId={id} mode="edit" />;
}
