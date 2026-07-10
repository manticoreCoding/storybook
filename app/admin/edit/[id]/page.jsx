import StoryForm from '@/components/StoryForm';
import { notFound } from 'next/navigation';
import { clerkClient } from '@clerk/nextjs/server';
import { getStory } from '@/lib/stories';
import { getActor } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const story = await getStory(id);
  return { title: story ? `Edit: ${story.title}` : 'Story Not Found' };
}

function canManage(story, actor) {
  return (
    actor.isAdmin ||
    story.ownerId === actor.userId ||
    (story.editorIds || []).includes(actor.userId)
  );
}

async function resolveCollaborators(editorIds) {
  if (!editorIds?.length) return [];
  const client = await clerkClient();
  const results = await Promise.all(
    editorIds.map(async (id) => {
      try {
        const user = await client.users.getUser(id);
        return {
          id,
          email: user.primaryEmailAddress?.emailAddress ?? '',
          firstName: user.firstName,
          lastName: user.lastName,
        };
      } catch {
        return { id, email: '', firstName: null, lastName: null };
      }
    })
  );
  return results;
}

export default async function EditStoryPage({ params }) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) notFound();

  const actor = await getActor();
  if (!canManage(story, actor)) notFound();

  const canManageSharing = actor.isAdmin || story.ownerId === actor.userId;
  const collaborators = canManageSharing ? await resolveCollaborators(story.editorIds) : [];

  return (
    <StoryForm
      initialData={story}
      storyId={id}
      mode="edit"
      canManageSharing={canManageSharing}
      canDelete={canManageSharing}
      initialCollaborators={collaborators}
    />
  );
}
