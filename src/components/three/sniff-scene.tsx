import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { LINKS, STARS } from "@/lib/scent";
import { palette } from "@/lib/palette";

function hashRand(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Sky({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const lineGeo = useMemo(() => {
    const by = new Map(STARS.map((s) => [s.symbol, s]));
    const pos = new Float32Array(LINKS.length * 6);
    let o = 0;
    for (const [a, b] of LINKS) {
      const A = by.get(a);
      const B = by.get(b);
      if (!A || !B) continue;
      pos[o++] = A.pos[0];
      pos[o++] = A.pos[1];
      pos[o++] = A.pos[2];
      pos[o++] = B.pos[0];
      pos[o++] = B.pos[1];
      pos[o++] = B.pos[2];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos.subarray(0, o), 3));
    return g;
  }, []);
  const dust = useMemo(() => {
    const rand = hashRand(7);
    const arr = new Float32Array(420 * 3);
    for (let i = 0; i < 420; i++) {
      const r = 2.4 + rand() * 4.2;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
      arr[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.66;
      arr[i * 3 + 2] = r * Math.cos(ph);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      lineGeo.dispose();
      dust.dispose();
    };
  }, [dust, lineGeo]);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05);
    const p = progressRef.current;
    if (group.current) {
      group.current.rotation.y += d * 0.08;
      const tx = pointer.current.x * 0.18;
      const ty = pointer.current.y * 0.1;
      group.current.rotation.x += (ty - group.current.rotation.x) * 0.04;
      group.current.rotation.z += (tx * 0.3 - group.current.rotation.z) * 0.04;
      const s = 0.92 + p * 0.28;
      group.current.scale.setScalar(s);
    }
    if (core.current) core.current.scale.setScalar(0.22 + p * 0.85);
    state.camera.position.set(pointer.current.x * 0.45, 0.2 + pointer.current.y * 0.22, 9.4 - p * 1.7);
    state.camera.lookAt(0, 0.15, 0);
  });

  const live = STARS.filter((s) => s.status !== "filtered");

  return (
    <group ref={group}>
      <points geometry={dust}>
        <pointsMaterial color={palette.ember} size={0.025} transparent opacity={0.55} depthWrite={false} sizeAttenuation />
      </points>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color={palette.brand} transparent opacity={0.75} />
      </lineSegments>
      {live.map((s) => (
        <mesh key={s.symbol} position={s.pos}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshBasicMaterial color={s.sector === "canis" ? palette.ember : palette.brand} />
        </mesh>
      ))}
      <mesh ref={core}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={palette.brand} wireframe />
      </mesh>
    </group>
  );
}

export function SniffScene({ progressRef }: { progressRef: MutableRefObject<number> }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.2, 9.4], fov: 48 }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Sky progressRef={progressRef} />
    </Canvas>
  );
}
