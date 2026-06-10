import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function Knot() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.15;
    ref.current.rotation.y += dt * 0.25;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={ref} position={[0, 0, 0]} scale={1.35}>
        <torusKnotGeometry args={[1, 0.32, 220, 32]} />
        <MeshDistortMaterial
          color="#a78bfa"
          emissive="#7c3aed"
          emissiveIntensity={0.35}
          metalness={0.85}
          roughness={0.15}
          distort={0.35}
          speed={1.6}
        />
      </mesh>
    </Float>
  );
}

function Orb({
  position,
  color,
  scale = 0.55,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
}) {
  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={2}>
      <mesh position={position} scale={scale}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          metalness={0.6}
          roughness={0.2}
          distort={0.5}
          speed={2.2}
        />
      </mesh>
    </Float>
  );
}

export function HeroScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#c4b5fd" />
        <directionalLight position={[-5, -3, -2]} intensity={0.8} color="#67e8f9" />
        <Knot />
        <Orb position={[-2.6, 1.4, -1]} color="#67e8f9" scale={0.45} />
        <Orb position={[2.5, -1.3, -0.5]} color="#f0abfc" scale={0.55} />
        <Orb position={[2.2, 1.7, -2]} color="#a78bfa" scale={0.35} />
        <Sparkles count={60} scale={8} size={2} speed={0.4} color="#c4b5fd" />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}

export default HeroScene;
