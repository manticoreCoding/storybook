import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const storyId = formData.get('storyId');
    const filename = formData.get('filename') || file.name;

    if (!file || !storyId) {
      return NextResponse.json({ error: 'file and storyId are required' }, { status: 400 });
    }

    const blob = await put(`images/${storyId}/${filename}`, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
