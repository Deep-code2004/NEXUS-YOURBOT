'use client';

import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useGestureStore } from '@/store/useGestureStore';

export default function HandTrackingProvider({ children }: { children: React.ReactNode }) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>(0);
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  const { setCurrentIntent, setConfidence, setRawCoordinates, setPinchPosition } = useGestureStore();

  useEffect(() => {
    let active = true;

    const initializeMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1, // Start with 1 hand for Phase 1 as requested
        });
        
        if (active) {
          landmarkerRef.current = landmarker;
          setIsModelLoaded(true);
        }
      } catch (error) {
        console.error("Failed to initialize MediaPipe:", error);
      }
    };

    initializeMediaPipe();

    return () => {
      active = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isModelLoaded || !videoRef.current) return;

    let stream: MediaStream | null = null;

    const predictWebcam = () => {
      if (!videoRef.current || !landmarkerRef.current || videoRef.current.videoWidth === 0) {
        requestRef.current = requestAnimationFrame(predictWebcam);
        return;
      }
      
      const startTimeMs = performance.now();
      const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        
        setRawCoordinates({ x: indexTip.x, y: indexTip.y, z: indexTip.z });
        
        // Calculate distance between thumb and index tip
        const distance = Math.sqrt(
          Math.pow(indexTip.x - thumbTip.x, 2) +
          Math.pow(indexTip.y - thumbTip.y, 2) +
          Math.pow(indexTip.z - thumbTip.z, 2)
        );

        // Simple threshold logic - can be tuned
        if (distance < 0.05) {
          setCurrentIntent('pinch');
          setConfidence(Math.max(0, 1.0 - (distance / 0.05)));
          setPinchPosition({ x: (indexTip.x + thumbTip.x) / 2, y: (indexTip.y + thumbTip.y) / 2 });
        } else {
          setCurrentIntent('palm');
          setConfidence(0.8);
          setPinchPosition(null);
        }
      } else {
        setCurrentIntent('none');
        setConfidence(0);
        setRawCoordinates(null);
        setPinchPosition(null);
      }

      requestRef.current = requestAnimationFrame(predictWebcam);
    };

    const enableWebcam = async () => {
      try {
        useGestureStore.getState().setWebcamError("Starting camera...");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        useGestureStore.getState().setWebcamError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", () => {
             predictWebcam();
          });
        }
      } catch (error: any) {
        // Suppressing console.error to prevent Next.js Turbopack dev overlay from triggering
        useGestureStore.getState().setWebcamError("Camera access failed. Check permissions.");
      }
    };

    useGestureStore.getState().setRetryCamera(enableWebcam);

    enableWebcam();

    return () => {
      useGestureStore.getState().setRetryCamera(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isModelLoaded, setCurrentIntent, setConfidence, setRawCoordinates, setPinchPosition]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: 'none' }} // Hidden video element just for capturing
      />
      {children}
    </>
  );
}
