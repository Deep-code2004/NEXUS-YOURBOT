'use client';

import { useRef, useState } from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useGestureStore } from '@/store/useGestureStore';
import { useSceneStore, ModuleType } from '@/store/useSceneStore';
import * as THREE from 'three';

interface ModuleCardProps {
  module: { id: ModuleType; title: string; color: string };
  position: [number, number, number];
  rotation: [number, number, number];
}

export default function ModuleCard({ module, position, rotation }: ModuleCardProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const [hovered, setHovered] = useState(false);
  const { currentIntent } = useGestureStore();
  const { activeModule, setActiveModule } = useSceneStore();

  const isFocused = activeModule === module.id;

  const { scale, opacity } = useSpring({
    scale: isFocused ? 1.5 : hovered ? 1.1 : 1,
    opacity: isFocused ? 1 : 0.7,
    config: { mass: 1, tension: 200, friction: 20 },
  });

  const handlePointerOver = () => setHovered(true);
  const handlePointerOut = () => setHovered(false);
  const handleClick = () => {
    setActiveModule(isFocused ? 'none' : module.id);
  };

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
      <a.group scale={scale} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onClick={handleClick}>
        <RoundedBox args={[2, 3, 0.1]} radius={0.1} smoothness={4}>
          <meshStandardMaterial
            color="#050505"
            emissive={module.color}
            emissiveIntensity={isFocused ? 0.6 : 0.1}
            metalness={0.9}
            roughness={0.2}
            transparent
            opacity={0.8}
          />
        </RoundedBox>
        
        {/* Glow edge when hovered */}
        <RoundedBox args={[2.05, 3.05, 0.05]} radius={0.12} smoothness={4}>
          <meshBasicMaterial color={module.color} transparent opacity={hovered && !isFocused ? 0.3 : 0} />
        </RoundedBox>

        <Text
          position={[0, 0, 0.06]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {module.title}
        </Text>
      </a.group>
    </RigidBody>
  );
}
