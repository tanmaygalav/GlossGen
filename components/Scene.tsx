import * as React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

function Dodecahedron() {
  const meshRef = React.useRef<Mesh>(null!);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.001;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <dodecahedronGeometry args={[1.5, 0]} />
      <meshBasicMaterial color="#1a1a1a" wireframe={true} />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      <Dodecahedron />
    </Canvas>
  );
}