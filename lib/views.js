import fs from 'fs';
import path from 'path';

const USE_BLOB = process.env.NODE_ENV === 'production';
const VIEWS_DIR = path.join(process.cwd(), 'data', 'views');
const VIEWS_PREFIX = 'views/';

function readLocal(id) {
  const filePath = path.join(VIEWS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return 0;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')).count ?? 0;
}

async function readBlob(url) {
  const res = await fetch(url, { cache: 'no-store' });
  return (await res.json()).count ?? 0;
}

export async function getViewCount(id) {
  if (!USE_BLOB) return readLocal(id);

  const { list } = await import('@vercel/blob');
  try {
    const { blobs } = await list({ prefix: `${VIEWS_PREFIX}${id}.json` });
    return blobs.length ? await readBlob(blobs[0].url) : 0;
  } catch {
    return 0;
  }
}

/** Returns { [id]: count } for the given story ids; missing records are 0. */
export async function getViewCounts(ids) {
  if (!ids.length) return {};
  if (!USE_BLOB) return Object.fromEntries(ids.map((id) => [id, readLocal(id)]));

  const { list } = await import('@vercel/blob');
  const counts = Object.fromEntries(ids.map((id) => [id, 0]));
  try {
    const { blobs } = await list({ prefix: VIEWS_PREFIX });
    await Promise.all(
      blobs.map(async (blob) => {
        const id = blob.pathname.slice(VIEWS_PREFIX.length, -'.json'.length);
        if (id in counts) counts[id] = await readBlob(blob.url);
      })
    );
  } catch {}
  return counts;
}

export async function incrementViewCount(id) {
  const count = (await getViewCount(id)) + 1;
  const json = JSON.stringify({ count });

  if (!USE_BLOB) {
    fs.mkdirSync(VIEWS_DIR, { recursive: true });
    fs.writeFileSync(path.join(VIEWS_DIR, `${id}.json`), json, 'utf-8');
    return count;
  }

  const { put } = await import('@vercel/blob');
  await put(`${VIEWS_PREFIX}${id}.json`, json, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
  return count;
}

export async function deleteViewCount(id) {
  if (!USE_BLOB) {
    const filePath = path.join(VIEWS_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return;
  }

  const { list, del } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: `${VIEWS_PREFIX}${id}.json` });
  if (blobs.length) await del(blobs[0].url);
}
