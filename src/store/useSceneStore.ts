import { create } from 'zustand';
import { UserCard } from '@/lib/db';

interface SceneState {
  // Dynamic Cards
  cards: UserCard[];
  setCards: (cards: UserCard[]) => void;
  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;
  
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

export const useSceneStore = create<SceneState>((set) => ({
  cards: [],
  setCards: (cards) => set({ cards }),
  activeCardId: null,
  setActiveCardId: (id) => set({ activeCardId: id }),

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
