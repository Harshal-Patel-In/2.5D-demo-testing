import { useState, useEffect, useRef } from 'react';
import { MathUtils } from 'three';

/**
 * Real Hardware Gyroscope & Accelerometer Controller
 * - Android: Directly attaches to hardware deviceorientation / deviceorientationabsolute events.
 * - iOS: Uses Apple's DeviceOrientationEvent.requestPermission() user gesture flow.
 */
export function useGyroscope() {
  const [gyroActive, setGyroActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [rawAngles, setRawAngles] = useState({ gamma: 0, beta: 0 });
  const coordsRef = useRef({ x: 0, y: 0, active: false });

  // Detect iOS specifically (where requestPermission is mandatory)
  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  const handleOrientation = (e) => {
    // Check both standard gamma/beta and absolute fallback
    const gamma = e.gamma;
    const beta = e.beta;

    if (gamma === null || beta === null) return;

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

    // 1. Strictly iOS Safari Permission Flow
    if (
      isIOS &&
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setErrorMsg('Permission denied on iOS Safari.');
        }
      } catch (err) {
        setErrorMsg('iOS Sensor Error: ' + (err.message || 'Permission failed'));
      }
      return;
    }

    // 2. Android & all other browsers (NEVER call requestPermission on Android)
    try {
      window.addEventListener('deviceorientation', handleOrientation, true);
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);

      // Verify if physical sensor events are firing
      setTimeout(() => {
        if (!coordsRef.current.active) {
          setErrorMsg('Waiting for sensor movement (tilt your phone)...');
        }
      }, 1200);
    } catch (err) {
      setErrorMsg('Sensor error: ' + err.message);
    }
  };

  // Auto-attach immediately on Android / non-iOS browsers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isIOS) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);

      return () => {
        window.removeEventListener('deviceorientation', handleOrientation, true);
        window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      };
    }
  }, [isIOS]);

  return {
    gyroActive,
    errorMsg,
    rawAngles,
    coordsRef,
    startGyro,
  };
}
