import { Mesh, PlaneGeometry, Group, Vector3, MathUtils, RepeatWrapping, NearestFilter, LinearFilter } from 'three';
import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Plane, useTexture } from '@react-three/drei';
import { EffectComposer, DepthOfField, Vignette } from '@react-three/postprocessing';
import './layerMaterial';
import { ParallaxStudioHUD } from './ParallaxStudioHUD';

const Z_CAM = 120.0;

/**
 * Multiplane Parallax Experience with Autonomous Responsive Cover & Smooth Spatial Exploration
 */
function Experience({
  layersConfig = [],
  mouseSensitivity = { shiftX: 8, pitch: 10, yaw: 1.2 },
  lerpFactor = 0.08,
  particleSlot = null,
  focalTargetZ = 32.0,
  smoothing = true,
  windSway = 1.7,
  zoom = 1.0,
  displayMode = 'cover',
}) {
  const group = useRef();
  const planesRef = useRef([]);
  const materialsRef = useRef([]);
  const [movement] = useState(() => new Vector3());
  const [temp] = useState(() => new Vector3());

  const { width: vpW, height: vpH } = useThree((state) => state.viewport);

  // Fully Autonomous Responsive Scaling:
  // Cover mode scales to Math.max(vpW, vpH) * 1.08 -> 100% edge-to-edge coverage on ALL screens
  // Zero black bars on desktop (16:9), ultrawide (21:9), mobile (9:16), or tablet (4:3)
  const coverDim = Math.max(vpW, vpH) * 1.08;
  const fitDim = Math.min(vpW, vpH) * 0.95;
  const baseDim = (displayMode === 'fit' ? fitDim : coverDim) * (zoom ?? 1.0);

  // Load all textures in parallel
  const textureUrls = useMemo(() => layersConfig.map((l) => l.url), [layersConfig]);
  const textures = useTexture(textureUrls);

  const layers = useMemo(() => {
    return layersConfig.map((layer, index) => {
      const tex = textures[index];
      if (tex) {
        if (layer.isPixelArt && !smoothing) {
          tex.magFilter = NearestFilter;
          tex.minFilter = NearestFilter;
        } else {
          tex.magFilter = LinearFilter;
          tex.minFilter = LinearFilter;
        }
        if (layer.repeatX && layer.repeatX > 1) {
          tex.wrapS = RepeatWrapping;
          tex.repeat.set(layer.repeatX, 1);
        }
        tex.needsUpdate = true;
      }

      // Distance-based perspective compensation
      const distance = Math.max(10.0, Z_CAM - (layer.z || 0.0));
      const compensation = distance / Z_CAM;
      const layerScale = [baseDim * compensation, baseDim * compensation, 1];

      return {
        ...layer,
        texture: tex,
        computedScale: layerScale,
      };
    });
  }, [layersConfig, textures, baseDim, smoothing, zoom, displayMode]);

  // Clean disposal on unmount
  useEffect(() => {
    return () => {
      textures.forEach((t) => t?.dispose?.());
      materialsRef.current.forEach((m) => m?.dispose?.());
    };
  }, [textures]);

  // Main 60 FPS animation loop
  useFrame((state, delta) => {
    const prefersReducedMotion =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    if (prefersReducedMotion) return;

    // 1. Smooth pointer vector
    movement.lerp(temp.set(state.pointer.x, state.pointer.y * 0.2, 0), 0.2);

    // 2. Spatial Viewport Exploration (Panoramic Camera Tracking)
    // Allows user to view hidden vertical headroom (top title text & bottom signatures) smoothly
    if (group.current) {
      const excessH = Math.max(0, baseDim - vpH);
      const targetPanY = -state.pointer.y * (excessH * 0.42);

      const excessW = Math.max(0, baseDim - vpW);
      const targetPanX = -state.pointer.x * (excessW * 0.35 + mouseSensitivity.shiftX);

      group.current.position.x = MathUtils.lerp(group.current.position.x, targetPanX, lerpFactor);
      group.current.position.y = MathUtils.lerp(group.current.position.y, targetPanY, lerpFactor);
    }

    // 3. Differential Perspective Tilt & Dynamic Sway
    layers.forEach((layer, i) => {
      const plane = planesRef.current[i];
      const mat = materialsRef.current[i];

      if (mat?.uniforms?.time) {
        mat.uniforms.time.value += delta;
      }

      if (mat?.uniforms?.wiggle) {
        mat.uniforms.wiggle.value = (layer.wiggle || 0.0) * windSway;
      }

      // Per-layer rotational keystoning
      if (plane) {
        const normZ = Math.min(1.0, Math.max(0.0, (layer.z || 0.0) / 50.0));
        const maxRotRad = (0.2 + Math.pow(normZ, 2.0) * 4.3) * (Math.PI / 180.0);

        const targetRotX = state.pointer.y * maxRotRad * 0.45;
        const targetRotY = -state.pointer.x * maxRotRad;

        plane.rotation.x = MathUtils.lerp(plane.rotation.x, targetRotX, lerpFactor);
        plane.rotation.y = MathUtils.lerp(plane.rotation.y, targetRotY, lerpFactor);
      }
    });
  });

  return (
    <group ref={group}>
      {particleSlot}

      {layers.map((layer, i) => {
        const {
          computedScale,
          texture,
          factor = 0,
          scaleFactor = 1,
          wiggle = 0,
          ripple = 0,
          breath = 0,
          rigidBox = [0, 0, 0, 0],
          x = 0,
          y = 0,
          z = 0,
        } = layer;

        const isSubdivided = wiggle > 0 || ripple > 0;

        return (
          <Plane
            key={i}
            ref={(el) => (planesRef.current[i] = el)}
            scale={computedScale}
            args={[1, 1, isSubdivided ? 16 : 1, isSubdivided ? 16 : 1]}
            position={[x, y, z]}
          >
            <layerMaterial
              ref={(el) => (materialsRef.current[i] = el)}
              transparent
              depthWrite={false}
              movement={movement}
              textr={texture}
              factor={factor}
              wiggle={wiggle * windSway}
              ripple={ripple}
              breath={breath}
              rigidBox={rigidBox}
              rigidMargin={0.06}
              scale={scaleFactor}
            />
          </Plane>
        );
      })}
    </group>
  );
}

