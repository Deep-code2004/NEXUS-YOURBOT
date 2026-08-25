'use client';

import { useEffect, useRef, useState } from 'react';
import { useGestureStore } from '@/store/useGestureStore';
import {
  Hand,
  Maximize2,
  Minimize2,
  HelpCircle,
  Zap,
  CheckCircle,
  X,
  Compass,
} from 'lucide-react';

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],// Ring
  [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [5, 9], [9, 13], [13, 17],            // Palm knuckle connections
];

export default function HandVisualizerHUD({
  videoRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [minimized, setMinimized] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });

  const {
    currentIntent,
    confidence,
    rawCoordinates,
    isPinching,
    handLandmarks,
    handPresent,
    cameraActive,
    webcamError,
    fps,
    steerIntensity,
    showCameraHUD,
    setShowCameraHUD,
  } = useGestureStore();

  // Smooth lerp spatial cursor tracking
  useEffect(() => {
    if (!rawCoordinates || !handPresent) return;
    const targetX = rawCoordinates.x * window.innerWidth;
    const targetY = rawCoordinates.y * window.innerHeight;

    setCursorPos((prev) => ({
      x: prev.x + (targetX - prev.x) * 0.45,
      y: prev.y + (targetY - prev.y) * 0.45,
    }));
  }, [rawCoordinates, handPresent]);

  // Render 2D Canvas Hand Skeleton & Visuals
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!handLandmarks || handLandmarks.length === 0 || !handPresent) {
      // Idle scanning grid effect
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < width; i += 20) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
      }
      for (let j = 0; j < height; j += 20) {
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
      }
      ctx.stroke();
      return;
    }

    // Mirrored landmark positions mapped to canvas space
    const points = handLandmarks.map((lm) => ({
      x: (1.0 - lm.x) * width,
      y: lm.y * height,
    }));

    // Draw Cybernetic Hand Skeleton Connections
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (const [startIdx, endIdx] of CONNECTIONS) {
      const p1 = points[startIdx];
      const p2 = points[endIdx];

      const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      if (isPinching) {
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(1, '#00e5ff');
      } else if (currentIntent === 'fist') {
        grad.addColorStop(0, '#f43f5e');
        grad.addColorStop(1, '#fb923c');
      } else {
        grad.addColorStop(0, 'rgba(0, 229, 255, 0.9)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.8)');
      }

      ctx.strokeStyle = grad;
      ctx.shadowColor = isPinching ? '#10b981' : '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Draw Joint Nodes
    ctx.shadowBlur = 6;
    points.forEach((pt, index) => {
      ctx.beginPath();
      if (index === 4 || index === 8) {
        // Thumb and Index Fingertips
        ctx.arc(pt.x, pt.y, isPinching ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isPinching ? '#10b981' : '#00e5ff';
        ctx.shadowColor = isPinching ? '#10b981' : '#00e5ff';
      } else if (index === 0) {
        // Wrist
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#a855f7';
      } else {
        ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00e5ff';
      }
      ctx.fill();
    });

    // Draw Laser Arc between Thumb and Index when Pinching or Close
    const thumbPt = points[4];
    const indexPt = points[8];
    ctx.beginPath();
    ctx.moveTo(thumbPt.x, thumbPt.y);
    ctx.lineTo(indexPt.x, indexPt.y);
    ctx.lineWidth = isPinching ? 3 : 1;
    ctx.strokeStyle = isPinching ? '#10b981' : 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash(isPinching ? [] : [4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [handLandmarks, handPresent, isPinching, currentIntent]);

  if (!showCameraHUD) return null;

  return (
    <>
      {/* 1. Spatial Laser HUD Reticle / Hand Cursor */}
      {handPresent && cursorPos.x > 0 && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 select-none"
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
          }}
        >
          {/* Cybernetic Reticle Ring */}
          <div
            className={`relative flex items-center justify-center rounded-full transition-all duration-150 ${
              isPinching
                ? 'w-16 h-16 border-2 border-emerald-400 bg-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.7)] scale-90'
                : 'w-12 h-12 border border-cyan-400/80 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,229,255,0.4)] animate-pulse'
            }`}
          >
            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-cyan-400/40" />
            <div className="absolute h-full w-[1px] bg-cyan-400/40" />

            {/* Center Core Dot */}
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isPinching ? 'bg-emerald-300 scale-125' : 'bg-cyan-300'
              }`}
            />

            {/* Pinch Expansion Shockwave */}
            {isPinching && (
              <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-60" />
            )}

            {/* Gesture Action Pill above cursor */}
            <div className="absolute -top-6 whitespace-nowrap bg-black/80 backdrop-blur-md border border-white/20 text-[9px] font-mono px-2 py-0.5 rounded-full text-white/90 shadow">
              {currentIntent !== 'none' ? currentIntent.toUpperCase() : 'SPATIAL POINT'}
            </div>
          </div>
        </div>
      )}

      {/* 2. Holographic Hand Camera HUD (Bottom-Right PIP) */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 font-mono select-none">
        {/* Help / Gesture Cheat Sheet Overlay Modal */}
        {showHelp && (
          <div className="bg-[#09090f]/95 border border-cyan-500/30 rounded-2xl p-4 w-72 shadow-2xl backdrop-blur-xl text-white text-xs mb-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                <Hand className="w-4 h-4" /> HAND GESTURE MATRIX
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 py-3 text-[11px]">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">🤏 PINCH:</span>
                <span className="text-white/70">Select, click, & inspect spatial cards</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">✊ FIST:</span>
                <span className="text-white/70">Close inspector modal & dismiss card</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">🖐️ AIR STEER:</span>
                <span className="text-white/70">Move hand left/right to glide 3D carousel</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">💨 SWIPE:</span>
                <span className="text-white/70">Flick hand left or right for swift turn</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400 font-bold shrink-0">✋ OPEN PALM:</span>
                <span className="text-white/70">Stabilize and hold carousel position</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-[9px] text-white/40 text-center">
              Powered by MediaPipe Spatial Neural Engine
            </div>
          </div>
        )}

        {/* Main Holographic Camera Box */}
        <div
          className={`relative bg-[#06060c]/90 border border-white/15 rounded-2xl overflow-hidden backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-300 ${
            minimized ? 'w-48 h-12' : 'w-56 sm:w-64 h-44 sm:h-48'
          }`}
        >
          {/* Top Control Bar */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 py-1.5 bg-black/60 backdrop-blur-md border-b border-white/10 text-[10px] text-white/70">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  handPresent
                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]'
                    : cameraActive
                    ? 'bg-amber-400'
                    : 'bg-red-400'
                }`}
              />
              <span className="font-bold tracking-wider text-white">
                {handPresent ? 'HAND LOCKED' : cameraActive ? 'SCANNING...' : 'CAM OFFLINE'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHelp(!showHelp)}
                title="Gesture Guide"
                className="p-1 hover:text-cyan-300 text-white/50 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMinimized(!minimized)}
                title={minimized ? 'Expand HUD' : 'Minimize HUD'}
                className="p-1 hover:text-white text-white/50 transition-colors cursor-pointer"
              >
                {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Canvas Overlay for Hand Skeleton */}
              <canvas
                ref={canvasRef}
                width={256}
                height={192}
                className="absolute inset-0 w-full h-full object-cover z-10"
              />

              {/* Cyberpunk Scanlines */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.6)_100%)] z-15" />

              {/* Bottom Telemetry Overlay */}
              <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-2.5 py-1 bg-black/70 backdrop-blur-sm border-t border-white/10 text-[9px]">
                <div className="flex items-center gap-1 text-cyan-400">
                  <Zap className="w-3 h-3" />
                  <span className="font-bold uppercase">{currentIntent}</span>
                </div>

                <div className="flex items-center gap-2 text-white/40">
                  {steerIntensity !== 0 && (
                    <span className="text-amber-300">
                      STEER: {steerIntensity > 0 ? `+${(steerIntensity * 100).toFixed(0)}%` : `${(steerIntensity * 100).toFixed(0)}%`}
                    </span>
                  )}
                  <span>{fps} FPS</span>
                </div>
              </div>
            </>
          )}

          {minimized && (
            <div className="flex items-center justify-between px-3 h-full pt-4 text-[10px] text-white/70">
              <span className="text-cyan-400 font-bold uppercase">{currentIntent}</span>
              <span className="text-white/40">{fps} FPS</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
