import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getAllUsers, getPlatformStats, getUserCards, updateUserAdminNotes } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Access denied: Super Admin credentials required.' },
        { status: 403 }
      );
    }

    const users = getAllUsers();
    const stats = getPlatformStats();

    // Map each user with their cards details for the admin view
    const usersWithCards = users.map((u) => ({
      ...u,
      cards: getUserCards(u.id),
    }));

    return NextResponse.json({
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      stats,
      users: usersWithCards,
    });
  } catch (error) {
    console.error('Admin API Error:', error);
    return NextResponse.json({ error: 'Internal server error in admin deck.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Access denied: Super Admin credentials required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetUserId, notes } = body;

    if (!targetUserId || notes === undefined) {
      return NextResponse.json({ error: 'targetUserId and notes are required.' }, { status: 400 });
    }

    const success = updateUserAdminNotes(targetUserId, notes);
    if (!success) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const users = getAllUsers();
    const usersWithCards = users.map((u) => ({
      ...u,
      cards: getUserCards(u.id),
    }));

    return NextResponse.json({
      success: true,
      users: usersWithCards,
      stats: getPlatformStats(),
    });
  } catch (error) {
    console.error('Admin POST Error:', error);
    return NextResponse.json({ error: 'Internal server error updating admin notes.' }, { status: 500 });
  }
}
