import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AnimatedRegion, MarkerAnimated } from 'react-native-maps';
import { Drone } from '../../types/types';
import DroneIcon from './DroneIcon';
import FocusedDroneIcon from './FocusedDroneIcon';

import { droneClassificationColors } from '../../constants/drone';

interface DroneMarkerProps {
  drone: Drone;
  isFocused: boolean;
  onPress: () => void;
}

export default function DroneComp({ drone, isFocused, onPress }: DroneMarkerProps) {
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

  const focusAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

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

  const color = droneClassificationColors[drone.classification];

  return (
    <MarkerAnimated
      coordinate={coordinate as any}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={(e: Event) => {
        if (e && e.stopPropagation) {
          e.stopPropagation();
        }
        onPress();
      }}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconContainer, { transform: [{ rotate: `${120}deg` }] }]}>
          <Animated.View style={[styles.absoluteIcon, { opacity: Animated.subtract(1, focusAnim), transform: [{ scale: Animated.add(1, Animated.multiply(focusAnim, 1.5)) }] }]}>
            <DroneIcon color={color} size={30} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.absoluteIcon, { opacity: focusAnim, transform: [{ scale: Animated.add(0.5, Animated.multiply(focusAnim, 0.5)) }] }]}>
            <FocusedDroneIcon color={color} size={75} />
          </Animated.View>
        </View>
      </View>
    </MarkerAnimated>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 75,
    height: 75,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  absoluteIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  }
});
