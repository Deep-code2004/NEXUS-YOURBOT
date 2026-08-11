'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useSpring, a } from '@react-spring/three';
import ModuleCard from './ModuleCard';
import { useGestureStore } from '@/store/useGestureStore';
import { ModuleType } from '@/store/useSceneStore';

const MODULES: { id: ModuleType; title: string; color: string }[] = [
  { id: 'instagram', title: 'Social', color: '#E1306C' },
  { id: 'stocks', title: 'Market', color: '#00C805' },
  { id: 'projects', title: 'Projects', color: '#4A90E2' },
  { id: 'sports', title: 'Sports', color: '#FF8C00' },
  { id: 'weather', title: 'Weather', color: '#00BFFF' },
  { id: 'news', title: 'News', color: '#FF4500' },
  { id: 'calendar', title: 'Calendar', color: '#9370DB' },
  { id: 'music', title: 'Music', color: '#1DB954' },
  { id: 'system', title: 'System', color: '#A9A9A9' },
  { id: 'ai', title: 'NEXUS AI', color: '#FFD700' },
];

export default function Carousel() {
  const groupRef = useRef<Group>(null);
  const [targetRotation, setTargetRotation] = useState(0);
  const { currentIntent } = useGestureStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [previousX, setPreviousX] = useState(0);

  // Simple gesture to rotation mapping
  useFrame(() => {
    if (currentIntent === 'swipe_left') {
      setTargetRotation((prev) => prev - 0.05);
    } else if (currentIntent === 'swipe_right') {
      setTargetRotation((prev) => prev + 0.05);
    }
  });

  const { rotation } = useSpring({
    rotation: [0, targetRotation, 0],
    config: { mass: 2, tension: 170, friction: 26 },
  });

  const radius = 6;

  return (
    // @ts-ignore
    <a.group ref={groupRef} rotation={rotation}>
      {/* Invisible sphere to catch pointer events for dragging */}
      <mesh
        visible={false}
        onPointerDown={(e) => {
          e.stopPropagation();
          setIsDragging(true);
          setPreviousX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (isDragging) {
            e.stopPropagation();
            const delta = e.clientX - previousX;
            setTargetRotation((prev) => prev + delta * 0.01);
            setPreviousX(e.clientX);
          }
        }}
        onPointerUp={() => setIsDragging(false)}
        onPointerOut={() => setIsDragging(false)}
      >
        <sphereGeometry args={[15, 16, 16]} />
        <meshBasicMaterial side={2} /> {/* THREE.BackSide */}
      </mesh>

      {MODULES.map((mod, index) => {
        const angle = (index / MODULES.length) * Math.PI * 2;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        return (
          <ModuleCard
            key={mod.id}
            module={mod}
            position={[x, 0, z]}
            rotation={[0, angle, 0]}
          />
        );
      })}
    </a.group>
  );
}
