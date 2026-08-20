import { create } from 'zustand';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'super_admin';
}

interface AIState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  authChecked: boolean;
  setAuthChecked: (val: boolean) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;

  isListening: boolean;
  setIsListening: (val: boolean) => void;
  isThinking: boolean;
  setIsThinking: (val: boolean) => void;
  isSpeaking: boolean;
  setIsSpeaking: (val: boolean) => void;
  transcript: string;
  setTranscript: (val: string) => void;
  voiceError: string | null;
  setVoiceError: (val: string | null) => void;
  isSupported: boolean;
  setIsSupported: (val: boolean) => void;

  history: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearHistory: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  authChecked: false,
  setAuthChecked: (val) => set({ authChecked: val }),
  authModalOpen: false,
  setAuthModalOpen: (open) => set({ authModalOpen: open }),

  isListening: false,
  setIsListening: (val) => set({ isListening: val }),
  isThinking: false,
  setIsThinking: (val) => set({ isThinking: val }),
  isSpeaking: false,
  setIsSpeaking: (val) => set({ isSpeaking: val }),
  transcript: '',
  setTranscript: (val) => set({ transcript: val }),
  voiceError: null,
  setVoiceError: (val) => set({ voiceError: val }),
  isSupported: true,
  setIsSupported: (val) => set({ isSupported: val }),

  history: [],
  addMessage: (msg) => set((state) => ({ history: [...state.history, msg] })),
  clearHistory: () => set({ history: [] }),
}));
