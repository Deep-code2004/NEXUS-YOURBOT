'use client';

import { useRef, useState } from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useSceneStore } from '@/store/useSceneStore';
import { UserCard } from '@/lib/db';

interface ModuleCardProps {
  card: UserCard;
  position: [number, number, number];
  rotation: [number, number, number];
}

export default function ModuleCard({ card, position, rotation }: ModuleCardProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const [hovered, setHovered] = useState(false);
  const { activeCardId, setActiveCardId } = useSceneStore();

  const isFocused = activeCardId === card.id;

  const { scale, opacity } = useSpring({
    scale: isFocused ? 1.4 : hovered ? 1.15 : 1,
    opacity: isFocused ? 1 : 0.75,
    config: { mass: 1, tension: 220, friction: 22 },
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    setActiveCardId(isFocused ? null : card.id);
  };

  const itemCount = card.items ? card.items.length : 0;
  const completedCount = card.items ? card.items.filter((i) => i.done).length : 0;

  return (
    <RigidBody
      ref={rigidBodyRef}
      type={isFocused ? 'dynamic' : 'kinematicPosition'}
      position={position}
      // @ts-ignore
      rotation={rotation}
      colliders="cuboid"
    >
      {/* @ts-ignore */}
      <a.group
        scale={scale}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {/* Core Card Body */}
        <RoundedBox args={[2.2, 3.2, 0.12]} radius={0.12} smoothness={4}>
          <meshStandardMaterial
            color="#050508"
            emissive={card.color}
            emissiveIntensity={isFocused ? 0.7 : hovered ? 0.35 : 0.12}
            metalness={0.9}
            roughness={0.2}
            transparent
            opacity={0.88}
          />
        </RoundedBox>

        {/* Outer Holographic Glow Edge */}
        <RoundedBox args={[2.26, 3.26, 0.06]} radius={0.14} smoothness={4}>
          <meshBasicMaterial
            color={card.color}
            transparent
            opacity={isFocused ? 0.5 : hovered ? 0.3 : 0.05}
          />
        </RoundedBox>

        {/* Card Title Text */}
        <Text
          position={[0, 0.4, 0.08]}
          fontSize={0.28}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.9}
          textAlign="center"
        >
          {card.title}
        </Text>

        {/* Card Data Item Count Badge */}
        <Text
          position={[0, -0.4, 0.08]}
          fontSize={0.15}
          color={card.color}
          anchorX="center"
          anchorY="middle"
        >
          {itemCount === 0 ? 'NO DATA' : `${completedCount}/${itemCount} DONE`}
        </Text>

        {/* Interaction Hint */}
        <Text
          position={[0, -0.9, 0.08]}
          fontSize={0.11}
          color="#888888"
          anchorX="center"
          anchorY="middle"
        >
          {hovered || isFocused ? 'CLICK TO INSPECT' : 'SPATIAL CARD'}
        </Text>
      </a.group>
    </RigidBody>
  );
}
