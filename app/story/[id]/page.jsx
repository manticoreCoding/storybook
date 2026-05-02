import StoryReader from '@/components/StoryReader';
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

function getStoryLocal(id) {
  const filePath = path.join(process.cwd(), 'data', 'stories', `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const story = getStoryLocal(id);
  return { title: story ? story.title : 'Story Not Found' };
}

export default async function StoryPage({ params }) {
  const { id } = await params;
  const story = getStoryLocal(id);
  if (!story) notFound();
  return <StoryReader story={story} />;
}
