'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resizeImage } from '@/lib/resizeImage';
import ImagePicker from './ImagePicker';

const MIN_PAGES = 3;
const MAX_PAGES = 15;
const DEFAULT_PAGES = 5;

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Shared form for creating and editing stories.
 *
 * Props:
 *   initialData  – full story object when editing, null when creating
 *   storyId      – fixed id when editing (title changes don't change the id)
 *   mode         – 'create' | 'edit'
 */
function collaboratorLabel({ firstName, lastName, email }) {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return name || email || 'Unknown user';
}

export default function StoryForm({
  initialData = null,
  storyId = null,
  mode = 'create',
  canManageSharing = false,
  canDelete = false,
  initialCollaborators = [],
}) {
  const isEdit = mode === 'edit';
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? '');
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaboratorError, setCollaboratorError] = useState('');
  const [resolvingCollaborator, setResolvingCollaborator] = useState(false);

  const buildPages = (data, count) =>
    Array.from({ length: count }, (_, i) => ({
      pageNumber: i + 1,
      image: data?.pages?.[i]?.image ?? '',
      text: data?.pages?.[i]?.text ?? '',
    }));

  const [numPages, setNumPages] = useState(() =>
    clamp(initialData?.pages?.length ?? DEFAULT_PAGES, MIN_PAGES, MAX_PAGES)
  );
  const [pages, setPages] = useState(() => buildPages(initialData, numPages));
  const [uploading, setUploading] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const effectiveId = isEdit ? storyId : slugify(title);

  function updatePage(index, field, value) {
    setPages((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function handleNumPagesChange(rawValue) {
    const newCount = clamp(Number(rawValue), MIN_PAGES, MAX_PAGES);
    if (newCount < pages.length) {
      const removed = pages.slice(newCount);
      const hasContent = removed.some((p) => p.text.trim() || p.image);
      if (hasContent && !window.confirm(
        `This removes ${removed.length} page(s) that already have content. Continue?`
      )) {
        return;
      }
    }
    setNumPages(newCount);
    setPages((prev) => {
      if (newCount === prev.length) return prev;
      if (newCount < prev.length) return prev.slice(0, newCount);
      return [
        ...prev,
        ...Array.from({ length: newCount - prev.length }, (_, i) => ({
          pageNumber: prev.length + i + 1,
          image: '',
          text: '',
        })),
      ];
    });
  }

  function buildStoryPayload(overrideEditorIds) {
    const id = effectiveId;
    return {
      id,
      title,
      description,
      coverImage: coverImage || `https://picsum.photos/seed/${id}-cover/600/400`,
      createdAt: initialData?.createdAt ?? new Date().toISOString().slice(0, 10),
      editorIds: overrideEditorIds,
      pages: pages.map((p, i) => ({
        pageNumber: i + 1,
        image: p.image || `https://picsum.photos/seed/${id}-p${i + 1}/800/500`,
        text: p.text,
      })),
    };
  }

  async function persistCollaborators(nextCollaborators) {
    const res = await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildStoryPayload(nextCollaborators.map((c) => c.id))),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Could not save collaborator change');
    setCollaborators(nextCollaborators);
  }

  async function addCollaborator() {
    const email = collaboratorEmail.trim();
    if (!email) return;
    setResolvingCollaborator(true);
    setCollaboratorError('');
    try {
      const res = await fetch('/api/collaborators/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCollaboratorError(data.error || 'Could not find that account');
        return;
      }
      if (collaborators.some((c) => c.id === data.userId)) {
        setCollaboratorEmail('');
        return;
      }
      const newCollaborator = {
        id: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      };
      await persistCollaborators([...collaborators, newCollaborator]);
      setCollaboratorEmail('');
    } catch (e) {
      setCollaboratorError(e.message);
    } finally {
      setResolvingCollaborator(false);
    }
  }

  async function removeCollaborator(userId) {
    setCollaboratorError('');
    try {
      await persistCollaborators(collaborators.filter((c) => c.id !== userId));
    } catch (e) {
      setCollaboratorError(e.message);
    }
  }

  async function handleImageUpload(index, file) {
    if (!effectiveId) {
      setError('Please enter a story title before uploading images.');
      return;
    }
    setUploading((u) => ({ ...u, [index]: true }));
    setError('');
    try {
      const resized = await resizeImage(file);
      const form = new FormData();
      form.append('file', resized);
      form.append('storyId', effectiveId);
      const label = index === -1 ? 'cover' : `page-${index + 1}`;
      form.append('filename', `${label}-${resized.name}`);
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

    setSaving(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildStoryPayload(collaborators.map((c) => c.id))),
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

  async function handleDelete() {
    if (!window.confirm(
      `Permanently delete "${title}"? This removes the story and all its photos. This cannot be undone.`
    )) return;

    setDeleteError('');
    setDeleting(true);
    try {
      const res = await fetch(`/api/stories/${effectiveId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        router.push('/');
      } else {
        setDeleteError(data.error || 'Delete failed');
      }
    } catch (e) {
      setDeleteError(e.message);
    } finally {
      setDeleting(false);
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
            <label className="admin-label">Number of Pages: {numPages}</label>
            <input
              type="range"
              min={MIN_PAGES}
              max={MAX_PAGES}
              step={1}
              value={numPages}
              onChange={(e) => handleNumPagesChange(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-brown-mid mt-1">
              Choose between {MIN_PAGES} and {MAX_PAGES} pages.
            </p>
          </div>

          <div>
            <label className="admin-label">Cover Image</label>
            <ImagePicker
              imageUrl={coverImage}
              uploading={!!uploading[-1]}
              aspect={3 / 2}
              previewClassName="mb-2 h-32 rounded-xl object-cover shadow"
              placeholderText={
                coverImage
                  ? 'Choose a new photo to replace the current image.'
                  : 'Leave blank to use a placeholder image.'
              }
              onConfirm={(file) => handleImageUpload(-1, file)}
            />
          </div>

          {isEdit && canManageSharing && (
            <div>
              <label className="admin-label">Share to Manage</label>
              {collaborators.length > 0 && (
                <ul className="flex flex-wrap gap-2 mb-2">
                  {collaborators.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-2 font-nunito text-xs text-brown-mid bg-amber-light rounded-full px-3 py-1"
                    >
                      {collaboratorLabel(c)}
                      <button
                        type="button"
                        onClick={() => removeCollaborator(c.id)}
                        aria-label="Remove collaborator"
                        className="text-brown-dark font-bold"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input
                  type="email"
                  className="admin-input"
                  value={collaboratorEmail}
                  onChange={(e) => setCollaboratorEmail(e.target.value)}
                  placeholder="collaborator@email.com"
                />
                <button
                  type="button"
                  onClick={addCollaborator}
                  disabled={resolvingCollaborator}
                  className="nav-btn whitespace-nowrap disabled:opacity-60"
                >
                  {resolvingCollaborator ? 'Adding…' : '+ Add'}
                </button>
              </div>
              {collaboratorError && (
                <p className="text-xs text-red-600 mt-1">{collaboratorError}</p>
              )}
              <p className="text-xs text-brown-mid mt-1">
                People you add can edit this story. They need an existing account.
              </p>
            </div>
          )}
        </section>

        {/* Pages */}
        <section className="space-y-4">
          <h2 className="font-lora text-xl font-bold text-brown-dark px-1">Pages ({numPages})</h2>
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
                <ImagePicker
                  imageUrl={page.image}
                  uploading={!!uploading[i]}
                  aspect={8 / 5}
                  previewClassName="mb-2 h-24 rounded-xl object-cover shadow"
                  placeholderText={
                    page.image
                      ? 'Choose a new photo to replace the current image.'
                      : 'Leave blank to use a placeholder image.'
                  }
                  onConfirm={(file) => handleImageUpload(i, file)}
                />
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

        {isEdit && canDelete && (
          <section className="bg-white rounded-2xl shadow-sm p-6 space-y-3 border border-red-100">
            <h2 className="font-lora text-xl font-bold text-red-700">Danger Zone</h2>
            <p className="text-sm text-brown-mid">
              Permanently deletes this story and all its photos. This cannot be undone.
            </p>
            {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white font-nunito font-bold text-sm rounded-full px-5 py-2.5 shadow-sm hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : '🗑️ Delete Story'}
            </button>
          </section>
        )}
      </form>
    </main>
  );
}
