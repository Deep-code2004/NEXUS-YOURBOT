'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import Carousel from './Carousel';
import { useSceneStore } from '@/store/useSceneStore';
import { Suspense } from 'react';

export default function Scene() {
  const { qualityTier, cameraPosition } = useSceneStore();

  return (
    <div className="w-full h-screen absolute inset-0 z-0 bg-background">
      <Canvas camera={{ position: cameraPosition, fov: 50 }}>
        <color attach="background" args={['#050505']} />
        
        {/* Environment & Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <spotLight position={[-10, -10, -5]} intensity={1} color="#4a90e2" />
        
        {/* Subtle Atmospheric Effects */}
        {qualityTier === 'high' && (
          <fog attach="fog" args={['#050505', 10, 30]} />
        )}
        
        <Suspense fallback={null}>
          <Physics gravity={[0, -5, 0]}>
            <Carousel />
          </Physics>
        </Suspense>

        {/* Postprocessing */}
        <EffectComposer>
          {qualityTier === 'high' && (
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} opacity={0.6} />
          )}
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
