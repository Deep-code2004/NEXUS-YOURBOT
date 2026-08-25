'use client';

import { useRef, useState, useEffect } from 'react';
import { Group } from 'three';
import { useSpring, a } from '@react-spring/three';
import ModuleCard from './ModuleCard';
import { useGestureStore } from '@/store/useGestureStore';
import { useSceneStore } from '@/store/useSceneStore';
import { useAIStore } from '@/store/useAIStore';

export default function Carousel() {
  const groupRef = useRef<Group>(null);
  const { currentIntent, steerIntensity } = useGestureStore();
  const { cards, setCards, activeCardId, setActiveCardId, centeredCardIndex, setCenteredCardIndex, nextCard, prevCard } = useSceneStore();
  const { user } = useAIStore();

  const [dragOffsetAngle, setDragOffsetAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previousX, setPreviousX] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const lastSteerStepRef = useRef<number>(0);

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

  // Synchronize centeredCardIndex when an activeCardId is selected
  useEffect(() => {
    if (activeCardId && cards.length > 0) {
      const index = cards.findIndex((c) => c.id === activeCardId);
      if (index !== -1 && index !== centeredCardIndex) {
        setCenteredCardIndex(index);
      }
    }
  }, [activeCardId, cards, centeredCardIndex, setCenteredCardIndex]);

  // Air Steering Rhythmic Stepper: Moves exactly 1 card with a comfortable interval
  useEffect(() => {
    if (cards.length <= 1) return;
    const now = Date.now();

    if (Math.abs(steerIntensity) > 0.45 && now - lastSteerStepRef.current > 600) {
      lastSteerStepRef.current = now;
      if (steerIntensity > 0) {
        nextCard();
      } else {
        prevCard();
      }
    }
  }, [steerIntensity, cards.length, nextCard, prevCard]);

  // Keyboard arrow navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') {
        nextCard();
      } else if (e.key === 'ArrowLeft') {
        prevCard();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (cards.length > 0 && !activeCardId) {
          setActiveCardId(cards[centeredCardIndex].id);
        }
      } else if (e.key === 'Escape') {
        if (activeCardId) {
          setActiveCardId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, prevCard, cards, centeredCardIndex, activeCardId, setActiveCardId]);

  // Calculate base angle for centered card
  const angleStep = cards.length > 0 ? (Math.PI * 2) / cards.length : 0;
  const baseTargetAngle = -centeredCardIndex * angleStep;
  const currentTotalAngle = baseTargetAngle + dragOffsetAngle;

  const { rotation } = useSpring({
    rotation: [0, currentTotalAngle, 0],
    config: { mass: 1.2, tension: 200, friction: 24 },
  });

  const radius = Math.max(isMobile ? 4.5 : 5.5, cards.length * (isMobile ? 0.9 : 1.1));

  return (
    // @ts-ignore
    <a.group ref={groupRef} rotation={rotation}>
      {/* 3D Drag Plane for Mouse / Touch interaction */}
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
            setDragOffsetAngle((prev) => prev + delta * (isMobile ? 0.009 : 0.006));
            setPreviousX(clientX);
          }
        }}
        onPointerUp={() => {
          if (isDragging) {
            setIsDragging(false);
            if (cards.length > 0) {
              // Magnetically snap to the nearest exact card index
              const approxShift = -dragOffsetAngle / angleStep;
              const roundedShift = Math.round(approxShift);
              const newIndex = ((centeredCardIndex + roundedShift) % cards.length + cards.length) % cards.length;
              setCenteredCardIndex(newIndex);
              setDragOffsetAngle(0);
            }
          }
        }}
        onPointerOut={() => {
          if (isDragging) {
            setIsDragging(false);
            if (cards.length > 0) {
              const approxShift = -dragOffsetAngle / angleStep;
              const roundedShift = Math.round(approxShift);
              const newIndex = ((centeredCardIndex + roundedShift) % cards.length + cards.length) % cards.length;
              setCenteredCardIndex(newIndex);
              setDragOffsetAngle(0);
            }
          }
        }}
      >
        <sphereGeometry args={[25, 16, 16]} />
        <meshBasicMaterial side={2} /> {/* THREE.BackSide */}
      </mesh>

      {cards.map((card, index) => {
        const angle = (index / Math.max(1, cards.length)) * Math.PI * 2;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const isCentered = index === centeredCardIndex;

        return (
          <ModuleCard
            key={card.id}
            card={card}
            position={[x, 0, z]}
            rotation={[0, angle, 0]}
            isCentered={isCentered}
          />
        );
      })}
    </a.group>
  );
}
