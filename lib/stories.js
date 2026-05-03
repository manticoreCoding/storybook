import fs from 'fs';
import path from 'path';

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const STORIES_DIR = path.join(process.cwd(), 'data', 'stories');
const STORIES_PREFIX = 'stories/';

// ─── Local filesystem helpers ────────────────────────────────────────────────

function readAllLocal() {
  if (!fs.existsSync(STORIES_DIR)) return [];
  return fs
    .readdirSync(STORIES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(STORIES_DIR, f), 'utf-8')))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function readOneLocal(id) {
  const filePath = path.join(STORIES_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeLocal(data) {
  fs.mkdirSync(STORIES_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STORIES_DIR, `${data.id}.json`),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getAllStories() {
  if (!USE_BLOB) return readAllLocal();

  const { list } = await import('@vercel/blob');
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
  if (!USE_BLOB) return readOneLocal(id);

  const { list } = await import('@vercel/blob');
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
  if (!USE_BLOB) {
    writeLocal(data);
    return;
  }

  const { put } = await import('@vercel/blob');
  const json = JSON.stringify(data, null, 2);
  return put(`${STORIES_PREFIX}${data.id}.json`, json, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export async function deleteStory(id) {
  if (!USE_BLOB) {
    const filePath = path.join(STORIES_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return;
  }

  const { list, del } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: `${STORIES_PREFIX}${id}.json` });
  if (blobs.length) await del(blobs[0].url);
}

export async function seedIfEmpty() {
  if (!USE_BLOB) return; // local files are already the seed

  const { list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: STORIES_PREFIX });
  if (blobs.length > 0) return;

  const seedDir = path.join(process.cwd(), 'data', 'stories');
  if (!fs.existsSync(seedDir)) return;

  const files = fs.readdirSync(seedDir).filter((f) => f.endsWith('.json'));
  await Promise.all(
    files.map(async (file) => {
      const content = fs.readFileSync(path.join(seedDir, file), 'utf-8');
      await saveStory(JSON.parse(content));
    })
  );
}
