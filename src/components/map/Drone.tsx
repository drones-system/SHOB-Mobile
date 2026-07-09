import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AnimatedRegion, MarkerAnimated } from 'react-native-maps';
import { Drone } from '../../types/types';
import DroneIcon from './DroneIcon';
import FocusedDroneIcon from './FocusedDroneIcon';
import { useEasterEgg } from '../easter-egg/EasterEggContext';

import { droneClassificationColors } from '../../constants/drone';

import Eitan from '../../../assets/usvg/eitan.svg';
import Fogel from '../../../assets/usvg/fogel.svg';
import Sashusinka from '../../../assets/usvg/sashusinka.svg';
import Shahar from '../../../assets/usvg/shahar.svg';

const DEV_HEADS = [Eitan, Fogel, Sashusinka, Shahar] as const;

function getIndexFromId(id: string): number {
  if (!id) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % DEV_HEADS.length;
}

interface DroneMarkerProps {
  drone: Drone;
  isFocused: boolean;
  onPress: () => void;
}

export default function DroneComp({ drone, isFocused, onPress }: DroneMarkerProps) {
  const { funnyMode } = useEasterEgg();
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

  const easterIndex = getIndexFromId(drone.id);
  const DevHead = DEV_HEADS[easterIndex];
  const iconSize = funnyMode ? 30 * 1.5 : 30;
  const focusSize = funnyMode ? 75 * 1.5 : 75;

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
            {funnyMode ? (
              <DevHead width={iconSize} height={iconSize} />
            ) : (
              <DroneIcon color={color} size={iconSize} />
            )}
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.absoluteIcon, { opacity: focusAnim, transform: [{ scale: Animated.add(0.5, Animated.multiply(focusAnim, 0.5)) }] }]}>
            {funnyMode ? (
              <DevHead width={focusSize} height={focusSize} />
            ) : (
              <FocusedDroneIcon color={color} size={focusSize} />
            )}
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
