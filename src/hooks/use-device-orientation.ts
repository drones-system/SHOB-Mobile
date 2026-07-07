import { useCallback, useEffect, useRef, useState } from 'react';
import { Magnetometer, type MagnetometerMeasurement } from 'expo-sensors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeviceOrientationState = {
  /** Whether the device has a magnetometer sensor */
  isAvailable: boolean;
  /** True while the availability check is still in progress */
  isCheckingAvailability: boolean;
  /** True once the subscription is active and data is flowing */
  isActive: boolean;
  /** Compass heading in degrees [0, 360), 0 = North, 90 = East */
  heading: number | null;
  /** Human-readable cardinal direction e.g. "NE", "S" */
  cardinalDirection: string | null;
  /** Raw magnetometer sensor data */
  rawData: MagnetometerMeasurement | null;
  /** Error message, if any */
  error: string | null;
};

// ─── Heading helpers ──────────────────────────────────────────────────────────

/**
 * Convert raw magnetometer {x, y} readings to a compass heading in degrees.
 * Assumes the phone is held flat (portrait, screen up).
 * Returns a value in [0, 360).
 */
function magnetometerToHeading({ x, y }: MagnetometerMeasurement): number {
  let heading = Math.atan2(y, x) * (180 / Math.PI);
  // atan2 returns [-180, 180]; convert to [0, 360)
  if (heading < 0) {
    heading += 360;
  }
  return heading;
}

const CARDINAL_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function headingToCardinal(heading: number): string {
  const index = Math.round(heading / 45) % 8;
  return CARDINAL_DIRECTIONS[index];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook that uses the device's built-in magnetometer to derive a live compass
 * heading. Only activates on devices that have the required hardware.
 *
 * Returns a `start()` and `stop()` control pair so the consumer decides when
 * to begin streaming sensor data (useful for battery conservation).
 *
 * @example
 * const { isAvailable, isActive, heading, cardinalDirection, start, stop } = useDeviceOrientation();
 */
export function useDeviceOrientation() {
  const [state, setState] = useState<DeviceOrientationState>({
    isAvailable: false,
    isCheckingAvailability: true,
    isActive: false,
    heading: null,
    cardinalDirection: null,
    rawData: null,
    error: null,
  });

  const subscriptionRef = useRef<ReturnType<typeof Magnetometer.addListener> | null>(null);

  // ── Availability check on mount ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function checkAvailability() {
      try {
        const available = await Magnetometer.isAvailableAsync();
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
            error: 'Could not check sensor availability.',
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

    // 100 ms update interval – fast enough for a compass needle
    Magnetometer.setUpdateInterval(100);

    subscriptionRef.current = Magnetometer.addListener((measurement) => {
      const heading = magnetometerToHeading(measurement);
      const cardinalDirection = headingToCardinal(heading);

      setState((prev) => ({
        ...prev,
        isActive: true,
        heading,
        cardinalDirection,
        rawData: measurement,
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
