import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Mesh, Color, PointLight } from 'three';

// Reusable geometries
const geometries = [
    <icosahedronGeometry args={[1, 0]} key="icosa" />,
    <torusKnotGeometry args={[0.8, 0.25, 100, 16]} key="knot" />,
    <torusGeometry args={[1, 0.1, 16, 100]} key="torus" />,
    <dodecahedronGeometry args={[1.2, 0]} key="dodeca" />,
];

// A single floating shape
function Shape({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null!);
  const { viewport } = useThree();

  const [randomFactors] = useState(() => ({
    x: (Math.random() - 0.5) * 0.5,
    y: (Math.random() - 0.5) * 0.5,
    speed: 0.1 + Math.random() * 0.2,
  }));
  const geometry = useMemo(() => geometries[Math.floor(Math.random() * geometries.length)], []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * randomFactors.x;
      meshRef.current.rotation.y += delta * randomFactors.y;
      
      // Gentle floating motion
      meshRef.current.position.y += Math.sin(Date.now() * 0.0001 * randomFactors.speed) * delta * 0.5;
      
      // Wrap around viewport
      const worldPos = meshRef.current.position;
      if (worldPos.y > viewport.height / 1.5) {
          worldPos.y = -viewport.height / 1.5;
      }
    }
  });
  
  return (
    <mesh ref={meshRef} position={position}>
      {geometry}
      <meshStandardMaterial 
        color={new Color('#1a1a1a')}
        metalness={0.9}
        roughness={0.1}
        wireframe={true}
      />
    </mesh>
  );
}

// Component containing the scene's contents and hooks
function SceneContent() {
    const shapes = useMemo(() => 
        Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            position: [
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12 - 6,
            ] as [number, number, number],
        })), []);

    const light1 = useRef<PointLight>(null!);
    const light2 = useRef<PointLight>(null!);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (light1.current) {
            light1.current.position.x = Math.sin(t * 0.5) * 6;
            light1.current.position.y = Math.cos(t * 0.7) * 6;
            light1.current.position.z = Math.cos(t * 0.3) * 6 - 5;
        }
        if (light2.current) {
            light2.current.position.x = Math.cos(t * 0.3) * -6;
            light2.current.position.y = Math.sin(t * 0.5) * -6;
            light2.current.position.z = Math.sin(t * 0.7) * 6 - 5;
        }
    });

    return (
        <>
            <ambientLight intensity={0.2} />
            <pointLight ref={light1} color="#FF5E0A" intensity={80} distance={12} />
            <pointLight ref={light2} color="#007BFF" intensity={80} distance={12} />
            
            {shapes.map(shape => (
                <Shape key={shape.id} position={shape.position} />
            ))}
        </>
    );
}

// The main scene component, now just responsible for the Canvas
export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <SceneContent />
    </Canvas>
  );
}