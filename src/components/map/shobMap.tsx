import { useDroneSocket } from '@/hooks/use-websocket';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle } from 'react-native-maps';
import { useToast } from "react-native-toast-notifications";
import MapActionButtons from './actionButtons/ActionsButtons';
import DroneComp from './Drone';

export default function ShobMap() {
  const { snapshot, updateLocation, isConnected } = useDroneSocket({ url: 'http://localhost:3000' });
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  // const [drones, setDrones] = useState<Drone[]>([]);
  const [focusedDroneId, setFocusedDroneId] = useState<string | null>(null);
  const toast = useToast();

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