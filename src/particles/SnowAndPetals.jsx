import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, Color } from 'three';

/**
 * High-performance Instanced Particle System
 * For falling leaves, flower petals, snow, or embers (Single Draw Call).
 */
export default function SnowAndPetals({
  count = 60,
  color = '#ffccd5',
  fallSpeed = 15.0,
  swaySpeed = 2.0,
  swayAmplitude = 8.0,
  areaWidth = 200,
  areaHeight = 150,
  areaDepth = 60,
}) {
  const meshRef = useRef();
  const dummy = useMemo(() => new Object3D(), []);

  // Initialize particle states
  const particles = useMemo(() => {
    return new Array(count).fill(null).map(() => ({
      x: (Math.random() - 0.5) * areaWidth,
      y: (Math.random() - 0.5) * areaHeight,
      z: Math.random() * areaDepth,
      rotX: Math.random() * Math.PI,
      rotY: Math.random() * Math.PI,
      rotZ: Math.random() * Math.PI,
      scale: 0.4 + Math.random() * 0.6,
      speedMultiplier: 0.8 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count, areaWidth, areaHeight, areaDepth]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const dt = Math.min(delta, 0.1);
    const halfH = areaHeight / 2;

    particles.forEach((p, i) => {
      // 1. Gravity Fall
      p.y -= fallSpeed * p.speedMultiplier * dt;

      // 2. Wrap around when falling below bottom
      if (p.y < -halfH) {
        p.y = halfH;
        p.x = (Math.random() - 0.5) * areaWidth;
      }

      // 3. Sinusoidal Flutter
      const currentX = p.x + Math.sin(p.phase + p.y * 0.05) * swayAmplitude;
      p.rotX += 0.5 * dt;
      p.rotZ += 0.3 * dt;

      // 4. Update transformation matrix
      dummy.position.set(currentX, p.y, p.z);
      dummy.rotation.set(p.rotX, p.rotY, p.rotZ);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <planeGeometry args={[1.5, 1.5]} />
      <meshBasicMaterial
        color={new Color(color)}
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

