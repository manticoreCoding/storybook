import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getActor } from '@/lib/authz';

export async function POST(request) {
  const actor = await getActor();
  if (!actor.userId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const client = await clerkClient();
  const { data } = await client.users.getUserList({ emailAddress: [email] });
  const user = data[0];
  if (!user) {
    return NextResponse.json({ error: 'No account found for that email' }, { status: 404 });
  }

  return NextResponse.json({
    userId: user.id,
    email,
    firstName: user.firstName,
    lastName: user.lastName,
  });
}
