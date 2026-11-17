import { useRef, useMemo } from 'react';
import { extend, useFrame } from '@react-three/fiber';
import { Points as ThreePoints, BufferGeometry, BufferAttribute } from 'three';
import { Points, PointMaterial } from '@react-three/drei';

extend({ ThreePoints, BufferGeometry, BufferAttribute });

/**
 * Ambient Stardust & Floating Dust Motes
 * Subtle Brownian drift with harmonic opacity twinkle.
 */
export default function AmbientDust({
  count = 150,
  color = '#ffffff',
  size = 2.0,
  areaWidth = 250,
  areaHeight = 150,
  areaDepth = 80,
}) {
  const pointsRef = useRef();

  const [positions, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * areaWidth;
      pos[i * 3 + 1] = (Math.random() - 0.5) * areaHeight;
      pos[i * 3 + 2] = Math.random() * areaDepth;
      ph[i] = Math.random() * Math.PI * 2;
    }

    return [pos, ph];
  }, [count, areaWidth, areaHeight, areaDepth]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();

    // Subtle breathing / floating motion
    pointsRef.current.rotation.y = Math.sin(t * 0.05) * 0.03;
    pointsRef.current.position.y = Math.cos(t * 0.1) * 2.0;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation={false}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

