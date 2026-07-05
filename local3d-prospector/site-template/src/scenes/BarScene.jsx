// Scena 3D parametrica "interno locale": la camera attraversa la sala mentre scrolli.
// Geometria procedurale, low-poly, luci emissive — nessun asset pesante, gira su mobile.
// I colori arrivano dai design tokens (theme.palette): un solo codice, N atmosfere.
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollRef } from '../lib/scroll.js';

function hex(c, fallback) {
  try { return new THREE.Color(c || fallback); } catch { return new THREE.Color(fallback); }
}

// Camera che "entra" nel locale in base allo scroll.
function CameraRig() {
  const scroll = useScrollRef();
  useFrame(({ camera }) => {
    const p = scroll.current;
    // dolly in avanti + leggero abbassamento, con easing
    const z = 9 - p * 15;
    const y = 1.6 - p * 0.4;
    camera.position.lerp(new THREE.Vector3(Math.sin(p * 0.6) * 0.8, y, z), 0.08);
    camera.lookAt(0, 1.2 - p * 0.3, -6);
  });
  return null;
}

function Bottles({ palette, count = 42 }) {
  const ref = useRef();
  const scroll = useScrollRef();
  const primary = hex(palette.primary, '#e08a3c');
  const accent = hex(palette.accent, '#f2c879');

  const data = useMemo(() => {
    const arr = [];
    const shelves = [2.4, 2.9, 3.4];
    for (let i = 0; i < count; i++) {
      const shelf = shelves[i % shelves.length];
      const x = -5 + ((i * 0.28) % 10);
      arr.push({ x, y: shelf, z: -6.2, h: 0.5 + ((i * 7) % 5) * 0.06, phase: (i % 10) * 0.6 });
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const glow = 0.4 + scroll.current * 1.6;
    const m = new THREE.Matrix4();
    data.forEach((b, i) => {
      const bob = Math.sin(t * 0.8 + b.phase) * 0.02;
      m.makeTranslation(b.x, b.y + bob, b.z);
      m.scale(new THREE.Vector3(1, b.h * 2, 1));
      ref.current.setMatrixAt(i, m);
      ref.current.setColorAt(i, (i % 2 ? accent : primary).clone().multiplyScalar(glow));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <cylinderGeometry args={[0.06, 0.08, 0.5, 8]} />
      <meshStandardMaterial roughness={0.25} metalness={0.1} emissiveIntensity={0.6} emissive={primary} toneMapped={false} />
    </instancedMesh>
  );
}

function PendantLights({ palette }) {
  const accent = hex(palette.accent, '#f2c879');
  const positions = [-3, 0, 3];
  return positions.map((x, i) => (
    <group key={i} position={[x, 3.2, -3 + i * 0.2]}>
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial emissive={accent} emissiveIntensity={2.2} color={accent} toneMapped={false} />
      </mesh>
      <pointLight color={accent} intensity={8} distance={9} decay={2} />
    </group>
  ));
}

function Room({ palette }) {
  const bg = hex(palette.bg, '#140f0a');
  const surface = hex(palette.surface, '#221913');
  const primary = hex(palette.primary, '#e08a3c');
  return (
    <group>
      {/* pavimento */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3]}>
        <planeGeometry args={[24, 30]} />
        <meshStandardMaterial color={surface} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* parete di fondo */}
      <mesh position={[0, 3, -6.6]}>
        <planeGeometry args={[24, 8]} />
        <meshStandardMaterial color={bg} roughness={0.9} />
      </mesh>
      {/* mensole */}
      {[2.2, 2.7, 3.2].map((y, i) => (
        <mesh key={i} position={[0, y, -6.4]}>
          <boxGeometry args={[11, 0.06, 0.3]} />
          <meshStandardMaterial color={surface} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      {/* bancone */}
      <mesh position={[0, 1, -2]}>
        <boxGeometry args={[9, 1.1, 1.2]} />
        <meshStandardMaterial color={surface} roughness={0.35} metalness={0.35} />
      </mesh>
      <mesh position={[0, 1.58, -2]}>
        <boxGeometry args={[9.2, 0.08, 1.4]} />
        <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.35} roughness={0.2} metalness={0.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Pulviscolo/atmosfera: punti che fluttuano, densità in base a fx.
function Motes({ palette, count = 120 }) {
  const ref = useRef();
  const accent = hex(palette.accent, '#f2c879');
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 16;
      a[i * 3 + 1] = Math.random() * 5;
      a[i * 3 + 2] = -8 + Math.random() * 12;
    }
    return a;
  }, [count]);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.02;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color={accent} transparent opacity={0.5} sizeAttenuation toneMapped={false} />
    </points>
  );
}

export default function BarScene({ theme, level }) {
  const palette = theme?.palette || {};
  const moteCount = level === 'high' ? 160 : level === 'medium' ? 80 : 30;
  const bottleCount = level === 'high' ? 48 : level === 'medium' ? 30 : 18;
  return (
    <>
      <color attach="background" args={[hex(palette.bg, '#0a0a0f')]} />
      <fog attach="fog" args={[hex(palette.bg, '#0a0a0f'), 6, 22]} />
      <ambientLight intensity={0.25} />
      <CameraRig />
      <Room palette={palette} />
      <Bottles palette={palette} count={bottleCount} />
      <PendantLights palette={palette} />
      {level !== 'low' && <Motes palette={palette} count={moteCount} />}
    </>
  );
}
