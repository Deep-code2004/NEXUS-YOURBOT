'use client';

import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import Carousel from './Carousel';
import { useSceneStore } from '@/store/useSceneStore';
import { Suspense, useEffect, useState } from 'react';

export default function Scene() {
  const { qualityTier } = useSceneStore();
  const [cameraConfig, setCameraConfig] = useState<{
    position: [number, number, number];
    fov: number;
  }>({
    position: [0, 0, 10],
    fov: 50,
  });

  // Dynamically calculate responsive camera position and FOV based on aspect ratio
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;

      if (width < 640 || aspect < 0.75) {
        // Mobile portrait: pull camera back and widen FOV so 3D carousel fits perfectly
        setCameraConfig({ position: [0, 0, 14], fov: 60 });
      } else if (width < 1024 || aspect < 1.2) {
        // Tablet / small laptop
        setCameraConfig({ position: [0, 0, 12], fov: 55 });
      } else {
        // Desktop / widescreen
        setCameraConfig({ position: [0, 0, 10], fov: 50 });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-screen absolute inset-0 z-0 bg-background overflow-hidden select-none touch-none">
      <Canvas
        camera={{ position: cameraConfig.position, fov: cameraConfig.fov }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#050505']} />

        {/* Dynamic Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <spotLight position={[-10, -10, -5]} intensity={1.2} color="#00c8ff" />

        {/* Subtle Atmospheric Effects */}
        {qualityTier === 'high' && (
          <fog attach="fog" args={['#050505', 8, 35]} />
        )}

        <Suspense fallback={null}>
          <Physics gravity={[0, -5, 0]}>
            <Carousel />
          </Physics>
        </Suspense>

        {/* Postprocessing Optimized for Mobile / Desktop */}
        <EffectComposer>
          {qualityTier === 'high' && (
            <Bloom
              luminanceThreshold={0.25}
              luminanceSmoothing={0.9}
              height={250}
              opacity={0.5}
            />
          )}
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
