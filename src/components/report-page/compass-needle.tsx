import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily } from './constants';

const COMPASS_SIZE = 160;
const NEEDLE_LENGTH = 56; // half-needle length

interface CompassNeedleProps {
  heading: number;
}

export function CompassNeedle({ heading }: CompassNeedleProps) {
  // Needle rotates; pointer arrow is at the top, so subtract 90° so 0° = North
  const rotation = `${heading}deg`;
  return (
    <View style={styles.compassOuter}>
      {/* Cardinal labels */}
      <Text style={[styles.cardinalLabel, styles.cardinalN]}>N</Text>
      <Text style={[styles.cardinalLabel, styles.cardinalE]}>E</Text>
      <Text style={[styles.cardinalLabel, styles.cardinalS]}>S</Text>
      <Text style={[styles.cardinalLabel, styles.cardinalW]}>W</Text>

      {/* Ring */}
      <View style={styles.compassRing}>
        {/* Needle */}
        <View style={[styles.needleWrap, { transform: [{ rotate: rotation }] }]}>
          {/* North tip (blue) */}
          <View style={styles.needleNorth} />
          {/* South tip (muted) */}
          <View style={styles.needleSouth} />
        </View>
        {/* Centre dot */}
        <View style={styles.compassCenter} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compassOuter: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassRing: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 1.5,
    borderColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(64,132,255,0.06)',
  },
  needleWrap: {
    position: 'absolute',
    width: 4,
    height: NEEDLE_LENGTH * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleNorth: {
    width: 4,
    height: NEEDLE_LENGTH,
    backgroundColor: Colors.accentBlue,
    borderRadius: 2,
  },
  needleSouth: {
    width: 4,
    height: NEEDLE_LENGTH,
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
  },
  compassCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accentBlue,
    position: 'absolute',
  },
  cardinalLabel: {
    position: 'absolute',
    color: Colors.accentSoft,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FontFamily,
  },
  cardinalN: { top: 4, alignSelf: 'center' },
  cardinalS: { bottom: 4, alignSelf: 'center' },
  cardinalE: { right: 4 },
  cardinalW: { left: 4 },
});
