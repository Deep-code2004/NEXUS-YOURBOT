import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import {
  getUserCards,
  createCard,
  addItemsToCard,
  deleteCard,
  getAllUsers,
  getPlatformStats,
} from '@/lib/db';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are NEXUS, an advanced spatial operating system AI assistant.
You speak with a calm, futuristic, highly intelligent, and concise persona (like JARVIS).
Keep spoken responses brief (1-2 sentences), as they will be spoken aloud via Text-to-Speech.

You have full control over the user's 3D spatial interface, database, cards, and Super Admin telemetry.

When a user asks you to take an action, you MUST respond in valid JSON with:
- "speech": Concise text to be spoken aloud.
- "action": One of:
    - "create_card": User wants to create a new category/card or add items. Requires "title" (uppercase string), optional "color" (hex), optional "items" (array of strings).
    - "add_card_items": User wants to add items to an existing card. Requires "cardTitle" (string) and "items" (array of strings).
    - "delete_card": User wants to remove a card. Requires "cardTitle" (string).
    - "open_card": User wants to view/focus a card or module in 3D. Requires "target" (card title or slug).
    - "close_card": User wants to close the card view / reset view.
    - "admin_show_users": Super Admin wants to see user details/list.
    - "admin_show_stats": Super Admin wants to see system analytics/metrics.
- "params": Object containing the parameters for the chosen action (e.g. { "title": "TODO", "items": ["Buy groceries", "Gym"] }).

EXAMPLES OF ACTIONS:
1. User: "Hey Nexus, make a TODO card and add buy milk, gym session"
JSON:
{
  "speech": "Creating TODO card and adding items to your spatial workspace.",
  "action": "create_card",
  "params": {
    "title": "TODO",
    "color": "#FF8C00",
    "items": ["Buy milk", "Gym session"]
  }
}

2. User: "Add call Sarah to my WORK card"
JSON:
{
  "speech": "Adding item to your WORK card.",
  "action": "add_card_items",
  "params": {
    "cardTitle": "WORK",
    "items": ["Call Sarah"]
  }
}

3. User: "Open my TODO card" or "Focus on FITNESS"
JSON:
{
  "speech": "Opening TODO card in spatial focus.",
  "action": "open_card",
  "params": {
    "target": "TODO"
  }
}

4. User (Super Admin): "Nexus, show me recent user details" or "show users"
JSON:
{
  "speech": "Opening Super Admin telemetry deck with user analytics.",
  "action": "admin_show_users",
  "params": {}
}

5. User: "What is quantum computing?"
Plain text response (NO JSON needed for general conversational questions).
`;

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    const userId = user ? user.id : 'user_demo_002';
    const userRole = user ? user.role : 'user';

    const { message, history } = await req.json();

    const userCards = getUserCards(userId);
    const availableCardTitles = userCards.map((c) => c.title).join(', ');

    // Inject contextual system metadata
    const userContext = `
[CURRENT CONTEXT]
User: ${user ? user.name : 'Demo Pilot'} (${userRole})
Active User Cards in 3D: [${availableCardTitles}]
`;

    // Convert client history to Gemini format
    const contents = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Add user context and current prompt
    contents.push({
      role: 'user',
      parts: [{ text: `${userContext}\nUser command: ${message}` }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const reply = response.text || '';

    // Action execution variables
    let actionPayload: any = null;
    let speechText = reply;
    let updatedCards = userCards;
    let adminData: any = null;

    // Check if reply is JSON action
    const trimmed = reply.trim();
    if (trimmed.startsWith('{') || trimmed.includes('"action"')) {
      try {
        // Extract JSON if wrapped in markdown block
        const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.action) {
            actionPayload = { action: parsed.action, params: parsed.params || {} };
            if (parsed.speech) speechText = parsed.speech;

            // Execute DB operations automatically
            switch (parsed.action) {
              case 'create_card': {
                const title = parsed.params?.title || 'NEW CARD';
                const color = parsed.params?.color;
                const items = parsed.params?.items || [];
                createCard({ userId, title, color, items });
                updatedCards = getUserCards(userId);
                break;
              }

              case 'add_card_items': {
                const cardTitle = parsed.params?.cardTitle || parsed.params?.title || '';
                const items = parsed.params?.items || [];
                if (cardTitle && items.length > 0) {
                  addItemsToCard({ userId, cardIdOrTitle: cardTitle, items });
                  updatedCards = getUserCards(userId);
                }
                break;
              }

              case 'delete_card': {
                const cardTitle = parsed.params?.cardTitle || parsed.params?.title || '';
                if (cardTitle) {
                  deleteCard({ userId, cardIdOrTitle: cardTitle });
                  updatedCards = getUserCards(userId);
                }
                break;
              }

              case 'admin_show_users':
              case 'admin_show_stats': {
                if (userRole !== 'super_admin') {
                  speechText = 'Access restricted. Super Admin clearance is required to view telemetry.';
                  actionPayload = { action: 'access_denied' };
                } else {
                  const users = getAllUsers();
                  const stats = getPlatformStats();
                  adminData = {
                    users: users.map((u) => ({ ...u, cards: getUserCards(u.id) })),
                    stats,
                  };
                }
                break;
              }
            }
          }
        }
      } catch (e) {
        // Fallback to plain text
      }
    }

    return NextResponse.json({
      text: speechText,
      action: actionPayload,
      cards: updatedCards,
      adminData,
    });
  } catch (error: any) {
    console.error('NEXUS AI Chat Error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI command', text: 'System offline. Please check network connection.' },
      { status: 500 }
    );
  }
}
