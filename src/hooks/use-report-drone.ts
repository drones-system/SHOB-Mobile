import { useState, useCallback } from 'react';

export type ReportDronePayload = {
  latitude: number;
  longitude: number;
  description: string;
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
          latitude: payload.latitude,
          longitude: payload.longitude,
          description: payload.description,
          reportedAt: new Date().toISOString(),
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
