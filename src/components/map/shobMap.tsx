import { useDroneSocket } from '@/hooks/use-websocket';
import { Drone } from '@/types/types';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle } from 'react-native-maps';
import { useToast } from "react-native-toast-notifications";
import { useNotification } from '../notification/NotificationContext';
import MapActionButtons from './actionButtons/ActionsButtons';
import DroneComp from './Drone';

/** Haversine formula — returns distance in metres between two lat/lng points */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ALERT_RADIUS_M = 1500; // 1.5 km

export default function ShobMap() {
  const { snapshot, updateLocation, isConnected } = useDroneSocket({ url: 'http://172.17.125.84:3000' });
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const [focusedDroneId, setFocusedDroneId] = useState<string | null>(null);
  const toast = useToast();
  const { showNotification } = useNotification();
  // Track which drone IDs have already triggered an alert so we don't spam
  const alertedDroneIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isConnected && toast && typeof toast.show === 'function') {
      toast.show("Socket connection failed", {
        type: "danger",
        placement: "top",
        duration: 4000,
        animationType: "slide-in",
      });
    }
  }, [isConnected, toast]);

  // ── Proximity detection ──────────────────────────────────────────────────
  useEffect(() => {
    if (!snapshot || !location) return;

    const userLat = location.coords.latitude;
    const userLon = location.coords.longitude;

    // Collect IDs of enemy drones currently within range
    const nowInRange = new Set<string>();

    snapshot.forEach((drone: Drone) => {
      if (drone.classification !== 'enemy') return;

      // droneGeom.coordinates is [longitude, latitude]
      const [droneLon, droneLat] = drone.droneGeom.coordinates;
      const distM = haversineDistance(userLat, userLon, droneLat, droneLon);

      if (distM <= ALERT_RADIUS_M) {
        nowInRange.add(drone.id);

        // Only alert once per drone — until it leaves and re-enters
        if (!alertedDroneIds.current.has(drone.id)) {
          alertedDroneIds.current.add(drone.id);

          const distDisplay =
            distM < 1000
              ? `${Math.round(distM)} מ'`
              : `${(distM / 1000).toFixed(1)} ק"מ`;

          showNotification(`מרחק ${distDisplay}`);
        }
      }
    });

    // Remove IDs that have left the zone so they can trigger again if they return
    alertedDroneIds.current.forEach((id) => {
      if (!nowInRange.has(id)) {
        alertedDroneIds.current.delete(id);
      }
    });
  }, [snapshot, location]);
  // ────────────────────────────────────────────────────────────────────────

  const focusOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  };


  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (error) {
        setErrorMsg('Could not fetch location');
      }
    })();
  }, []);

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Fetching your location...</Text>
      </View>
    );
  }

  updateLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
  const { latitude, longitude } = location.coords;

  return (
    <>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
          onPress={() => setFocusedDroneId(null)}
        >
          <Circle
            center={{ latitude, longitude }}
            radius={5000}
            strokeWidth={1}
            strokeColor="#4084FF"
            lineDashPattern={[5, 5]}
          />
          {isConnected && snapshot && snapshot.map((drone) => (
            <DroneComp
              key={drone.id}
              drone={drone}
              isFocused={focusedDroneId === drone.id}
              onPress={() => {
                console.log("HEYY", focusedDroneId);
                setFocusedDroneId(focusedDroneId === drone.id ? null : drone.id)
              }}
            />
          ))}
        </MapView>
        <MapActionButtons onFocusPress={focusOnUser} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  }
});