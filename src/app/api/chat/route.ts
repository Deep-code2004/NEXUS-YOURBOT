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

// Helper: Rule-based local intent parser fallback if Gemini API fails or times out
function parseLocalIntent(message: string, userCards: any[], userRole: string) {
  const clean = message.trim();
  const lower = clean.toLowerCase();

  // 1. Open / Focus card
  const openMatch = lower.match(/(?:open|focus(?:\s+on)?|view|show|expand)\s+(?:my\s+)?([a-z0-9_\s-]+?)(?:\s+card|\s+module)?$/i);
  if (openMatch && !lower.includes('user') && !lower.includes('stat') && !lower.includes('all')) {
    const targetTitle = openMatch[1].trim().toUpperCase();
    return {
      speech: `Focusing on ${targetTitle} card.`,
      actionPayload: { action: 'open_card', params: { target: targetTitle } },
    };
  }

  // 2. Close card
  if (lower.includes('close') || lower.includes('reset view') || lower.includes('back to overview') || lower === 'close') {
    return {
      speech: 'Closing focused view.',
      actionPayload: { action: 'close_card', params: {} },
    };
  }

  // 3. Admin user/stat queries
  if (lower.includes('show user') || lower.includes('user details') || lower.includes('user list') || lower.includes('telemetry')) {
    if (userRole !== 'super_admin') {
      return {
        speech: 'Access restricted. Super Admin clearance is required.',
        actionPayload: { action: 'access_denied', params: {} },
      };
    }
    return {
      speech: 'Opening Super Admin telemetry deck with user analytics.',
      actionPayload: { action: 'admin_show_users', params: {} },
    };
  }

  if (lower.includes('show stat') || lower.includes('system metric') || lower.includes('platform stat')) {
    if (userRole !== 'super_admin') {
      return {
        speech: 'Access restricted. Super Admin clearance is required.',
        actionPayload: { action: 'access_denied', params: {} },
      };
    }
    return {
      speech: 'Displaying platform telemetry and hardware analytics.',
      actionPayload: { action: 'admin_show_stats', params: {} },
    };
  }

  // 4. Create card
  const createMatch = lower.match(/(?:create|make|new)\s+(?:a\s+)?([a-z0-9_\s-]+?)\s+card(?:\s+(?:with|and add)\s+(.+))?/i);
  if (createMatch) {
    const title = createMatch[1].trim().toUpperCase();
    const itemsRaw = createMatch[2];
    const items = itemsRaw ? itemsRaw.split(/,|\band\b/).map((i) => i.trim()).filter(Boolean) : [];
    return {
      speech: `Created ${title} card with ${items.length > 0 ? items.length + ' items' : 'default template'}.`,
      actionPayload: { action: 'create_card', params: { title, color: '#4A90E2', items } },
    };
  }

  // 5. Add items to card
  const addMatch = lower.match(/add\s+(.+?)\s+to\s+(?:my\s+)?([a-z0-9_\s-]+?)(?:\s+card)?$/i);
  if (addMatch) {
    const itemsRaw = addMatch[1].trim();
    const cardTitle = addMatch[2].trim().toUpperCase();
    const items = itemsRaw.split(/,|\band\b/).map((i) => i.trim()).filter(Boolean);
    return {
      speech: `Added items to ${cardTitle} card.`,
      actionPayload: { action: 'add_card_items', params: { cardTitle, items } },
    };
  }

  // 6. Delete card
  const deleteMatch = lower.match(/(?:delete|remove)\s+(?:my\s+)?([a-z0-9_\s-]+?)(?:\s+card)?$/i);
  if (deleteMatch) {
    const cardTitle = deleteMatch[1].trim().toUpperCase();
    return {
      speech: `Removed ${cardTitle} card from workspace.`,
      actionPayload: { action: 'delete_card', params: { cardTitle } },
    };
  }

  // General fallback
  return {
    speech: `Command received: "${clean}". NEXUS core online.`,
    actionPayload: null,
  };
}

export async function POST(req: Request) {
  let userId = 'user_demo_002';
  let userRole = 'user';
  let userCards: any[] = [];
  let message = '';

  try {
    const user = await getSessionUser(req);
    if (user) {
      userId = user.id;
      userRole = user.role;
    }

    const body = await req.json();
    message = body.message || '';
    const history = body.history || [];

    userCards = getUserCards(userId);
    const availableCardTitles = userCards.map((c) => c.title).join(', ');

    // User context
    const userContext = `
[CURRENT CONTEXT]
User: ${user ? user.name : 'Demo Pilot'} (${userRole})
Active User Cards in 3D: [${availableCardTitles}]
`;

    // Convert history to Gemini format
    const contents = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: `${userContext}\nUser command: ${message}` }],
    });

    let reply = '';
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('AQ.')) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        // Run Gemini with a 7-second timeout race to prevent long UI hangs
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 7000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        reply = response.text || '';
      } catch (geminiErr) {
        console.warn('Gemini API unreachable or timed out, activating local intent fallback:', geminiErr);
        reply = '';
      }
    }

    // Action execution variables
    let actionPayload: any = null;
    let speechText = reply;
    let updatedCards = userCards;
    let adminData: any = null;

    // If Gemini produced a JSON response
    const trimmed = reply.trim();
    if (trimmed.startsWith('{') || trimmed.includes('"action"')) {
      try {
        const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.action) {
            actionPayload = { action: parsed.action, params: parsed.params || {} };
            if (parsed.speech) speechText = parsed.speech;
          }
        }
      } catch (_) {}
    }

    // If Gemini failed or didn't provide a structured reply, use local intent parser
    if (!actionPayload && (!reply || reply.trim() === '')) {
      const localResult = parseLocalIntent(message, userCards, userRole);
      speechText = localResult.speech;
      actionPayload = localResult.actionPayload;
    }

    // Execute DB operations automatically based on actionPayload
    if (actionPayload && actionPayload.action) {
      switch (actionPayload.action) {
        case 'create_card': {
          const title = actionPayload.params?.title || 'NEW CARD';
          const color = actionPayload.params?.color;
          const items = actionPayload.params?.items || [];
          createCard({ userId, title, color, items });
          updatedCards = getUserCards(userId);
          break;
        }

        case 'add_card_items': {
          const cardTitle = actionPayload.params?.cardTitle || actionPayload.params?.title || '';
          const items = actionPayload.params?.items || [];
          if (cardTitle && items.length > 0) {
            addItemsToCard({ userId, cardIdOrTitle: cardTitle, items });
            updatedCards = getUserCards(userId);
          }
          break;
        }

        case 'delete_card': {
          const cardTitle = actionPayload.params?.cardTitle || actionPayload.params?.title || '';
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

    return NextResponse.json({
      text: speechText || 'Affirmative.',
      action: actionPayload,
      cards: updatedCards,
      adminData,
    });
  } catch (error: any) {
    console.error('NEXUS AI Chat Fatal Error:', error);
    // Even on fatal unexpected exception, execute local intent parser so user experience never breaks
    const fallback = parseLocalIntent(message || '', userCards, userRole);
    return NextResponse.json({
      text: fallback.speech || 'Processing request locally.',
      action: fallback.actionPayload,
      cards: userCards,
      adminData: null,
    });
  }
}
