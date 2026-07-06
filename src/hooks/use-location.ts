import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type LocationState = {
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook that requests foreground location permission and resolves
 * the device's current GPS coordinates using the phone's built-in
 * satellite positioning.
 */
export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (!cancelled) {
            setState({
              latitude: null,
              longitude: null,
              isLoading: false,
              error: 'Location permission denied.',
            });
          }
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!cancelled) {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            latitude: null,
            longitude: null,
            isLoading: false,
            error: 'Unable to retrieve location.',
          });
        }
      }
    }

    fetchLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
