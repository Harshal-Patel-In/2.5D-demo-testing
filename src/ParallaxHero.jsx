import React, { useState } from 'react';
import Scene from './Scene';
import SmokeAndAsh from './particles/SmokeAndAsh';
import SnowAndPetals from './particles/SnowAndPetals';
import Fireflies from './particles/Fireflies';
import { PARALLAX_LAYERS } from './layersConfig';

export default function ParallaxHero({ showStudio = true }) {
  const [studioActive, setStudioActive] = useState(showStudio);
  const [particleStyle, setParticleStyle] = useState('smoke'); // 'smoke' | 'petals' | 'fireflies' | 'none'

  const renderParticles = () => {
    switch (particleStyle) {
      case 'smoke':
        return <SmokeAndAsh count={60} />;
      case 'petals':
        return <SnowAndPetals count={40} color="#ffd4df" />;
      case 'fireflies':
        return <Fireflies count={15} colors={['#fbbf24', '#f59e0b']} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505', overflow: 'hidden' }}>
      <Scene
        layersConfig={PARALLAX_LAYERS}
        heroFocusZ={32.0}
        bokehScale={0.5}
        lerpFactor={0.08}
        showStudio={studioActive}
        onFinalize={() => setStudioActive(false)}
        particles={renderParticles()}
        particleStyle={particleStyle}
        onParticleStyleChange={setParticleStyle}
      />
    </div>
  );
}
