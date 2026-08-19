import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import {
  getUserCards,
  createCard,
  addItemsToCard,
  deleteCard,
  toggleCardItem,
  deleteCardItem,
  getUserById,
} from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    const userId = user ? user.id : 'user_demo_002';

    const cards = getUserCards(userId);
    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Failed to fetch cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    const userId = user ? user.id : 'user_demo_002';
    const body = await req.json();

    // 1. Toggle Item Done
    if (body.action === 'toggle_item' && body.cardId && body.itemId) {
      const updatedCard = toggleCardItem({
        userId,
        cardId: body.cardId,
        itemId: body.itemId,
      });
      return NextResponse.json({ card: updatedCard, cards: getUserCards(userId) });
    }

    // 2. Delete Single Item
    if (body.action === 'delete_item' && body.cardId && body.itemId) {
      const updatedCard = deleteCardItem({
        userId,
        cardId: body.cardId,
        itemId: body.itemId,
      });
      return NextResponse.json({ card: updatedCard, cards: getUserCards(userId) });
    }

    // 3. Add Items to Existing Card
    if (body.action === 'add_items' && body.cardTitle && Array.isArray(body.items)) {
      const updatedCard = addItemsToCard({
        userId,
        cardIdOrTitle: body.cardTitle,
        items: body.items,
      });
      if (!updatedCard) {
        // If not found, create new card with these items
        const newCard = createCard({
          userId,
          title: body.cardTitle,
          color: body.color,
          items: body.items,
        });
        return NextResponse.json({ card: newCard, cards: getUserCards(userId) });
      }
      return NextResponse.json({ card: updatedCard, cards: getUserCards(userId) });
    }

    // 4. Create New Card
    if (body.title) {
      const card = createCard({
        userId,
        title: body.title,
        color: body.color,
        items: body.items || [],
      });
      return NextResponse.json({ card, cards: getUserCards(userId) });
    }

    return NextResponse.json({ error: 'Invalid card payload.' }, { status: 400 });
  } catch (error) {
    console.error('Failed to process card action:', error);
    return NextResponse.json({ error: 'Failed to process card action' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser(req);
    const userId = user ? user.id : 'user_demo_002';
    const { searchParams } = new URL(req.url);
    const cardIdOrTitle = searchParams.get('id') || searchParams.get('title');

    if (!cardIdOrTitle) {
      return NextResponse.json({ error: 'Card ID or Title required.' }, { status: 400 });
    }

    const success = deleteCard({ userId, cardIdOrTitle });
    return NextResponse.json({ success, cards: getUserCards(userId) });
  } catch (error) {
    console.error('Failed to delete card:', error);
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}
