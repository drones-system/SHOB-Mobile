import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { MarkerAnimated, AnimatedRegion } from 'react-native-maps';
import { Drone } from '../../types/types';
import DroneIcon from './DroneIcon';

export const droneClassificationColors = {
  ally: '#4084FF',
  unclassified: '#F0A023',
  enemy: '#DA3E3F',
};

interface DroneMarkerProps {
  drone: Drone;
}

export default function DroneMarker({ drone }: DroneMarkerProps) {
  const { coordinates } = drone.droneGeom;
  const latitude = coordinates[1];
  const longitude = coordinates[0];

  const coordinate = useRef(
    new AnimatedRegion({
      latitude,
      longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  ).current;

  useEffect(() => {
    coordinate.timing({
      latitude,
      longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
      duration: 1000,
      useNativeDriver: false,
      toValue: 0
    }).start();
  }, [latitude, longitude]);

  return (
    <MarkerAnimated
      coordinate={coordinate as any}
      anchor={{ x: 0.5, y: 0.5 }}
      style={{
        transform: [{ rotate: `${drone.heading || 0}deg` }]
      }}
    >
      <DroneIcon color={droneClassificationColors[drone.classification]} size={24} />
    </MarkerAnimated>
  );
}

const styles = StyleSheet.create({
});
