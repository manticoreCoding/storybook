import LibraryGrid from '@/components/LibraryGrid';
import { getAllStories } from '@/lib/stories';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const stories = await getAllStories();

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <h1 className="font-lora text-2xl md:text-3xl font-bold text-brown-dark">
            📚 Our Story Library
          </h1>
          <a
            href="/admin"
            className="font-nunito text-sm text-brown-mid bg-amber-light rounded-full px-4 py-2 shadow-sm hover:bg-amber transition-colors"
          >
            + Add Story
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
        <LibraryGrid stories={stories} />
      </div>
    </main>
  );
}
