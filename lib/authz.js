import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdminEmail } from './roles';

/**
 * Resolves the logged-in Clerk user into { userId, isAdmin } for story
 * ownership checks. userId is null when signed out.
 */
export async function getActor() {
  const { userId } = await auth();
  if (!userId) return { userId: null, isAdmin: false };

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  return { userId, isAdmin: isAdminEmail(email) };
}

/** Can this actor edit/manage the given story (owner, shared editor, or admin)? */
export function canManage(story, actor) {
  return (
    actor.isAdmin ||
    story.ownerId === actor.userId ||
    (story.editorIds || []).includes(actor.userId)
  );
}

/** Can this actor view the given story (managers, or anyone if it's public)? */
export function canView(story, actor) {
  return !!story.isPublic || canManage(story, actor);
}
