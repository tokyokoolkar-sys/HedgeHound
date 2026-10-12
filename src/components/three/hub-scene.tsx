import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { palette } from "@/lib/palette";

function Hub({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    const p = progressRef.current;
    if (group.current) {
      group.current.rotation.y += d * (0.25 + p * 0.35);
      group.current.rotation.x = -0.35 + pointer.current.y * 0.18 + p * 0.25;
      group.current.scale.setScalar(0.72 + p * 1.65);
      group.current.position.x = pointer.current.x * 0.2;
    }
    if (ring.current) ring.current.rotation.z += d * 0.15;
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshBasicMaterial color={palette.brand} wireframe />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.46, 28, 28]} />
        <meshBasicMaterial color={palette.bg} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.35, 0.2, 0]}>
        <torusGeometry args={[1.72, 0.012, 10, 80]} />
        <meshBasicMaterial color={palette.ember} />
      </mesh>
      <mesh rotation={[0.4, 0.6, 0]}>
        <torusGeometry args={[1.15, 0.008, 8, 64]} />
        <meshBasicMaterial color={palette.cream} transparent opacity={0.7} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.72, Math.sin(a * 1.3) * 0.28, Math.sin(a) * 1.72]}>
            <sphereGeometry args={[i === 0 ? 0.11 : 0.07, 14, 14]} />
            <meshBasicMaterial color={i % 2 === 0 ? palette.brand : palette.ember} />
          </mesh>
        );
      })}
    </group>
  );
}

export function HubScene({ progressRef }: { progressRef: MutableRefObject<number> }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.1, 4.6], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Hub progressRef={progressRef} />
    </Canvas>
  );
}
