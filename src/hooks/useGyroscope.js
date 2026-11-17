import { useState, useEffect, useRef } from 'react';
import { MathUtils } from 'three';

/**
 * Robust Mobile Gyroscope & Desktop Tilt Simulation Hook
 */
export function useGyroscope() {
  const isMobile =
    typeof navigator !== 'undefined' &&
    (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && !/Windows NT/i.test(navigator.userAgent)));

  const isSecure = typeof window !== 'undefined' && window.isSecureContext;

  const [hasGyro, setHasGyro] = useState(isMobile);
  const [gyroActive, setGyroActive] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('idle'); // 'idle' | 'requesting' | 'granted' | 'denied' | 'insecure' | 'unavailable'
  const [simulatedTilt, setSimulatedTilt] = useState(false);

  const coordsRef = useRef({ x: 0, y: 0, active: false });

  // Desktop tilt simulation loop
  useEffect(() => {
    if (!simulatedTilt) return;

    let animId;
    let startTime = Date.now();

    const animateSim = () => {
      const t = (Date.now() - startTime) * 0.0015;
      // Simulate natural hand tilt
      coordsRef.current.x = Math.sin(t * 1.2) * 0.55;
      coordsRef.current.y = Math.cos(t * 0.9) * 0.45;
      coordsRef.current.active = true;
      setGyroActive(true);
      animId = requestAnimationFrame(animateSim);
    };

    animId = requestAnimationFrame(animateSim);
    return () => {
      cancelAnimationFrame(animId);
      coordsRef.current.active = false;
      setGyroActive(false);
    };
  }, [simulatedTilt]);

  // Mobile orientation listener
  useEffect(() => {
    if (typeof window === 'undefined' || !isMobile) return;

    const handleOrientation = (e) => {
      if (e.gamma === null || e.beta === null) return;

      coordsRef.current.active = true;
      setGyroActive(true);
      setPermissionStatus('granted');

      // gamma: roll [-30, +30] -> [-1, 1]
      // beta: pitch centered at natural 45° phone hold angle -> [-1, 1]
      coordsRef.current.x = MathUtils.clamp(e.gamma / 30.0, -1.0, 1.0);
      coordsRef.current.y = MathUtils.clamp((e.beta - 45.0) / 30.0, -1.0, 1.0);
    };

    // On Android/Chrome, events can be attached directly
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission !== 'function'
    ) {
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, [isMobile]);

  // Explicit user gesture request (required by iOS 13+)
  const requestPermission = async () => {
    if (!isMobile) {
      // User is on desktop: toggle simulated mobile gyroscope tilt
      setSimulatedTilt((prev) => !prev);
      return;
    }

    // Insecure HTTP origin check on mobile
    if (!isSecure && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setPermissionStatus('insecure');
      alert('Mobile sensors require HTTPS when accessed over a local network IP.');
      return;
    }

    setPermissionStatus('requesting');

    // iOS 13+ permission request
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          setPermissionStatus('granted');
          setGyroActive(true);
          coordsRef.current.active = true;

          const handleOrientation = (e) => {
            if (e.gamma === null || e.beta === null) return;
            coordsRef.current.x = MathUtils.clamp(e.gamma / 30.0, -1.0, 1.0);
            coordsRef.current.y = MathUtils.clamp((e.beta - 45.0) / 30.0, -1.0, 1.0);
          };

          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          setPermissionStatus('denied');
        }
      } catch (err) {
        console.warn('Gyro request error:', err);
        setPermissionStatus('denied');
      }
    } else {
      // Non-iOS mobile or fallback: attach directly
      try {
        const handleOrientation = (e) => {
          if (e.gamma === null || e.beta === null) return;
          coordsRef.current.active = true;
          setGyroActive(true);
          setPermissionStatus('granted');
          coordsRef.current.x = MathUtils.clamp(e.gamma / 30.0, -1.0, 1.0);
          coordsRef.current.y = MathUtils.clamp((e.beta - 45.0) / 30.0, -1.0, 1.0);
        };
        window.addEventListener('deviceorientation', handleOrientation);
        setPermissionStatus('granted');
      } catch {
        setPermissionStatus('unavailable');
      }
    }
  };

  return {
    isMobile,
    isSecure,
    hasGyro,
    gyroActive,
    permissionStatus,
    simulatedTilt,
    setSimulatedTilt,
    coordsRef,
    requestPermission,
  };
}