/**
 * Depth-of-Field & Cinematic Vignette Post-Processing
 */
function Effects({ focusZ = 32.0, bokehScale = 0.5 }) {
  return (
    <EffectComposer disableNormalPass multisampling={0}>
      <DepthOfField
        target={[0, 0, focusZ]}
        bokehScale={bokehScale}
        focalLength={0.02}
        width={1024}
      />
      <Vignette eskil={false} offset={0.12} darkness={0.8} />
    </EffectComposer>
  );
}

/**
 * Loading fallback
 */
function LoadingScreen() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#09090b',
      color: '#f59e0b',
      fontFamily: 'monospace',
      zIndex: 50,
      pointerEvents: 'none',
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid rgba(245, 158, 11, 0.2)',
        borderTopColor: '#f59e0b',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: 12,
      }} />
      <span style={{ letterSpacing: '0.1em', fontSize: '13px' }}>SCALING RESPONSIVE 4K CANVAS...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/**
 * Master Scene Component
 */
export default function Scene({
  layersConfig = [],
  heroFocusZ = 32.0,
  bokehScale = 0.5,
  mouseSensitivity = { shiftX: 8, pitch: 10, yaw: 1.2 },
  lerpFactor = 0.08,
  particles,
  showStudio = true,
  onFinalize,
  particleStyle,
  onParticleStyleChange,
  children,
}) {
  const [telemetry, setTelemetry] = useState({
    focalTargetZ: heroFocusZ,
    bokehScale: bokehScale,
    windSway: 1.7,
    lerpAlpha: lerpFactor,
    smoothing: true,
    zoom: 1.0,
    displayMode: 'cover',
  });

  const [notes, setNotes] = useState([
    {
      id: 1794636802128,
      timestamp: '2026-11-14T06:13:22.128Z',
      x: 0.442,
      y: 0.29,
      text: 'make it fully responsive to cover the screen in proper way on all screens',
      resolved: true,
    },
  ]);

  // Smooth mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.target.closest('#parallax-studio-hud')) return;

      setTelemetry((prev) => {
        const currentZoom = prev.zoom ?? 1.0;
        const delta = e.deltaY > 0 ? -0.04 : 0.04;
        const nextZoom = Math.min(1.6, Math.max(0.5, currentZoom + delta));
        return { ...prev, zoom: parseFloat(nextZoom.toFixed(2)) };
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const handleTelemetryChange = (key, value) => {
    setTelemetry((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddNote = (newNote) => {
    setNotes((prev) => [...prev, newNote]);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#050505' }}>
      <Suspense fallback={<LoadingScreen />}>
        <Canvas
          camera={{ position: [0, 0, Z_CAM], fov: 38, near: 1, far: 350 }}
          dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <Experience
            layersConfig={layersConfig}
            mouseSensitivity={mouseSensitivity}
            lerpFactor={telemetry.lerpAlpha}
            particleSlot={particles}
            focalTargetZ={telemetry.focalTargetZ}
            smoothing={telemetry.smoothing}
            windSway={telemetry.windSway}
            zoom={telemetry.zoom}
            displayMode={telemetry.displayMode}
          />
          <Effects focusZ={telemetry.focalTargetZ} bokehScale={telemetry.bokehScale} />
          {children}
        </Canvas>
      </Suspense>

      {/* Framefields-style Interactive Live Studio HUD */}
      {showStudio && (
        <ParallaxStudioHUD
          telemetry={telemetry}
          onTelemetryChange={handleTelemetryChange}
          onFinalize={onFinalize}
          notes={notes}
          onAddNote={handleAddNote}
          particleStyle={particleStyle}
          onParticleStyleChange={onParticleStyleChange}
        />
      )}
    </div>
  );
}
