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
  const { currentIntent } = useGestureStore();
  const { cards, setCards, activeCardId } = useSceneStore();
  const { user } = useAIStore();

  const [isDragging, setIsDragging] = useState(false);
  const [previousX, setPreviousX] = useState(0);

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

  // Simple gesture to rotation mapping
  useFrame(() => {
    if (currentIntent === 'swipe_left') {
      setTargetRotation((prev) => prev - 0.04);
    } else if (currentIntent === 'swipe_right') {
      setTargetRotation((prev) => prev + 0.04);
    }
  });

  const { rotation } = useSpring({
    rotation: [0, targetRotation, 0],
    config: { mass: 2, tension: 170, friction: 26 },
  });

  const radius = Math.max(5, cards.length * 1.1);

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
            setTargetRotation((prev) => prev + delta * 0.008);
            setPreviousX(e.clientX);
          }
        }}
        onPointerUp={() => setIsDragging(false)}
        onPointerOut={() => setIsDragging(false)}
      >
        <sphereGeometry args={[20, 16, 16]} />
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
