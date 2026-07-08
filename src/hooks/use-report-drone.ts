import * as Device from 'expo-device';
import { useCallback, useState } from 'react';

export type ReportingMode = 'pointing' | 'text';

export type ReportDronePayload = {
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
  /** Compass heading in degrees [0, 360) when reporting mode is 'pointing' */
  heading?: number;
  /** Raw rotation values from DeviceMotion sensor for backend calculation */
  deviceMotionRotation?: { alpha: number; beta: number; gamma: number } | null;
  /** Raw magnetometer values for backend calculation */
  magnetometer?: { x: number; y: number; z: number } | null;
  /** How the user located the drone */
  reportingMode?: ReportingMode;
};

export type ReportState = {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
};

/**
 * Hook that exposes a `submitReport` function to POST a drone-sighting
 * report (with user location and free-text description) to the REST API.
 *
 * Replace `API_BASE_URL` with the actual backend endpoint before use.
 */
export function useReportDrone() {
  const API_BASE_URL = 'https://api.example.com'; // TODO: replace with real endpoint

  const [state, setState] = useState<ReportState>({
    isLoading: false,
    isSuccess: false,
    error: null,
  });

  const submitReport = useCallback(async (payload: ReportDronePayload) => {
    setState({ isLoading: true, isSuccess: false, error: null });

    try {
      const response = await fetch(`${API_BASE_URL}/reports/drone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          description: payload.description ?? '',
          heading: payload.heading ?? null,
          deviceMotionRotation: payload.deviceMotionRotation ?? null,
          magnetometer: payload.magnetometer ?? null,
          reportingMode: payload.reportingMode ?? 'text',
          reportedAt: new Date().toISOString(),
          userInfo: {
            brand: Device.brand,
            deviceName: Device.deviceName,
            modelName: Device.modelName,
            osName: Device.osName,
            osVersion: Device.osVersion,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      setState({ isLoading: false, isSuccess: true, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unexpected error occurred.';
      setState({ isLoading: false, isSuccess: false, error: message });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, isSuccess: false, error: null });
  }, []);

  return { ...state, submitReport, reset };
}
