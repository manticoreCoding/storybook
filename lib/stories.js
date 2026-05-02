import { list, put, head, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const STORIES_PREFIX = 'stories/';

export async function getAllStories() {
  try {
    const { blobs } = await list({ prefix: STORIES_PREFIX });
    const stories = await Promise.all(
      blobs.map(async (blob) => {
        const res = await fetch(blob.url);
        return res.json();
      })
    );
    return stories.sort((a, b) => a.title.localeCompare(b.title));
  } catch {
    return [];
  }
}

export async function getStory(id) {
  try {
    const { blobs } = await list({ prefix: `${STORIES_PREFIX}${id}.json` });
    if (!blobs.length) return null;
    const res = await fetch(blobs[0].url);
    return res.json();
  } catch {
    return null;
  }
}

export async function saveStory(data) {
  const json = JSON.stringify(data, null, 2);
  const blob = await put(`${STORIES_PREFIX}${data.id}.json`, json, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
  return blob;
}

export async function deleteStory(id) {
  const { blobs } = await list({ prefix: `${STORIES_PREFIX}${id}.json` });
  if (blobs.length) {
    await del(blobs[0].url);
  }
}

export async function seedIfEmpty() {
  const { blobs } = await list({ prefix: STORIES_PREFIX });
  if (blobs.length > 0) return;

  const seedDir = path.join(process.cwd(), 'data', 'stories');
  if (!fs.existsSync(seedDir)) return;

  const files = fs.readdirSync(seedDir).filter((f) => f.endsWith('.json'));
  await Promise.all(
    files.map(async (file) => {
      const content = fs.readFileSync(path.join(seedDir, file), 'utf-8');
      const data = JSON.parse(content);
      await saveStory(data);
    })
  );
}
