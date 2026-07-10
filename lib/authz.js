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
