import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getAllUsers, getPlatformStats, getUserCards } from '@/lib/db';

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
