import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Sparkles, Stars } from "@react-three/drei";

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-70">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Stars radius={50} depth={30} count={1200} factor={3} saturation={0} fade speed={0.5} />
          <Sparkles count={80} scale={14} size={1.5} speed={0.25} color="#a78bfa" />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default AmbientBackground;
