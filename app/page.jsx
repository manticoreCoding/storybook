import { Show, SignInButton, UserButton } from '@clerk/nextjs';
import LibraryGrid from '@/components/LibraryGrid';
import { getAllStories } from '@/lib/stories';
import { getActor } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const actor = await getActor();
  const stories = await getAllStories(actor);

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <h1 className="font-lora text-2xl md:text-3xl font-bold text-brown-dark">
            📚 Our Story Library
          </h1>
          <div className="flex items-center gap-3">
            <Show when="signed-in">
              <a
                href="/admin"
                className="font-nunito text-sm text-brown-mid bg-amber-light rounded-full px-4 py-2 shadow-sm hover:bg-amber transition-colors"
              >
                + Add Story
              </a>
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="font-nunito text-sm text-brown-mid bg-amber-light rounded-full px-4 py-2 shadow-sm hover:bg-amber transition-colors">
                  Sign in
                </button>
              </SignInButton>
            </Show>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
        <LibraryGrid stories={stories} actor={actor} signedOutEmptyText="No public stories yet." />
      </div>
    </main>
  );
}
