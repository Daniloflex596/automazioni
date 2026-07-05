// Trattamento cinematografico: bloom (bagliori), vignettatura, grana pellicola.
// È ciò che alza un 3D "pulito" a un 3D "da studio". Pesante: attivo solo su desktop/high.
import React from 'react';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export default function PostFX({ level }) {
  if (level !== 'high') return null; // su mobile/low niente post-processing: performance prima di tutto
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.9} luminanceThreshold={0.35} luminanceSmoothing={0.4} mipmapBlur radius={0.8} />
      <Vignette eskil={false} offset={0.25} darkness={0.85} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
    </EffectComposer>
  );
}
