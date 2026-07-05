import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { sceneFor } from '../scenes/index.js';
import { dprCap } from '../lib/device.js';
import PostFX from './PostFX.jsx';

// Canvas fissa a tutto schermo dietro il contenuto. Se il budget è 'off' non montiamo nulla:
// il fallback 2D (gradiente + contenuto HTML) resta di prima classe.
export default function Scene3D({ template, theme, level }) {
  if (level === 'off') return null;
  const Scene = sceneFor(template);
  return (
    <div className="scene3d" aria-hidden="true">
      <Canvas
        dpr={dprCap(level)}
        gl={{ antialias: level === 'high', powerPreference: 'high-performance', alpha: false }}
        camera={{ position: [0, 1.6, 9], fov: 55 }}
      >
        <Suspense fallback={null}>
          <Scene theme={theme} level={level} />
          <PostFX level={level} />
        </Suspense>
      </Canvas>
    </div>
  );
}
