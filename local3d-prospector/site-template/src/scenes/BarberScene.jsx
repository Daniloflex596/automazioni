// Scena "barbiere": palo del barbiere che ruota, parete di specchi con lampadine, forbici e pettini
// che fluttuano lenti. Palette elegante. Camera che entra nel negozio scrollando.
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollRef } from '../lib/scroll.js';

function hex(c, f) { try { return new THREE.Color(c || f); } catch { return new THREE.Color(f); } }

function CameraRig() {
  const scroll = useScrollRef();
  useFrame(({ camera }) => {
    const p = scroll.current;
    camera.position.lerp(new THREE.Vector3(Math.sin(p * 0.6) * 1.0, 1.6 - p * 0.3, 8.5 - p * 13), 0.08);
    camera.lookAt(0, 1.4 - p * 0.2, -6);
  });
  return null;
}

// Palo del barbiere: cilindro con striscia elicoidale che ruota (illusione classica).
function BarberPole({ palette, position }) {
  const stripe = useRef();
  const primary = hex(palette.primary, '#c9a24b');
  useFrame(({ clock }) => { if (stripe.current) stripe.current.rotation.y = clock.getElapsedTime() * 1.2; });
  return (
    <group position={position}>
      <mesh><cylinderGeometry args={[0.16, 0.16, 1.8, 20]} /><meshStandardMaterial color={'#f4f2ee'} roughness={0.2} metalness={0.3} /></mesh>
      <group ref={stripe}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0.5]} position={[0, 0, 0]}>
            <torusGeometry args={[0.16, 0.03, 8, 24, Math.PI * 1.4]} />
            <meshStandardMaterial color={i === 0 ? '#d43b3b' : primary} emissive={i === 0 ? '#d43b3b' : primary} emissiveIntensity={0.4} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 1.05, 0]}><sphereGeometry args={[0.2, 16, 12]} /><meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.6} metalness={0.6} roughness={0.2} toneMapped={false} /></mesh>
      <mesh position={[0, -1.05, 0]}><sphereGeometry args={[0.2, 16, 12]} /><meshStandardMaterial color={primary} metalness={0.6} roughness={0.2} /></mesh>
      <pointLight color={primary} intensity={2} distance={4} />
    </group>
  );
}

// Parete-specchio con lampadine (vibe Hollywood).
function MirrorWall({ palette }) {
  const accent = hex(palette.accent, '#e9d9a8');
  const surface = hex(palette.surface, '#17171b');
  const bulbs = [];
  for (let x = -3; x <= 3; x += 1) { bulbs.push([x, 3.2]); bulbs.push([x, 0.6]); }
  for (let y = 0.9; y <= 2.9; y += 0.6) { bulbs.push([-3.4, y]); bulbs.push([3.4, y]); }
  return (
    <group position={[0, 1.9, -6.2]}>
      <mesh><planeGeometry args={[7, 3]} /><meshStandardMaterial color={surface} roughness={0.15} metalness={0.7} /></mesh>
      {bulbs.map(([x, y], i) => (
        <mesh key={i} position={[x, y - 1.9, 0.06]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.8} toneMapped={false} /></mesh>
      ))}
    </group>
  );
}

// Forbici/pettini che fluttuano (rappresentati stilizzati, low-poly).
function FloatingTools({ palette, count = 10 }) {
  const g = useRef();
  const primary = hex(palette.primary, '#c9a24b');
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({ x: -4 + (i * 0.9) % 8, y: 1 + (i % 3) * 0.8, z: -2 - (i % 4) * 0.7, ph: i * 0.6 })), [count]);
  useFrame(({ clock }) => {
    if (!g.current) return; const t = clock.getElapsedTime();
    g.current.children.forEach((m, i) => { const it = items[i]; m.position.y = it.y + Math.sin(t * 0.7 + it.ph) * 0.2; m.rotation.z = t * 0.4 + it.ph; });
  });
  return (
    <group ref={g}>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, it.y, it.z]}>
          {i % 2 ? <boxGeometry args={[0.05, 0.5, 0.02]} /> : <boxGeometry args={[0.4, 0.06, 0.02]} />}
          <meshStandardMaterial color={primary} metalness={0.8} roughness={0.2} emissive={primary} emissiveIntensity={0.2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Floor({ palette }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3]}>
      <planeGeometry args={[26, 30]} /><meshStandardMaterial color={hex(palette.bg, '#0c0c0e')} roughness={0.5} metalness={0.3} />
    </mesh>
  );
}

export default function BarberScene({ theme, level }) {
  const palette = theme?.palette || {};
  const tools = level === 'high' ? 12 : level === 'medium' ? 8 : 4;
  return (
    <>
      <color attach="background" args={[hex(palette.bg, '#0c0c0e')]} />
      <fog attach="fog" args={[hex(palette.bg, '#0c0c0e'), 7, 22]} />
      <ambientLight intensity={0.35} />
      <CameraRig />
      <Floor palette={palette} />
      <MirrorWall palette={palette} />
      <BarberPole palette={palette} position={[-3.8, 1.4, -4]} />
      <BarberPole palette={palette} position={[3.8, 1.4, -4]} />
      {level !== 'low' && <FloatingTools palette={palette} count={tools} />}
    </>
  );
}
