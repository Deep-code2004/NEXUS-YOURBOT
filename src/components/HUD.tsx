'use client';

import { useGestureStore } from '@/store/useGestureStore';
import { useSceneStore } from '@/store/useSceneStore';
import { Activity, Camera, Layers, Box } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HUD() {
  const { currentIntent, confidence } = useGestureStore();
  const { activeModule, qualityTier } = useSceneStore();
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 text-foreground font-mono text-sm uppercase tracking-widest">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>NEXUS OS v1.0</span>
          </div>
          <div className="flex items-center gap-2 text-white/50">
            <Layers className="w-4 h-4" />
            <span>Q-Tier: {qualityTier}</span>
          </div>
        </div>
        
        <div className="text-right min-w-[120px]">
          <div>{mounted && time ? time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '---'}</div>
          <div className="text-2xl font-bold tracking-wider">{mounted && time ? time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex justify-between items-end">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-2 text-white/50">
            <Box className="w-4 h-4" />
            <span>SYS_LOG</span>
          </div>
          <div className="text-xs text-white/30 border-l border-white/10 pl-2">
            <div>&gt; initialize physics engine [OK]</div>
            <div>&gt; establish camera handoff [OK]</div>
            <div>&gt; module selected: {activeModule}</div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-right bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <span>Gesture Tracking</span>
          </div>
          
          {useGestureStore.getState().webcamError ? (
            <div className="text-red-400 text-xs mt-2 max-w-[200px] flex flex-col items-end gap-2">
              <span>{useGestureStore.getState().webcamError} (Using mouse fallback)</span>
              {useGestureStore.getState().retryCamera && (
                <button 
                  onClick={() => useGestureStore.getState().retryCamera!()}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded cursor-pointer pointer-events-auto"
                >
                  Retry Camera
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1 w-full mt-2 min-w-[150px]">
              <div className="flex justify-between text-xs text-white/50">
                <span>Intent</span>
                <span className={currentIntent !== 'none' ? 'text-emerald-400' : ''}>{currentIntent}</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-100"
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
