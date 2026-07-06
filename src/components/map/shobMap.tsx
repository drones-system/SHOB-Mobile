import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle } from 'react-native-maps';
import { Drone } from '../../types/types';
import MapActionButtons from './actionButtons/ActionsButtons';
import DroneComp from './Drone';

export default function ShobMap() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [focusedDroneId, setFocusedDroneId] = useState<string | null>(null);

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

  useEffect(() => {
    if (location && drones.length === 0) {
      const { latitude, longitude } = location.coords;
      const initialDrones: Drone[] = [
        {
          id: '1',
          type: 'drone',
          droneId: 'd1',
          trackId: 't1',
          classification: 'ally',
          droneGeom: { type: 'Point', coordinates: [longitude + 0.01, latitude + 0.01] },
          altitude: 100,
          height: 100,
          velocityNorth: 0,
          velocityEast: 0,
          velocityUp: 0,
          heading: 120,
          gpsTime: new Date().toISOString(),
          isSim: false,
        },
        {
          id: '2',
          type: 'drone',
          droneId: 'd2',
          trackId: 't2',
          classification: 'enemy',
          droneGeom: { type: 'Point', coordinates: [longitude - 0.01, latitude - 0.02] },
          altitude: 150,
          height: 150,
          velocityNorth: 0,
          velocityEast: 0,
          velocityUp: 0,
          heading: 120,
          gpsTime: new Date().toISOString(),
          isSim: false,
        },
        {
          id: '3',
          type: 'drone',
          droneId: 'd3',
          trackId: 't3',
          classification: 'unclassified',
          droneGeom: { type: 'Point', coordinates: [longitude + 0.02, latitude - 0.01] },
          altitude: 200,
          height: 200,
          velocityNorth: 0,
          velocityEast: 0,
          velocityUp: 0,
          heading: 120,
          gpsTime: new Date().toISOString(),
          isSim: false,
        }
      ];
      setDrones(initialDrones);
    }
  }, [location, drones.length]);

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

  const { latitude, longitude } = location.coords;

  return (
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
        {drones.map((drone) => (
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