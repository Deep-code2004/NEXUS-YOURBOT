import { create } from 'zustand';

export type GestureIntent = 'none' | 'swipe_left' | 'swipe_right' | 'pinch' | 'release' | 'palm' | 'circle';

interface GestureState {
  currentIntent: GestureIntent;
  setCurrentIntent: (intent: GestureIntent) => void;
  confidence: number;
  setConfidence: (confidence: number) => void;
  rawCoordinates: { x: number; y: number; z: number } | null;
  setRawCoordinates: (coords: { x: number; y: number; z: number } | null) => void;
  pinchPosition: { x: number; y: number } | null;
  setPinchPosition: (pos: { x: number; y: number } | null) => void;
  webcamError: string | null;
  setWebcamError: (error: string | null) => void;
  retryCamera: (() => void) | null;
  setRetryCamera: (fn: (() => void) | null) => void;
}

export const useGestureStore = create<GestureState>((set) => ({
  currentIntent: 'none',
  setCurrentIntent: (intent) => set({ currentIntent: intent }),
  confidence: 0,
  setConfidence: (confidence) => set({ confidence }),
  rawCoordinates: null,
  setRawCoordinates: (coords) => set({ rawCoordinates: coords }),
  pinchPosition: null,
  setPinchPosition: (pos) => set({ pinchPosition: pos }),
  webcamError: null,
  setWebcamError: (error) => set({ webcamError: error }),
  retryCamera: null,
  setRetryCamera: (fn) => set({ retryCamera: fn }),
}));
