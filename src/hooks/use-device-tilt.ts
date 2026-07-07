import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceMotion, type DeviceMotionMeasurement } from 'expo-sensors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeviceTiltState = {
  /** Whether the device has a motion sensor capable of reporting rotation */
  isAvailable: boolean;
  /** True while the availability check is still in progress */
  isCheckingAvailability: boolean;
  /** True once the subscription is active and data is flowing */
  isActive: boolean;
  /**
   * Elevation angle in degrees [-90, 90].
   * +90 = phone pointing straight up, 0 = horizontal, -90 = pointing down.
   * Derived from DeviceMotion `rotation.beta` (radians → degrees).
   */
  pitch: number | null;
  /**
   * Roll in degrees [-90, 90].
   * Derived from DeviceMotion `rotation.gamma` (radians → degrees).
   * Useful for detecting if the phone is leaning sideways.
   */
  roll: number | null;
  /** Raw rotation values (alpha, beta, gamma in radians) */
  rawRotation: { alpha: number; beta: number; gamma: number } | null;
  /** Error message, if any */
  error: string | null;
};

// ─── Math helpers ─────────────────────────────────────────────────────────────

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Clamp a value to [-90, 90] degrees.
 * DeviceMotion beta can technically range beyond this on some devices.
 */
function clamp90(value: number): number {
  return Math.max(-90, Math.min(90, value));
}

function measurementToPitchRoll(m: DeviceMotionMeasurement): {
  pitch: number;
  roll: number;
} {
  // rotation.beta = X-axis rotation (tilt forward/back), in radians
  // rotation.gamma = Y-axis rotation (tilt left/right), in radians
  const pitch = clamp90((m.rotation?.beta ?? 0) * RAD_TO_DEG);
  const roll = clamp90((m.rotation?.gamma ?? 0) * RAD_TO_DEG);
  return { pitch, roll };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook that uses the device's motion sensor (accelerometer + gyroscope fusion)
 * to derive a live pitch (elevation) and roll angle.
 *
 * Designed to be used alongside `useDeviceOrientation` so that a single
 * "Capture" action can snapshot compass heading + elevation angle together.
 *
 * Returns `start()` and `stop()` controls so the consumer decides when to begin
 * streaming sensor data (good for battery life).
 *
 * @example
 * const { isAvailable, pitch, roll, start, stop } = useDeviceTilt();
 */
export function useDeviceTilt() {
  const [state, setState] = useState<DeviceTiltState>({
    isAvailable: false,
    isCheckingAvailability: true,
    isActive: false,
    pitch: null,
    roll: null,
    rawRotation: null,
    error: null,
  });

  const subscriptionRef = useRef<ReturnType<typeof DeviceMotion.addListener> | null>(null);

  // ── Availability check on mount ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function checkAvailability() {
      try {
        const available = await DeviceMotion.isAvailableAsync();
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isAvailable: available,
            isCheckingAvailability: false,
          }));
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isAvailable: false,
            isCheckingAvailability: false,
            error: 'Could not check motion sensor availability.',
          }));
        }
      }
    }

    checkAvailability();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Start streaming ──────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (subscriptionRef.current) return; // already running

    // 100 ms interval — fast enough for smooth visual feedback
    DeviceMotion.setUpdateInterval(100);

    subscriptionRef.current = DeviceMotion.addListener((measurement) => {
      const { pitch, roll } = measurementToPitchRoll(measurement);
      setState((prev) => ({
        ...prev,
        isActive: true,
        pitch,
        roll,
        rawRotation: measurement.rotation ? {
          alpha: measurement.rotation.alpha,
          beta: measurement.rotation.beta,
          gamma: measurement.rotation.gamma,
        } : null,
        error: null,
      }));
    });
  }, []);

  // ── Stop streaming ───────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  // ── Clean up on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []);

  return { ...state, start, stop };
}
