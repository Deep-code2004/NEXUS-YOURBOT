import { create } from 'zustand';

export type GestureIntent =
  | 'none'
  | 'swipe_left'
  | 'swipe_right'
  | 'pinch'
  | 'release'
  | 'palm'
  | 'fist'
  | 'thumbs_up'
  | 'peace'
  | 'point'
  | 'air_steer_left'
  | 'air_steer_right';

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

interface GestureState {
  currentIntent: GestureIntent;
  setCurrentIntent: (intent: GestureIntent) => void;
  confidence: number;
  setConfidence: (confidence: number) => void;
  rawCoordinates: Landmark3D | null;
  setRawCoordinates: (coords: Landmark3D | null) => void;
  pinchPosition: { x: number; y: number } | null;
  setPinchPosition: (pos: { x: number; y: number } | null) => void;
  isPinching: boolean;
  setIsPinching: (pinching: boolean) => void;
  handLandmarks: Landmark3D[] | null;
  setHandLandmarks: (landmarks: Landmark3D[] | null) => void;
  handVelocity: { x: number; y: number };
  setHandVelocity: (vel: { x: number; y: number }) => void;
  handPresent: boolean;
  setHandPresent: (present: boolean) => void;
  webcamError: string | null;
  setWebcamError: (error: string | null) => void;
  cameraActive: boolean;
  setCameraActive: (active: boolean) => void;
  showCameraHUD: boolean;
  setShowCameraHUD: (show: boolean) => void;
  fps: number;
  setFps: (fps: number) => void;
  steerIntensity: number; // -1 (far left) to +1 (far right)
  setSteerIntensity: (intensity: number) => void;
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
  isPinching: false,
  setIsPinching: (isPinching) => set({ isPinching }),
  handLandmarks: null,
  setHandLandmarks: (landmarks) => set({ handLandmarks: landmarks }),
  handVelocity: { x: 0, y: 0 },
  setHandVelocity: (vel) => set({ handVelocity: vel }),
  handPresent: false,
  setHandPresent: (handPresent) => set({ handPresent }),
  webcamError: null,
  setWebcamError: (error) => set({ webcamError: error }),
  cameraActive: false,
  setCameraActive: (cameraActive) => set({ cameraActive }),
  showCameraHUD: true,
  setShowCameraHUD: (show) => set({ showCameraHUD: show }),
  fps: 0,
  setFps: (fps) => set({ fps }),
  steerIntensity: 0,
  setSteerIntensity: (steerIntensity) => set({ steerIntensity }),
  retryCamera: null,
  setRetryCamera: (fn) => set({ retryCamera: fn }),
}));
