'use client';

import { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useGestureStore, Landmark3D, GestureIntent } from '@/store/useGestureStore';
import { useSceneStore } from '@/store/useSceneStore';
import HandVisualizerHUD from './HandVisualizerHUD';

export default function HandTrackingProvider({ children }: { children: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const historyRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const lastActionTimeRef = useRef<{ pinch: number; fist: number; swipe: number; thumbs: number }>({
    pinch: 0,
    fist: 0,
    swipe: 0,
    thumbs: 0,
  });
  const fpsCountRef = useRef({ frames: 0, lastTime: performance.now() });

  const {
    setCurrentIntent,
    setConfidence,
    setRawCoordinates,
    setPinchPosition,
    setIsPinching,
    setHandLandmarks,
    setHandVelocity,
    setHandPresent,
    setWebcamError,
    setCameraActive,
    setFps,
    setSteerIntensity,
    setRetryCamera,
  } = useGestureStore();

  const { activeCardId, setActiveCardId, cards } = useSceneStore();

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;

    const initializeMediaPipeAndCamera = async () => {
      setWebcamError('Initializing Neural Hand Model...');

      // 1. Try loading MediaPipe Vision Tasks with fallback CDN versions
      const cdnUrls = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
      ];

      let vision: any = null;
      for (const url of cdnUrls) {
        try {
          vision = await FilesetResolver.forVisionTasks(url);
          if (vision) break;
        } catch (e) {
          console.warn(`WASM CDN ${url} failed, trying next mirror...`, e);
        }
      }

      if (!vision) {
        setWebcamError('Neural model assets unavailable. Check internet connection.');
        return;
      }

      // 2. Initialize HandLandmarker with GPU delegate first, fallback to CPU
      let landmarker: HandLandmarker | null = null;
      try {
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });
      } catch (gpuErr) {
        console.warn('GPU delegate failed, falling back to CPU delegate:', gpuErr);
        try {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
          });
        } catch (cpuErr) {
          console.error('Failed to load HandLandmarker on CPU and GPU:', cpuErr);
          setWebcamError('Hand tracking initialization failed.');
          return;
        }
      }

      if (!active) {
        landmarker?.close();
        return;
      }

      landmarkerRef.current = landmarker;

      // 3. Start Camera Video Stream
      const startCamera = async () => {
        try {
          setWebcamError('Requesting camera access...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            },
            audio: false,
          });

          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = async () => {
              try {
                await videoRef.current?.play();
                setCameraActive(true);
                setWebcamError(null);
                startPredictionLoop();
              } catch (playErr) {
                console.error('Video play error:', playErr);
              }
            };
          }
        } catch (camErr: any) {
          console.error('Webcam permission error:', camErr);
          setWebcamError(
            camErr.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera in browser.'
              : 'No camera device found or camera in use.'
          );
        }
      };

      setRetryCamera(startCamera);
      await startCamera();
    };

    const startPredictionLoop = () => {
      const predict = () => {
        const video = videoRef.current;
        const landmarker = landmarkerRef.current;

        if (!video || !landmarker || video.readyState < 2) {
          requestRef.current = requestAnimationFrame(predict);
          return;
        }

        // Compute FPS
        fpsCountRef.current.frames++;
        const now = performance.now();
        if (now - fpsCountRef.current.lastTime >= 1000) {
          setFps(fpsCountRef.current.frames);
          fpsCountRef.current.frames = 0;
          fpsCountRef.current.lastTime = now;
        }

        try {
          const results = landmarker.detectForVideo(video, now);

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0] as Landmark3D[];
            processHandLandmarks(landmarks, now);
          } else {
            // No hand detected
            setHandPresent(false);
            setCurrentIntent('none');
            setConfidence(0);
            setRawCoordinates(null);
            setPinchPosition(null);
            setIsPinching(false);
            setHandLandmarks(null);
            setSteerIntensity(0);
          }
        } catch (detectErr) {
          // Frame skip or timestamp collision
        }

        requestRef.current = requestAnimationFrame(predict);
      };

      requestRef.current = requestAnimationFrame(predict);
    };

    // Sophisticated Hand Gesture Classifier & Spatial Action Dispatcher
    const processHandLandmarks = (landmarks: Landmark3D[], timestamp: number) => {
      setHandPresent(true);
      setHandLandmarks(landmarks);

      const wrist = landmarks[0];
      const thumbTip = landmarks[4];
      const thumbMcp = landmarks[2];
      const indexTip = landmarks[8];
      const indexPip = landmarks[6];
      const indexMcp = landmarks[5];
      const middleTip = landmarks[12];
      const middlePip = landmarks[10];
      const middleMcp = landmarks[9];
      const ringTip = landmarks[16];
      const ringPip = landmarks[14];
      const pinkyTip = landmarks[20];
      const pinkyPip = landmarks[18];

      // Hand scale reference (wrist to middle MCP) for invariant distance metrics
      const handScale = Math.hypot(
        middleMcp.x - wrist.x,
        middleMcp.y - wrist.y,
        middleMcp.z - wrist.z
      ) || 0.2;

      // Mirrored coordinates for intuitive screen matching (0.0 = left of user, 1.0 = right of user)
      const mirroredIndexX = 1.0 - indexTip.x;
      const mirroredIndexY = indexTip.y;
      const mirroredPalmX = 1.0 - middleMcp.x;

      setRawCoordinates({ x: mirroredIndexX, y: mirroredIndexY, z: indexTip.z });

      // 1. Calculate Velocity & Swipe Recognition
      const history = historyRef.current;
      history.push({ x: mirroredPalmX, y: middleMcp.y, time: timestamp });
      if (history.length > 10) history.shift();

      let vx = 0;
      let vy = 0;
      if (history.length >= 4) {
        const oldest = history[0];
        const newest = history[history.length - 1];
        const dt = (newest.time - oldest.time) / 1000;
        if (dt > 0.05) {
          vx = (newest.x - oldest.x) / dt;
          vy = (newest.y - oldest.y) / dt;
          setHandVelocity({ x: vx, y: vy });
        }
      }

      // 2. Finger Extension Analysis
      const isIndexExtended = indexTip.y < indexPip.y - 0.02 * handScale;
      const isMiddleExtended = middleTip.y < middlePip.y - 0.02 * handScale;
      const isRingExtended = ringTip.y < ringPip.y - 0.02 * handScale;
      const isPinkyExtended = pinkyTip.y < pinkyPip.y - 0.02 * handScale;
      const isThumbExtended = Math.hypot(thumbTip.x - thumbMcp.x, thumbTip.y - thumbMcp.y) > 0.45 * handScale;

      const extendedCount = [
        isIndexExtended,
        isMiddleExtended,
        isRingExtended,
        isPinkyExtended,
      ].filter(Boolean).length;

      // 3. Pinch Recognition (Thumb tip to Index tip normalized distance)
      const pinchDist = Math.hypot(
        indexTip.x - thumbTip.x,
        indexTip.y - thumbTip.y,
        indexTip.z - thumbTip.z
      );
      const normalizedPinchDist = pinchDist / handScale;
      const isPinchingNow = normalizedPinchDist < 0.35; // Calibrated robust threshold

      // 4. Fist Recognition (All fingers curled down toward palm)
      const isFist =
        extendedCount === 0 &&
        indexTip.y > indexMcp.y &&
        middleTip.y > middleMcp.y &&
        ringTip.y > ringPip.y;

      // 5. Thumbs Up Recognition
      const isThumbsUp =
        thumbTip.y < wrist.y - 0.1 &&
        thumbTip.y < indexMcp.y - 0.05 &&
        extendedCount === 0;

      // 6. Peace / Victory Sign
      const isPeaceSign =
        isIndexExtended &&
        isMiddleExtended &&
        !isRingExtended &&
        !isPinkyExtended;

      // 7. Pointing Laser Mode
      const isPointing =
        isIndexExtended &&
        !isMiddleExtended &&
        !isRingExtended &&
        !isPinkyExtended;

      // 8. Open Palm
      const isOpenPalm = extendedCount >= 4 && isThumbExtended;

      // 9. Continuous Spatial Air Steering (-1.0 to +1.0)
      let steer = 0;
      if (mirroredPalmX < 0.38) {
        steer = (mirroredPalmX - 0.38) / 0.38; // Negative (tilt/glide left)
      } else if (mirroredPalmX > 0.62) {
        steer = (mirroredPalmX - 0.62) / 0.38; // Positive (tilt/glide right)
      }
      setSteerIntensity(steer);

      // Determine Primary Gesture Intent & Execute Actions
      let detectedIntent: GestureIntent = 'none';
      let confidenceScore = 0.85;

      // Fast Swipe Detection Check (Cooldown: 450ms)
      if (Math.abs(vx) > 1.8 && timestamp - lastActionTimeRef.current.swipe > 450) {
        if (vx < -1.8) {
          detectedIntent = 'swipe_left';
          confidenceScore = Math.min(1.0, Math.abs(vx) / 3.0);
          lastActionTimeRef.current.swipe = timestamp;
          useSceneStore.getState().nextCard();
        } else if (vx > 1.8) {
          detectedIntent = 'swipe_right';
          confidenceScore = Math.min(1.0, Math.abs(vx) / 3.0);
          lastActionTimeRef.current.swipe = timestamp;
          useSceneStore.getState().prevCard();
        }
      } else if (isPinchingNow) {
        detectedIntent = 'pinch';
        confidenceScore = Math.max(0.7, 1.0 - normalizedPinchDist / 0.35);
        const pinchX = (1.0 - (indexTip.x + thumbTip.x) / 2);
        const pinchY = (indexTip.y + thumbTip.y) / 2;
        setPinchPosition({ x: pinchX, y: pinchY });
        setIsPinching(true);

        // Action: Pinch to inspect the EXACT centered card (Debounce: 600ms)
        if (timestamp - lastActionTimeRef.current.pinch > 600) {
          lastActionTimeRef.current.pinch = timestamp;
          const currentStore = useSceneStore.getState();
          if (currentStore.cards.length > 0) {
            if (!currentStore.activeCardId) {
              const targetCard = currentStore.cards[currentStore.centeredCardIndex] || currentStore.cards[0];
              if (targetCard) {
                currentStore.setActiveCardId(targetCard.id);
              }
            }
          }
        }
      } else if (isFist) {
        detectedIntent = 'fist';
        confidenceScore = 0.92;
        setPinchPosition(null);
        setIsPinching(false);

        // Action: Fist clench dismisses active inspector / clears selection (Debounce: 500ms)
        if (timestamp - lastActionTimeRef.current.fist > 500) {
          lastActionTimeRef.current.fist = timestamp;
          const currentStore = useSceneStore.getState();
          if (currentStore.activeCardId) {
            currentStore.setActiveCardId(null);
          }
        }
      } else if (isThumbsUp) {
        detectedIntent = 'thumbs_up';
        confidenceScore = 0.95;
        setPinchPosition(null);
        setIsPinching(false);
      } else if (isPeaceSign) {
        detectedIntent = 'peace';
        confidenceScore = 0.9;
        setPinchPosition(null);
        setIsPinching(false);
      } else if (isPointing) {
        detectedIntent = 'point';
        confidenceScore = 0.88;
        setPinchPosition(null);
        setIsPinching(false);
      } else if (steer < -0.2) {
        detectedIntent = 'air_steer_left';
        confidenceScore = Math.abs(steer);
        setPinchPosition(null);
        setIsPinching(false);
      } else if (steer > 0.2) {
        detectedIntent = 'air_steer_right';
        confidenceScore = Math.abs(steer);
        setPinchPosition(null);
        setIsPinching(false);
      } else if (isOpenPalm) {
        detectedIntent = 'palm';
        confidenceScore = 0.9;
        setPinchPosition(null);
        setIsPinching(false);
      } else {
        detectedIntent = 'none';
        confidenceScore = 0.4;
        setPinchPosition(null);
        setIsPinching(false);
      }

      setCurrentIntent(detectedIntent);
      setConfidence(confidenceScore);
    };

    initializeMediaPipeAndCamera();

    return () => {
      active = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [
    setCurrentIntent,
    setConfidence,
    setRawCoordinates,
    setPinchPosition,
    setIsPinching,
    setHandLandmarks,
    setHandVelocity,
    setHandPresent,
    setWebcamError,
    setCameraActive,
    setFps,
    setSteerIntensity,
    setRetryCamera,
  ]);

  return (
    <>
      {/* Active Hidden Video Source with proper dimensions so frame processing is flawless */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: '640px',
          height: '480px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
      {/* Holographic Cyberpunk Hand Skeleton HUD & Spatial Cursor */}
      <HandVisualizerHUD videoRef={videoRef} />
      {children}
    </>
  );
}
