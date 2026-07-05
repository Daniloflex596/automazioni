// Scena "etnico" (cinese/giapponese/ramen/sushi): lanterne sospese che ondeggiano, vapore che sale
// dal bancone, insegna al neon. Palette neon. Camera che avanza tra le lanterne verso il bancone.
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollRef } from '../lib/scroll.js';

function hex(c, f) { try { return new THREE.Color(c || f); } catch { return new THREE.Color(f); } }

function CameraRig() {
  const scroll = useScrollRef();
  useFrame(({ camera }) => {
    const p = scroll.current;
    camera.position.lerp(new THREE.Vector3(Math.sin(p * 0.7) * 0.9, 1.7 - p * 0.4, 9 - p * 14), 0.08);
    camera.lookAt(0, 1.4 - p * 0.3, -6);
  });
  return null;
}

// Lanterne di carta sospese, luminose, che ondeggiano.
function Lanterns({ palette }) {
  const primary = hex(palette.primary, '#00e5ff');
  const accent = hex(palette.accent, '#ff2bd6');
  const refs = useRef([]);
  const items = useMemo(() => {
    const arr = [];
    const xs = [-4, -2.4, -0.8, 0.8, 2.4, 4];
    const rows = [-2, -4, -5.5];
    let k = 0;
    for (const z of rows) for (const x of xs) { arr.push({ x, y: 2.6 - (k % 2) * 0.3, z, phase: k * 0.7, color: k % 2 ? accent : primary }); k++; }
    return arr;
  }, [primary, accent]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((m, i) => { if (m) { const it = items[i]; m.position.y = it.y + Math.sin(t * 0.8 + it.phase) * 0.08; m.rotation.z = Math.sin(t * 0.5 + it.phase) * 0.12; } });
  });
  return items.map((it, i) => (
    <group key={i} position={[it.x, it.y, it.z]} ref={(el) => (refs.current[i] = el)}>
      <mesh>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshStandardMaterial color={it.color} emissive={it.color} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {/* cordino */}
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.008, 0.008, 1, 6]} /><meshStandardMaterial color={'#000'} /></mesh>
      <pointLight color={it.color} intensity={2.2} distance={4.5} decay={2} />
    </group>
  ));
}

// Vapore che sale dalle ciotole sul bancone.
function Steam({ palette, count = 90 }) {
  const ref = useRef();
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const seeds = useMemo(() => Array.from({ length: count }, () => ({ x: -2.5 + Math.random() * 5, z: -4.4 + Math.random() * 0.8, sp: 0.3 + Math.random() * 0.5, off: Math.random() * 4 })), [count]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    seeds.forEach((s, i) => { const y = (t * s.sp + s.off) % 2.5; positions[i * 3] = s.x + Math.sin(t + s.off) * 0.15; positions[i * 3 + 1] = 1.5 + y; positions[i * 3 + 2] = s.z; });
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={0.09} color={'#ffffff'} transparent opacity={0.22} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Counter({ palette }) {
  const surface = hex(palette.surface, '#101426');
  const primary = hex(palette.primary, '#00e5ff');
  const accent = hex(palette.accent, '#ff2bd6');
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3]}>
        <planeGeometry args={[26, 30]} /><meshStandardMaterial color={hex(palette.bg, '#05060d')} roughness={0.8} />
      </mesh>
      {/* bancone */}
      <mesh position={[0, 0.95, -4]}><boxGeometry args={[8, 1.1, 1.4]} /><meshStandardMaterial color={surface} roughness={0.35} metalness={0.5} /></mesh>
      <mesh position={[0, 1.54, -4]}><boxGeometry args={[8.2, 0.06, 1.6]} /><meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.5} toneMapped={false} /></mesh>
      {/* ciotole (dischi) */}
      {[-2, -0.6, 0.8, 2.2].map((x, i) => (
        <mesh key={i} position={[x, 1.62, -4]}><cylinderGeometry args={[0.32, 0.24, 0.22, 16]} /><meshStandardMaterial color={surface} roughness={0.3} metalness={0.4} /></mesh>
      ))}
      {/* parete + insegna neon */}
      <mesh position={[0, 3, -6.4]}><planeGeometry args={[26, 8]} /><meshStandardMaterial color={hex(palette.bg, '#05060d')} /></mesh>
      <mesh position={[0, 3.1, -6.2]}><planeGeometry args={[3.6, 0.5]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.8} toneMapped={false} /></mesh>
      <pointLight position={[0, 3, -5.6]} color={accent} intensity={4} distance={8} />
    </group>
  );
}

export default function EthnicScene({ theme, level }) {
  const palette = theme?.palette || {};
  const steam = level === 'high' ? 110 : level === 'medium' ? 60 : 25;
  return (
    <>
      <color attach="background" args={[hex(palette.bg, '#05060d')]} />
      <fog attach="fog" args={[hex(palette.bg, '#05060d'), 7, 22]} />
      <ambientLight intensity={0.28} />
      <CameraRig />
      <Counter palette={palette} />
      <Lanterns palette={palette} />
      {level !== 'low' && <Steam palette={palette} count={steam} />}
    </>
  );
}
