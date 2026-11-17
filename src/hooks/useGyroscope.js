import { useState, useEffect, useRef } from 'react';
import { MathUtils } from 'three';

/**
 * Real Hardware Gyroscope & Accelerometer Controller
 * Strictly uses real physical deviceorientation readings from the device sensor.
 */
export function useGyroscope() {
  const [gyroActive, setGyroActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [rawAngles, setRawAngles] = useState({ gamma: 0, beta: 0 });
  const coordsRef = useRef({ x: 0, y: 0, active: false });

  const handleOrientation = (e) => {
    const gamma = e.gamma; // Roll: [-90, 90]
    const beta = e.beta;   // Pitch: [-180, 180]

    // Some desktop browsers fire dummy events with null values
    if (gamma === null || beta === null) return;

    // Real hardware sensor detected
    coordsRef.current.active = true;
    setGyroActive(true);
    setErrorMsg(null);
    setRawAngles({
      gamma: Math.round(gamma),
      beta: Math.round(beta),
    });

    // Normalize:
    // gamma: roll left/right [-30°, +30°] -> [-1.0, +1.0]
    coordsRef.current.x = MathUtils.clamp(gamma / 30.0, -1.0, 1.0);

    // beta: pitch centered at natural 45° phone hold angle -> [-1.0, +1.0]
    coordsRef.current.y = MathUtils.clamp((beta - 45.0) / 30.0, -1.0, 1.0);
  };

  const startGyro = async () => {
    setErrorMsg(null);

    // 1. iOS 13+ Safari Permission Flow
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setErrorMsg('Permission denied by user.');
        }
      } catch (err) {
        setErrorMsg('Sensor error: ' + (err.message || 'Permission failed'));
      }
      return;
    }

    // 2. Android Chrome / Standard Browsers: attach real listeners directly
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);

      // Verify if physical sensor actually exists (fails on desktop PC)
      setTimeout(() => {
        if (!coordsRef.current.active) {
          setErrorMsg('No hardware gyroscope detected on this device.');
        }
      }, 1000);
    } else {
      setErrorMsg('DeviceOrientation is not supported by this browser.');
    }
  };

  // Auto-listen on load for devices that do not require an explicit user prompt (Android)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission !== 'function'
    ) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);

      return () => {
        window.removeEventListener('deviceorientation', handleOrientation, true);
        window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      };
    }
  }, []);

  return {
    gyroActive,
    errorMsg,
    rawAngles,
    coordsRef,
    startGyro,
  };
}
