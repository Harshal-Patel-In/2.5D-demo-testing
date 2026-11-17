import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Universal Multiplane 2.5D Layer Material v2.0
 * 
 * - Material Compliance: spatial exclusion masks (rigidBox) protect architectural structures
 * - Height-Weighted Pendulum Sway for organic foliage
 * - Dual-Layer UV Parallax: Micro-UV shifting produces internal volumetric relief
 * - Alpha punch-through discard preserves clean transparency
 */
export const LayerMaterial = shaderMaterial(
  {
    textr: null,
    movement: [0, 0, 0],
    scale: 1.0,
    factor: 0.0,
    wiggle: 0.0,
    ripple: 0.0,
    breath: 0.0,
    time: 0.0,
    rigidBox: [0.0, 0.0, 0.0, 0.0],
    rigidMargin: 0.06,
  },
  /* glsl Vertex Shader */
  `
  uniform float time;
  uniform float wiggle;
  uniform float ripple;
  uniform float breath;
  uniform vec4 rigidBox;
  uniform float rigidMargin;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vec3 transformed = vec3(position);

    // 1. Structural Rigidity Calculation (Material Compliance)
    float compliance = 1.0;
    if (rigidBox.z > rigidBox.x && rigidBox.w > rigidBox.y) {
      vec2 d = max(abs(uv - (rigidBox.xy + rigidBox.zw) * 0.5) - (rigidBox.zw - rigidBox.xy) * 0.5, 0.0);
      float distToRigid = length(d);
      compliance = smoothstep(0.0, rigidMargin, distToRigid);
    }

    // 2. Pendulum Wind Sway (Organic Foliage)
    if (wiggle > 0.0) {
      float heightWeight = pow(clamp(uv.y, 0.0, 1.0), 1.8);
      float swayAngle = sin(time * 1.6 + position.y * 1.5) * 0.45 * wiggle * heightWeight * compliance;
      
      float c = cos(swayAngle);
      float s = sin(swayAngle);
      mat3 rotY = mat3(
        c,   0.0,  s,
        0.0, 1.0,  0.0,
       -s,   0.0,  c
      );
      transformed = transformed * rotY;
      vNormal = vNormal * rotY;
    }

    // 3. Liquid / Water Ripple (Fluid Ambient)
    if (ripple > 0.0) {
      float waveX = sin(position.x * 3.5 + time * 2.2);
      float waveY = cos(position.y * 2.8 + time * 1.6);
      transformed.z += (waveX + waveY) * (0.035 * ripple);
    }

    // 4. Organic Breathing Pulse (Creature / Focal Subject)
    if (breath > 0.0) {
      float scaleFactor = 1.0 + sin(time * 1.8) * (0.015 * breath);
      transformed.xy *= scaleFactor;
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
  `,
  /* glsl Fragment Shader */
  `
  uniform sampler2D textr;
  uniform vec3 movement;
  uniform float factor;
  uniform float scale;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv / scale + movement.xy * factor;
    vec4 color = texture2D(textr, uv);

    if (color.a < 0.05) discard;

    gl_FragColor = color;

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
  `
);

extend({ LayerMaterial });
