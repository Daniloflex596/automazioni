// Scena "street food": bancone/griglia incandescente, braci che salgono, insegna e cassette.
// Vibe da mercato/friggitoria — distinta dal pub. Camera che si avvicina al bancone scrollando.
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollRef } from '../lib/scroll.js';

function hex(c, f) { try { return new THREE.Color(c || f); } catch { return new THREE.Color(f); } }

function CameraRig() {
  const scroll = useScrollRef();
  useFrame(({ camera }) => {
    const p = scroll.current;
    camera.position.lerp(new THREE.Vector3(Math.sin(p * 0.5) * 1.1, 1.7 - p * 0.5, 8.5 - p * 13), 0.08);
    camera.lookAt(0, 1.0 - p * 0.2, -6);
  });
  return null;
}

// Braci/scintille che salgono dalla griglia.
function Embers({ palette, count = 140 }) {
  const ref = useRef();
  const scroll = useScrollRef();
  const primary = hex(palette.primary, '#ff3d5a');
  const accent = hex(palette.accent, '#ffd23f');
  const seeds = useMemo(() => {
    const a = [];
    for (let i = 0; i < count; i++) a.push({ x: -3 + Math.random() * 6, z: -4.5 + Math.random() * 1.6, speed: 0.4 + Math.random() * 0.8, off: Math.random() * 6, sway: Math.random() * 2 });
    return a;
  }, [count]);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    seeds.forEach((s, i) => {
      const y = ((t * s.speed + s.off) % 4);
      positions[i * 3] = s.x + Math.sin(t + s.sway) * 0.12;
      positions[i * 3 + 1] = 1.1 + y;
      positions[i * 3 + 2] = s.z;
    });
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.material.color.copy(scroll.current > 0.5 ? accent : primary);
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={0.05} color={primary} transparent opacity={0.85} sizeAttenuation toneMapped={false} />
    </points>
  );
}

function Counter({ palette }) {
  const surface = hex(palette.surface, '#221913');
  const primary = hex(palette.primary, '#ff3d5a');
  const accent = hex(palette.accent, '#ffd23f');
  const grill = useRef();
  useFrame(({ clock }) => {
    if (grill.current) grill.current.material.emissiveIntensity = 0.8 + Math.sin(clock.getElapsedTime() * 3) * 0.25;
  });
  return (
    <group>
      {/* pavimento */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
        <planeGeometry args={[26, 30]} />
        <meshStandardMaterial color={hex(palette.bg, '#0a0a0f')} roughness={0.85} />
      </mesh>
      {/* bancone */}
      <mesh position={[0, 0.9, -4]}>
        <boxGeometry args={[7, 1.1, 1.6]} />
        <meshStandardMaterial color={surface} roughness={0.4} metalness={0.4} />
      </mesh>
      {/* piastra della griglia incandescente */}
      <mesh ref={grill} position={[0, 1.47, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.6, 1.2]} />
        <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={1} roughness={0.3} metalness={0.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.8, -3.6]} color={accent} intensity={9} distance={10} decay={2} />
      {/* cassette impilate ai lati */}
      {[-3.2, 3.2].map((x, i) => (
        <group key={i} position={[x, 0.5, -4]}>
          {[0, 0.55, 1.05].map((y, j) => (
            <mesh key={j} position={[0, y, 0]}>
              <boxGeometry args={[0.9, 0.5, 0.9]} />
              <meshStandardMaterial color={surface} roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// Insegna luminosa sospesa.
function Sign({ palette }) {
  const accent = hex(palette.accent, '#ffd23f');
  return (
    <group position={[0, 3, -5.4]}>
      <mesh>
        <boxGeometry args={[5, 0.9, 0.15]} />
        <meshStandardMaterial color={hex(palette.surface, '#221913')} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[4.6, 0.55]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <pointLight color={accent} intensity={4} distance={7} position={[0, -0.5, 1]} />
    </group>
  );
}

// Fila di lampadine (string lights).
function StringLights({ palette }) {
  const accent = hex(palette.accent, '#ffd23f');
  const bulbs = [-4, -2.6, -1.2, 0.2, 1.6, 3, 4.4];
  return bulbs.map((x, i) => (
    <mesh key={i} position={[x, 2.6 + Math.sin(x) * 0.15, -2.5]}>
      <sphereGeometry args={[0.08, 10, 10]} />
      <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
    </mesh>
  ));
}

export default function StreetFoodScene({ theme, level }) {
  const palette = theme?.palette || {};
  const embers = level === 'high' ? 160 : level === 'medium' ? 90 : 40;
  return (
    <>
      <color attach="background" args={[hex(palette.bg, '#0a0a0f')]} />
      <fog attach="fog" args={[hex(palette.bg, '#0a0a0f'), 7, 24]} />
      <ambientLight intensity={0.3} />
      <CameraRig />
      <Counter palette={palette} />
      <Sign palette={palette} />
      {level !== 'low' && <StringLights palette={palette} />}
      <Embers palette={palette} count={embers} />
    </>
  );
}
