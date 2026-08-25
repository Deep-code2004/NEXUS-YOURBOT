'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useSpring, a } from '@react-spring/three';
import ModuleCard from './ModuleCard';
import { useGestureStore } from '@/store/useGestureStore';
import { useSceneStore } from '@/store/useSceneStore';
import { useAIStore } from '@/store/useAIStore';

export default function Carousel() {
  const groupRef = useRef<Group>(null);
  const [targetRotation, setTargetRotation] = useState(0);
  const { currentIntent, steerIntensity, handVelocity, isPinching } = useGestureStore();
  const { cards, setCards, activeCardId } = useSceneStore();
  const { user } = useAIStore();

  const [isDragging, setIsDragging] = useState(false);
  const [previousX, setPreviousX] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch initial cards for authenticated user on mount or session change
  useEffect(() => {
    const fetchUserCards = async () => {
      try {
        const res = await fetch('/api/cards');
        if (res.ok) {
          const data = await res.json();
          if (data.cards) {
            setCards(data.cards);
          }
        }
      } catch (err) {
        console.error('Error fetching cards:', err);
      }
    };
    fetchUserCards();
  }, [user, setCards]);

  // Automatically rotate to the active card when selected by AI or click
  useEffect(() => {
    if (activeCardId && cards.length > 0) {
      const index = cards.findIndex((c) => c.id === activeCardId);
      if (index !== -1) {
        const angle = (index / cards.length) * Math.PI * 2;
        setTargetRotation(-angle);
      }
    }
  }, [activeCardId, cards]);

  // Real-time Gestural Carousel Physics & Steering Loop
  useFrame((_, delta) => {
    // 1. Continuous Spatial Air Steering
    if (Math.abs(steerIntensity) > 0.05) {
      // Rotate proportional to hand distance from center
      const speed = steerIntensity * (isMobile ? 1.8 : 2.4) * delta;
      setTargetRotation((prev) => prev + speed);
    }

    // 2. High-speed Swipe Impulses
    if (currentIntent === 'swipe_left') {
      const step = cards.length > 0 ? (Math.PI * 2) / cards.length : 0.8;
      setTargetRotation((prev) => prev - step * 0.4);
    } else if (currentIntent === 'swipe_right') {
      const step = cards.length > 0 ? (Math.PI * 2) / cards.length : 0.8;
      setTargetRotation((prev) => prev + step * 0.4);
    }
  });

  const { rotation } = useSpring({
    rotation: [0, targetRotation, 0],
    config: { mass: 1.5, tension: 180, friction: 28 },
  });

  const radius = Math.max(isMobile ? 4.5 : 5.5, cards.length * (isMobile ? 0.9 : 1.1));

  return (
    // @ts-ignore
    <a.group ref={groupRef} rotation={rotation}>
      {/* Catch mouse/touch dragging on 3D space */}
      <mesh
        visible={false}
        onPointerDown={(e) => {
          e.stopPropagation();
          setIsDragging(true);
          setPreviousX(e.clientX || (e as any).touches?.[0]?.clientX || 0);
        }}
        onPointerMove={(e) => {
          if (isDragging) {
            e.stopPropagation();
            const clientX = e.clientX || (e as any).touches?.[0]?.clientX || 0;
            const delta = clientX - previousX;
            setTargetRotation((prev) => prev + delta * (isMobile ? 0.012 : 0.008));
            setPreviousX(clientX);
          }
        }}
        onPointerUp={() => setIsDragging(false)}
        onPointerOut={() => setIsDragging(false)}
      >
        <sphereGeometry args={[25, 16, 16]} />
        <meshBasicMaterial side={2} /> {/* THREE.BackSide */}
      </mesh>

      {cards.map((card, index) => {
        const angle = (index / Math.max(1, cards.length)) * Math.PI * 2;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        return (
          <ModuleCard
            key={card.id}
            card={card}
            position={[x, 0, z]}
            rotation={[0, angle, 0]}
          />
        );
      })}
    </a.group>
  );
}
