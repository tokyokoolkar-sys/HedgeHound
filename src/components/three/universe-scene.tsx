import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { LINKS, type Focus, type Row, type Sector } from "@/lib/scent";
import { palette } from "@/lib/palette";

function tone(row: Row) {
  if (row.status === "filtered") return palette.faint;
  if (row.alert) return palette.brand;
  if (row.status === "ok" && row.persistence < 0.5 && row.grossApr > 40) return palette.clay;
  if (row.status === "building history") return palette.cream;
  return palette.ember;
}

function StarNode({
  row,
  selected,
  still,
  onPick,
}: {
  row: Row;
  selected: boolean;
  still: boolean;
  onPick: (symbol: string) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const pulse = !still && row.alert ? 1 + Math.sin(state.clock.elapsedTime * 3 + row.pos[0]) * 0.14 : 1;
    const s = (selected ? 1.85 : 1) * pulse * (row.status === "filtered" ? 0.65 : 1);
    ref.current.scale.setScalar(s);
  });
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onPick(row.symbol);
  };
  return (
    <group position={row.pos}>
      <mesh
        ref={ref}
        onClick={click}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color={selected ? palette.cream : tone(row)} />
      </mesh>
      <mesh onClick={click}>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function LinePieces({ rows, focus }: { rows: Row[]; focus: Focus }) {
  const groups = useMemo(() => {
    const by = new Map(rows.map((r) => [r.symbol, r]));
    const sectors: Sector[] = ["canis", "hedge", "kennel"];
    return sectors.flatMap((sector) => {
      const symbols = new Set<string>();
      const coords: number[] = [];
      for (const [a, b] of LINKS) {
        const A = by.get(a);
        const B = by.get(b);
        if (!A || !B || A.sector !== sector) continue;
        symbols.add(a);
        symbols.add(b);
        coords.push(A.pos[0], A.pos[1], A.pos[2], B.pos[0], B.pos[1], B.pos[2]);
      }
      if (!coords.length) return [];
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(coords, 3));
      return [{ sector, geo, symbols }];
    });
  }, [rows]);

  useEffect(() => () => groups.forEach((g) => g.geo.dispose()), [groups]);

  return (
    <>
      {groups.map((g) => {
        const lit =
          !focus ||
          (focus.type === "sector" && focus.sector === g.sector) ||
          (focus.type === "star" && g.symbols.has(focus.symbol));
        return (
          <lineSegments key={g.sector} geometry={g.geo}>
            <lineBasicMaterial color={palette.brand} transparent opacity={lit ? 0.9 : 0.16} depthWrite={false} />
          </lineSegments>
        );
      })}
    </>
  );
}

function Rig({ focus, rows, still }: { focus: Focus; rows: Row[]; still: boolean }) {
  const look = useRef(new THREE.Vector3(0, 0.15, 0));
  const desiredLook = useRef(new THREE.Vector3(0, 0.15, 0));
  const desired = useRef(new THREE.Vector3(0.15, 0.3, 8.6));
  const beam = useRef<THREE.Mesh>(null);
  const wide = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05);
    if (!still) {
      if (beam.current) beam.current.rotation.z -= d * 0.32;
      if (wide.current) wide.current.rotation.z -= d * 0.32;
    }
    let tx = 0;
    let ty = 0.12;
    let tz = 0;
    let dist = 8.6;
    if (focus?.type === "star") {
      const s = rows.find((r) => r.symbol === focus.symbol);
      if (s) {
        tx = s.pos[0];
        ty = s.pos[1];
        tz = s.pos[2];
        dist = 2.35;
      }
    } else if (focus?.type === "sector") {
      const mem = rows.filter((r) => r.sector === focus.sector);
      if (mem.length) {
        tx = mem.reduce((a, r) => a + r.pos[0], 0) / mem.length;
        ty = mem.reduce((a, r) => a + r.pos[1], 0) / mem.length;
        tz = mem.reduce((a, r) => a + r.pos[2], 0) / mem.length;
        dist = focus.sector === "embers" ? 5.2 : 4.1;
      }
    }
    const parallax = focus ? 0.08 : 0.62;
    desired.current.set(
      tx + state.pointer.x * parallax,
      ty + 0.22 + state.pointer.y * parallax * 0.55,
      tz + dist,
    );
    desiredLook.current.set(tx, ty, tz);
    const ease = 1 - Math.exp(-2.8 * d);
    state.camera.position.lerp(desired.current, ease);
    look.current.lerp(desiredLook.current, ease);
    state.camera.lookAt(look.current);
  });

  return (
    <group>
      <mesh ref={beam}>
        <planeGeometry args={[8.4, 0.028]} />
        <meshBasicMaterial color={palette.brand} transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <mesh ref={wide}>
        <planeGeometry args={[8.4, 0.22]} />
        <meshBasicMaterial color={palette.brand} transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function UniverseScene({
  rows,
  focus,
  still,
  onPick,
  onMiss,
}: {
  rows: Row[];
  focus: Focus;
  still: boolean;
  onPick: (symbol: string) => void;
  onMiss: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0.15, 0.35, 8.6], fov: 48 }}
      gl={{ alpha: true, antialias: true }}
      onPointerMissed={onMiss}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Rig focus={focus} rows={rows} still={still} />
      <LinePieces rows={rows} focus={focus} />
      {rows.map((row) => (
        <StarNode
          key={row.symbol}
          row={row}
          selected={focus?.type === "star" && focus.symbol === row.symbol}
          still={still}
          onPick={onPick}
        />
      ))}
    </Canvas>
  );
}
