import fs from 'fs';
import path from 'path';

const USE_BLOB = process.env.NODE_ENV === 'production';
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

async function readAll() {
  if (!USE_BLOB) return readAllLocal();

  const { list } = await import('@vercel/blob');
  try {
    const { blobs } = await list({ prefix: STORIES_PREFIX });
    const stories = await Promise.all(
      blobs.map(async (blob) => {
        const res = await fetch(blob.url, { cache: 'no-store' });
        return res.json();
      })
    );
    return stories.sort((a, b) => a.title.localeCompare(b.title));
  } catch {
    return [];
  }
}

/**
 * Returns stories visible to the given actor: admins see everything,
 * signed-in users see stories they own, were shared as an editor, or that
 * are public; signed-out visitors see only public stories.
 */
export async function getAllStories(actor = {}) {
  const stories = await readAll();
  if (actor.isAdmin) return stories;
  if (!actor.userId) return stories.filter((s) => s.isPublic);
  return stories.filter(
    (s) =>
      s.ownerId === actor.userId ||
      (s.editorIds || []).includes(actor.userId) ||
      s.isPublic
  );
}

export async function getStory(id) {
  if (!USE_BLOB) return readOneLocal(id);

  const { list } = await import('@vercel/blob');
  try {
    const { blobs } = await list({ prefix: `${STORIES_PREFIX}${id}.json` });
    if (!blobs.length) return null;
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Saves a story on behalf of actor { userId, isAdmin }. Enforces that only
 * the owner, a shared editor, or an admin can write, sets ownerId on
 * create, and prevents ownerId/editorIds from being overwritten by anyone
 * other than the owner/admin.
 */
export async function saveStory(data, actor) {
  const existing = await getStory(data.id);

  if (existing) {
    const isOwner = existing.ownerId === actor.userId;
    const isEditor = (existing.editorIds || []).includes(actor.userId);
    if (!actor.isAdmin && !isOwner && !isEditor) {
      throw new Error('Not authorized to edit this story');
    }
    data.ownerId = existing.ownerId;
    data.editorIds = actor.isAdmin || isOwner ? (data.editorIds ?? existing.editorIds ?? []) : (existing.editorIds ?? []);
    data.isPublic = actor.isAdmin || isOwner ? !!data.isPublic : !!existing.isPublic;
  } else {
    data.ownerId = actor.userId;
    data.editorIds = data.editorIds ?? [];
    data.isPublic = !!data.isPublic;
  }

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
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

/**
 * Deletes a story on behalf of actor { userId, isAdmin }. Only the owner
 * or an admin may delete (shared editors may not). Also removes the
 * story's uploaded images (cover + page photos).
 */
export async function deleteStory(id, actor) {
  const existing = await getStory(id);
  if (!existing) return;

  const isOwner = existing.ownerId === actor.userId;
  if (!actor.isAdmin && !isOwner) {
    throw new Error('Not authorized to delete this story');
  }

  if (!USE_BLOB) {
    const filePath = path.join(STORIES_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const imagesDir = path.join(process.cwd(), 'public', 'images', id);
    if (fs.existsSync(imagesDir)) fs.rmSync(imagesDir, { recursive: true, force: true });
    return;
  }

  const { list, del } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: `${STORIES_PREFIX}${id}.json` });
  if (blobs.length) await del(blobs[0].url);

  const { blobs: imageBlobs } = await list({ prefix: `images/${id}/` });
  if (imageBlobs.length) await del(imageBlobs.map((b) => b.url));
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
      await saveStory(JSON.parse(content), { userId: null, isAdmin: false });
    })
  );
}
