import { create } from 'zustand';
import { UserCard } from '@/lib/db';

interface SceneState {
  // Dynamic Cards
  cards: UserCard[];
  setCards: (cards: UserCard[]) => void;
  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;
  centeredCardIndex: number;
  setCenteredCardIndex: (index: number) => void;
  nextCard: () => void;
  prevCard: () => void;

  // Super Admin Deck
  adminDeckOpen: boolean;
  setAdminDeckOpen: (open: boolean) => void;
  adminUsers: any[];
  setAdminUsers: (users: any[]) => void;
  adminStats: any | null;
  setAdminStats: (stats: any | null) => void;

  // Scene rendering controls
  qualityTier: 'high' | 'medium' | 'low';
  setQualityTier: (tier: 'high' | 'medium' | 'low') => void;
  cameraPosition: [number, number, number];
  setCameraPosition: (pos: [number, number, number]) => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  cards: [],
  setCards: (cards) => {
    const prevIndex = get().centeredCardIndex;
    const safeIndex = cards.length > 0 ? Math.min(prevIndex, cards.length - 1) : 0;
    set({ cards, centeredCardIndex: safeIndex });
  },
  activeCardId: null,
  setActiveCardId: (id) => set({ activeCardId: id }),
  centeredCardIndex: 0,
  setCenteredCardIndex: (index) => {
    const { cards } = get();
    if (cards.length === 0) {
      set({ centeredCardIndex: 0 });
      return;
    }
    const safeIndex = ((index % cards.length) + cards.length) % cards.length;
    set({ centeredCardIndex: safeIndex });
  },
  nextCard: () => {
    const { cards, centeredCardIndex } = get();
    if (cards.length <= 1) return;
    const nextIndex = (centeredCardIndex + 1) % cards.length;
    set({ centeredCardIndex: nextIndex });
  },
  prevCard: () => {
    const { cards, centeredCardIndex } = get();
    if (cards.length <= 1) return;
    const prevIndex = (centeredCardIndex - 1 + cards.length) % cards.length;
    set({ centeredCardIndex: prevIndex });
  },

  adminDeckOpen: false,
  setAdminDeckOpen: (open) => set({ adminDeckOpen: open }),
  adminUsers: [],
  setAdminUsers: (users) => set({ adminUsers: users }),
  adminStats: null,
  setAdminStats: (stats) => set({ adminStats: stats }),

  qualityTier: 'high',
  setQualityTier: (tier) => set({ qualityTier: tier }),
  cameraPosition: [0, 0, 10],
  setCameraPosition: (pos) => set({ cameraPosition: pos }),
}));
