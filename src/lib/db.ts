import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  lastActive: string;
}

export interface CardItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface UserCard {
  id: string;
  userId: string;
  title: string;
  slug: string;
  color: string;
  items: CardItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

interface DatabaseSchema {
  users: User[];
  cards: UserCard[];
  activityLogs: ActivityLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'nexus_store.json');

function ensureDB(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const adminPassHash = bcrypt.hashSync('admin123', 10);
    const demoPassHash = bcrypt.hashSync('demo123', 10);

    const now = new Date().toISOString();

    const seedAdminId = 'user_admin_001';
    const seedUserId = 'user_demo_002';

    const defaultDB: DatabaseSchema = {
      users: [
        {
          id: seedAdminId,
          name: 'Super Admin',
          email: 'admin@nexus.os',
          passwordHash: adminPassHash,
          role: 'super_admin',
          createdAt: now,
          lastActive: now,
        },
        {
          id: seedUserId,
          name: 'Demo Pilot',
          email: 'demo@nexus.os',
          passwordHash: demoPassHash,
          role: 'user',
          createdAt: now,
          lastActive: now,
        },
      ],
      cards: [
        {
          id: 'card_todo_001',
          userId: seedUserId,
          title: 'TODO',
          slug: 'todo',
          color: '#FF8C00',
          items: [
            { id: 'item_1', text: 'Initialize neural gesture tracking', done: true, createdAt: now },
            { id: 'item_2', text: 'Calibrate voice interface frequency', done: false, createdAt: now },
            { id: 'item_3', text: 'Review spatial telemetry logs', done: false, createdAt: now },
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'card_projects_002',
          userId: seedUserId,
          title: 'PROJECTS',
          slug: 'projects',
          color: '#4A90E2',
          items: [
            { id: 'item_4', text: 'NEXUS Spatial OS Architecture', done: true, createdAt: now },
            { id: 'item_5', text: 'Super Admin Multi-node Deck', done: false, createdAt: now },
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'card_fitness_003',
          userId: seedUserId,
          title: 'FITNESS',
          slug: 'fitness',
          color: '#00C805',
          items: [
            { id: 'item_6', text: '5km Morning Cyber Run', done: true, createdAt: now },
            { id: 'item_7', text: 'Core & Upper Body Workout', done: false, createdAt: now },
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'card_ai_004',
          userId: seedUserId,
          title: 'NEXUS AI',
          slug: 'nexus-ai',
          color: '#FFD700',
          items: [
            { id: 'item_8', text: 'Gemini 2.5 Flash Autonomous Agent active', done: true, createdAt: now },
            { id: 'item_9', text: 'Voice intent parsing synchronized', done: true, createdAt: now },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ],
      activityLogs: [
        {
          id: 'act_001',
          userId: seedAdminId,
          userEmail: 'admin@nexus.os',
          action: 'SYSTEM_BOOT',
          details: 'NEXUS Spatial OS core systems online',
          timestamp: now,
        },
      ],
    };

    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2), 'utf-8');
    return defaultDB;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading nexus_store.json, creating fallback', e);
    return { users: [], cards: [], activityLogs: [] };
  }
}

function saveDB(db: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing to nexus_store.json', e);
  }
}

// User methods
export function getUserByEmail(email: string): User | undefined {
  const db = ensureDB();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string): User | undefined {
  const db = ensureDB();
  return db.users.find((u) => u.id === id);
}

export function createUser(data: { name: string; email: string; passwordHash: string; role?: UserRole }): User {
  const db = ensureDB();
  const now = new Date().toISOString();
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  const newUser: User = {
    id,
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    role: data.role || 'user',
    createdAt: now,
    lastActive: now,
  };

  db.users.push(newUser);

  // Provide initial starter cards for the new user
  const starterCards: UserCard[] = [
    {
      id: `card_${Date.now()}_1`,
      userId: id,
      title: 'TODO',
      slug: 'todo',
      color: '#FF8C00',
      items: [
        { id: `item_${Date.now()}_1`, text: 'Explore NEXUS spatial gesture controls', done: false, createdAt: now },
        { id: `item_${Date.now()}_2`, text: 'Try saying "Hey Nexus, make a WORK card"', done: false, createdAt: now },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `card_${Date.now()}_2`,
      userId: id,
      title: 'NOTES',
      slug: 'notes',
      color: '#00BFFF',
      items: [
        { id: `item_${Date.now()}_3`, text: 'NEXUS Spatial OS account registered', done: true, createdAt: now },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `card_${Date.now()}_3`,
      userId: id,
      title: 'NEXUS AI',
      slug: 'nexus-ai',
      color: '#FFD700',
      items: [
        { id: `item_${Date.now()}_4`, text: 'Ready for voice and gesture interaction', done: true, createdAt: now },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];

  db.cards.push(...starterCards);
  saveDB(db);

  logActivity({
    userId: newUser.id,
    userEmail: newUser.email,
    action: 'USER_REGISTERED',
    details: `New account created as ${newUser.role}`,
  });

  return newUser;
}

export function updateLastActive(userId: string) {
  const db = ensureDB();
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    user.lastActive = new Date().toISOString();
    saveDB(db);
  }
}

export function getAllUsers(): { id: string; name: string; email: string; role: UserRole; createdAt: string; lastActive: string; cardCount: number; itemCount: number }[] {
  const db = ensureDB();
  return db.users.map((u) => {
    const userCards = db.cards.filter((c) => c.userId === u.id);
    const itemCount = userCards.reduce((acc, c) => acc + c.items.length, 0);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastActive: u.lastActive,
      cardCount: userCards.length,
      itemCount,
    };
  });
}

// Card Methods
export function getUserCards(userId: string): UserCard[] {
  const db = ensureDB();
  return db.cards.filter((c) => c.userId === userId);
}

const HOLOGRAPHIC_COLORS = [
  '#FF8C00', // Orange
  '#00BFFF', // Cyan
  '#00C805', // Emerald
  '#E1306C', // Magenta
  '#9370DB', // Violet
  '#FFD700', // Gold
  '#4A90E2', // Azure
  '#FF4500', // Crimson
  '#00FA9A', // Spring Green
  '#1DB954', // Spotify Green
];

export function createCard(data: { userId: string; title: string; color?: string; items?: string[] }): UserCard {
  const db = ensureDB();
  const now = new Date().toISOString();
  const cleanTitle = data.title.trim().toUpperCase();
  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Pick distinct color if not supplied
  const color = data.color || HOLOGRAPHIC_COLORS[Math.floor(Math.random() * HOLOGRAPHIC_COLORS.length)];

  // Check if card with same title already exists for this user
  const existingCard = db.cards.find((c) => c.userId === data.userId && c.slug === slug);
  if (existingCard) {
    if (data.items && data.items.length > 0) {
      return addItemsToCard({ userId: data.userId, cardIdOrTitle: existingCard.id, items: data.items }) || existingCard;
    }
    return existingCard;
  }

  const initialItems: CardItem[] = (data.items || []).map((text, idx) => ({
    id: `item_${Date.now()}_${idx}`,
    text: text.trim(),
    done: false,
    createdAt: now,
  }));

  const newCard: UserCard = {
    id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: data.userId,
    title: cleanTitle,
    slug,
    color,
    items: initialItems,
    createdAt: now,
    updatedAt: now,
  };

  db.cards.push(newCard);
  saveDB(db);

  logActivity({
    userId: data.userId,
    userEmail: getUserById(data.userId)?.email || 'unknown',
    action: 'CARD_CREATED',
    details: `Created card "${newCard.title}" with ${newCard.items.length} items`,
  });

  return newCard;
}

export function addItemsToCard(data: { userId: string; cardIdOrTitle: string; items: string[] }): UserCard | undefined {
  const db = ensureDB();
  const query = data.cardIdOrTitle.trim().toLowerCase();
  
  const card = db.cards.find(
    (c) =>
      c.userId === data.userId &&
      (c.id === data.cardIdOrTitle || c.slug === query || c.title.toLowerCase() === query)
  );

  if (!card) return undefined;

  const now = new Date().toISOString();
  const newItems: CardItem[] = data.items.map((text, idx) => ({
    id: `item_${Date.now()}_${idx}`,
    text: text.trim(),
    done: false,
    createdAt: now,
  }));

  card.items.push(...newItems);
  card.updatedAt = now;
  saveDB(db);

  logActivity({
    userId: data.userId,
    userEmail: getUserById(data.userId)?.email || 'unknown',
    action: 'ITEMS_ADDED',
    details: `Added ${newItems.length} items to "${card.title}"`,
  });

  return card;
}

export function toggleCardItem(data: { userId: string; cardId: string; itemId: string }): UserCard | undefined {
  const db = ensureDB();
  const card = db.cards.find((c) => c.userId === data.userId && c.id === data.cardId);
  if (!card) return undefined;

  const item = card.items.find((i) => i.id === data.itemId);
  if (item) {
    item.done = !item.done;
    card.updatedAt = new Date().toISOString();
    saveDB(db);
  }
  return card;
}

export function deleteCardItem(data: { userId: string; cardId: string; itemId: string }): UserCard | undefined {
  const db = ensureDB();
  const card = db.cards.find((c) => c.userId === data.userId && c.id === data.cardId);
  if (!card) return undefined;

  card.items = card.items.filter((i) => i.id !== data.itemId);
  card.updatedAt = new Date().toISOString();
  saveDB(db);
  return card;
}

export function deleteCard(data: { userId: string; cardIdOrTitle: string }): boolean {
  const db = ensureDB();
  const query = data.cardIdOrTitle.trim().toLowerCase();
  
  const initialLen = db.cards.length;
  db.cards = db.cards.filter(
    (c) =>
      !(
        c.userId === data.userId &&
        (c.id === data.cardIdOrTitle || c.slug === query || c.title.toLowerCase() === query)
      )
  );

  const deleted = db.cards.length < initialLen;
  if (deleted) {
    saveDB(db);
    logActivity({
      userId: data.userId,
      userEmail: getUserById(data.userId)?.email || 'unknown',
      action: 'CARD_DELETED',
      details: `Deleted card "${data.cardIdOrTitle}"`,
    });
  }
  return deleted;
}

// Admin and Telemetry
export function logActivity(data: { userId: string; userEmail: string; action: string; details: string }) {
  const db = ensureDB();
  const now = new Date().toISOString();
  const newLog: ActivityLog = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: data.userId,
    userEmail: data.userEmail,
    action: data.action,
    details: data.details,
    timestamp: now,
  };

  db.activityLogs.unshift(newLog);
  // Keep last 100 logs
  if (db.activityLogs.length > 100) {
    db.activityLogs = db.activityLogs.slice(0, 100);
  }
  saveDB(db);
}

export function getPlatformStats() {
  const db = ensureDB();
  const totalUsers = db.users.length;
  const totalCards = db.cards.length;
  const totalItems = db.cards.reduce((acc, c) => acc + c.items.length, 0);
  const recentLogs = db.activityLogs.slice(0, 15);

  return {
    totalUsers,
    totalCards,
    totalItems,
    superAdmins: db.users.filter((u) => u.role === 'super_admin').length,
    recentLogs,
  };
}
