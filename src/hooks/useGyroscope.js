import { useState, useEffect, useRef } from 'react';
import { MathUtils } from 'three';

/**
 * Mobile Gyroscope & Accelerometer Normalization Hook
 * Implements Section 7 of Interactive 2.5D Multiplane Parallax Specification:
 * - Translates hardware accelerometer angles (gamma roll, beta pitch) into Normalized Device Coordinates (NDC) [-1, 1].
 * - Calibrated for natural handheld posture (45° tilt offset).
 * - Full iOS 13+ Safari permission request lifecycle.
 */
export function useGyroscope() {
  const [hasGyro, setHasGyro] = useState(false);
  const [gyroActive, setGyroActive] = useState(false);
  const [permissionNeeded, setPermissionNeeded] = useState(false);
  const coordsRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check iOS 13+ permission model
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      setPermissionNeeded(true);
      setHasGyro(true);
    } else if ('DeviceOrientationEvent' in window) {
      setHasGyro(true);

      const handleOrientation = (e) => {
        // Some desktop browsers fire null orientation events
        if (e.gamma === null || e.beta === null) return;

        // If the readings are non-zero, sensor is active
        if (Math.abs(e.gamma) > 0.01 || Math.abs(e.beta) > 0.01) {
          setGyroActive(true);
          coordsRef.current.active = true;
        }

        // gamma: roll left/right [-30°, +30°] -> [-1.0, +1.0]
        const normX = MathUtils.clamp(e.gamma / 30.0, -1.0, 1.0);

        // beta: pitch forward/back centered at natural 45° phone hold angle -> [-1.0, +1.0]
        const normY = MathUtils.clamp((e.beta - 45.0) / 30.0, -1.0, 1.0);

        coordsRef.current.x = normX;
        coordsRef.current.y = normY;
      };

      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, []);

  const requestPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          setPermissionNeeded(false);
          setGyroActive(true);
          coordsRef.current.active = true;

          const handleOrientation = (e) => {
            if (e.gamma === null || e.beta === null) return;
            const normX = MathUtils.clamp(e.gamma / 30.0, -1.0, 1.0);
            const normY = MathUtils.clamp((e.beta - 45.0) / 30.0, -1.0, 1.0);
            coordsRef.current.x = normX;
            coordsRef.current.y = normY;
          };

          window.addEventListener('deviceorientation', handleOrientation);
        }
      } catch (err) {
        console.error('[2.5D Parallax] Gyroscope permission denied or failed:', err);
      }
    }
  };

  return {
    hasGyro,
    gyroActive,
    permissionNeeded,
    coordsRef,
    requestPermission,
  };
}
