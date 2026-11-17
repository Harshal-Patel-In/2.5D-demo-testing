import { Vector3, CatmullRomCurve3 } from 'three';
import { useRef, useMemo } from 'react';
import { extend, useFrame } from '@react-three/fiber';
import * as meshline from 'meshline';

extend(meshline);

const randomSpread = () => Math.max(0.2, Math.random());

function Fatline({ curve, color, speed = 1.0 }) {
  const material = useRef();

  useFrame((_, delta) => {
    if (material.current?.uniforms?.dashOffset) {
      material.current.uniforms.dashOffset.value -= (delta / 100) * speed;
    }
  });

  return (
    <mesh>
      <meshLineGeometry points={curve} />
      <meshLineMaterial
        ref={material}
        transparent
        lineWidth={0.012}
        color={color}
        dashArray={0.1}
        dashRatio={0.99}
      />
    </mesh>
  );
}

export default function Fireflies({
  count = 20,
  colors = ['#ffaa44', '#ffdd66'],
  radius = 80,
  speed = 1.0,
}) {
  const lines = useMemo(() => {
    return new Array(count).fill(null).map(() => {
      const origin = new Vector3(
        Math.sin(0) * radius * randomSpread(),
        Math.cos(0) * radius * randomSpread(),
        0
      );

      const points = new Array(30).fill(null).map((_, index) => {
        const angle = (index / 20) * Math.PI * 2;
        return origin
          .add(
            new Vector3(
              Math.sin(angle) * radius * randomSpread(),
              Math.cos(angle) * radius * randomSpread(),
              0
            )
          )
          .clone();
      });

      const curve = new CatmullRomCurve3(points).getPoints(100);
      return {
        color: colors[Math.floor(Math.random() * colors.length)],
        curve,
        speed: speed * (0.8 + Math.random() * 0.4),
      };
    });
  }, [count, radius, colors, speed]);

  return (
    <group position={[-radius * 2, -radius, 0]}>
      {lines.map((props, index) => (
        <Fatline key={index} {...props} />
      ))}
    </group>
  );
}

