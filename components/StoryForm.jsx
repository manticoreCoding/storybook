'use client';

import { useState } from 'react';
import Link from 'next/link';

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Shared form for creating and editing stories.
 *
 * Props:
 *   initialData  – full story object when editing, null when creating
 *   storyId      – fixed id when editing (title changes don't change the id)
 *   mode         – 'create' | 'edit'
 */
export default function StoryForm({ initialData = null, storyId = null, mode = 'create' }) {
  const isEdit = mode === 'edit';

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? '');

  const buildPages = (data) =>
    Array.from({ length: 10 }, (_, i) => ({
      pageNumber: i + 1,
      image: data?.pages?.[i]?.image ?? '',
      text: data?.pages?.[i]?.text ?? '',
    }));

  const [pages, setPages] = useState(() => buildPages(initialData));
  const [uploading, setUploading] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const effectiveId = isEdit ? storyId : slugify(title);

  function updatePage(index, field, value) {
    setPages((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  async function handleImageUpload(index, file) {
    if (!effectiveId) {
      setError('Please enter a story title before uploading images.');
      return;
    }
    setUploading((u) => ({ ...u, [index]: true }));
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('storyId', effectiveId);
      const label = index === -1 ? 'cover' : `page-${index + 1}`;
      form.append('filename', `${label}-${file.name}`);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.url) {
        if (index === -1) setCoverImage(data.url);
        else updatePage(index, 'image', data.url);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading((u) => ({ ...u, [index]: false }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title) { setError('Story title is required.'); return; }

    const id = effectiveId;
    const story = {
      id,
      title,
      description,
      coverImage: coverImage || `https://picsum.photos/seed/${id}-cover/600/400`,
      createdAt: initialData?.createdAt ?? new Date().toISOString().slice(0, 10),
      pages: pages.map((p, i) => ({
        pageNumber: i + 1,
        image: p.image || `https://picsum.photos/seed/${id}-p${i + 1}/800/500`,
        text: p.text,
      })),
    };

    setSaving(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story),
      });
      const data = await res.json();
      if (data.ok) {
        setSaved(true);
      } else {
        setError(data.error || 'Save failed');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <main className="min-h-screen bg-cream flex flex-col items-center justify-center gap-6 p-8">
        <span className="text-7xl">{isEdit ? '✅' : '🎉'}</span>
        <h2 className="font-lora text-3xl font-bold text-brown-dark text-center">
          {isEdit ? 'Story updated!' : 'Story saved!'}
        </h2>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href={`/story/${effectiveId}`} className="nav-btn">
            Read story →
          </Link>
          <Link href="/" className="nav-btn">Back to Library</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream pb-16">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={isEdit ? `/story/${effectiveId}` : '/'}
            className="font-nunito text-sm text-brown-mid bg-amber-light rounded-full px-4 py-2"
          >
            ← {isEdit ? 'Back to story' : 'Library'}
          </Link>
          <h1 className="font-lora text-2xl font-bold text-brown-dark">
            {isEdit ? `Edit "${title}"` : 'Add a New Story'}
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 md:px-8 pt-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 font-nunito text-sm">
            {error}
          </div>
        )}

        {/* Story details */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-lora text-xl font-bold text-brown-dark">Story Details</h2>

          <div>
            <label className="admin-label">Title *</label>
            <input
              className="admin-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Brave Little Snail"
              required
            />
          </div>

          <div>
            <label className="admin-label">Description</label>
            <input
              className="admin-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description shown on the library card"
            />
          </div>

          <div>
            <label className="admin-label">Cover Image</label>
            {coverImage && (
              <img
                src={coverImage}
                alt="Cover preview"
                className="mb-2 h-32 rounded-xl object-cover shadow"
              />
            )}
            <input
              type="file"
              accept="image/*"
              className="admin-file"
              onChange={(e) => e.target.files[0] && handleImageUpload(-1, e.target.files[0])}
            />
            {uploading[-1] && <p className="text-xs text-brown-mid mt-1">Uploading…</p>}
            <p className="text-xs text-brown-mid mt-1">
              {coverImage ? 'Upload a new file to replace the current image.' : 'Leave blank to use a placeholder image.'}
            </p>
          </div>
        </section>

        {/* Pages */}
        <section className="space-y-4">
          <h2 className="font-lora text-xl font-bold text-brown-dark px-1">Pages (10)</h2>
          {pages.map((page, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="font-lora font-bold text-brown-dark">Page {i + 1}</h3>

              <div>
                <label className="admin-label">Story Text</label>
                <textarea
                  className="admin-input resize-none"
                  rows={3}
                  value={page.text}
                  onChange={(e) => updatePage(i, 'text', e.target.value)}
                  placeholder="What happens on this page?"
                />
              </div>

              <div>
                <label className="admin-label">Page Image</label>
                {page.image && (
                  <img
                    src={page.image}
                    alt={`Page ${i + 1} preview`}
                    className="mb-2 h-24 rounded-xl object-cover shadow"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="admin-file"
                  onChange={(e) => e.target.files[0] && handleImageUpload(i, e.target.files[0])}
                />
                {uploading[i] && <p className="text-xs text-brown-mid mt-1">Uploading…</p>}
                <p className="text-xs text-brown-mid mt-1">
                  {page.image ? 'Upload a new file to replace the current image.' : 'Leave blank to use a placeholder image.'}
                </p>
              </div>
            </div>
          ))}
        </section>

        <div className="pb-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-rose text-white font-nunito font-bold text-lg rounded-2xl py-4 shadow-md active:scale-95 transition-transform disabled:opacity-60"
          >
            {saving
              ? (isEdit ? 'Saving changes…' : 'Saving…')
              : (isEdit ? '✨ Save Changes' : '✨ Save Story to Library')}
          </button>
        </div>
      </form>
    </main>
  );
}
