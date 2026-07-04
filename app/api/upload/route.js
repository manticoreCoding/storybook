import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const storyId = formData.get('storyId');
    const filename = formData.get('filename') || file.name;

    if (!file || !storyId) {
      return NextResponse.json({ error: 'file and storyId are required' }, { status: 400 });
    }

    // ── Local dev: save to public/images/ and return a relative URL ──
    if (process.env.NODE_ENV !== 'production') {
      const dir = path.join(process.cwd(), 'public', 'images', storyId);
      fs.mkdirSync(dir, { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(path.join(dir, filename), buffer);
      return NextResponse.json({ url: `/images/${storyId}/${filename}` });
    }

    // ── Production: upload to Vercel Blob ────────────────────────────
    const { put } = await import('@vercel/blob');
    const blob = await put(`images/${storyId}/${filename}`, file, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
