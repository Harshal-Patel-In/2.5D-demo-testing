import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, Color } from 'three';

/**
 * Urban Smoke & Balkan Cigarette Ash Particle Simulation
 * Realistic rising thermal smoke motes and subtle drifting ash flakes
 * perfectly matching "Dani Gambino - ΤΣΙΓΑΡΑ ΣΤΑ ΒΑΛΚΑΝΙΑ".
 */
export default function SmokeAndAsh({
  count = 65,
  areaWidth = 260,
  areaHeight = 200,
  areaDepth = 70,
}) {
  const meshRef = useRef();
  const dummy = useMemo(() => new Object3D(), []);

  const particles = useMemo(() => {
    return new Array(count).fill(null).map(() => ({
      x: (Math.random() - 0.5) * areaWidth,
      y: (Math.random() - 0.5) * areaHeight,
      z: Math.random() * areaDepth,
      riseSpeed: 8.0 + Math.random() * 12.0,
      swaySpeed: 1.2 + Math.random() * 1.5,
      swayAmp: 4.0 + Math.random() * 8.0,
      rotX: Math.random() * Math.PI,
      rotZ: Math.random() * Math.PI,
      scale: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count, areaWidth, areaHeight, areaDepth]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const dt = Math.min(delta, 0.1);
    const halfH = areaHeight / 2;

    particles.forEach((p, i) => {
      // 1. Upward thermal rise (cigarette smoke & ash)
      p.y += p.riseSpeed * dt;

      // 2. Wrap around when rising past the top
      if (p.y > halfH) {
        p.y = -halfH;
        p.x = (Math.random() - 0.5) * areaWidth;
      }

      // 3. Organic air current sway
      const currentX = p.x + Math.sin(p.phase + p.y * 0.04) * p.swayAmp;
      p.rotX += 0.3 * dt;
      p.rotZ += 0.4 * dt;

      dummy.position.set(currentX, p.y, p.z);
      dummy.rotation.set(p.rotX, 0, p.rotZ);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <planeGeometry args={[1.2, 1.2]} />
      <meshBasicMaterial
        color={new Color('#d1d5db')}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

