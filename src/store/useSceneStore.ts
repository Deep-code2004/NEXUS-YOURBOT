import { create } from 'zustand';

export type ModuleType = 'none' | 'instagram' | 'stocks' | 'projects' | 'sports' | 'weather' | 'news' | 'calendar' | 'music' | 'system' | 'ai';

interface SceneState {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  qualityTier: 'high' | 'medium' | 'low';
  setQualityTier: (tier: 'high' | 'medium' | 'low') => void;
  cameraPosition: [number, number, number];
  setCameraPosition: (pos: [number, number, number]) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  activeModule: 'none',
  setActiveModule: (module) => set({ activeModule: module }),
  qualityTier: 'high', // Will dynamically downgrade based on framerate later
  setQualityTier: (tier) => set({ qualityTier: tier }),
  cameraPosition: [0, 0, 10],
  setCameraPosition: (pos) => set({ cameraPosition: pos }),
}));
