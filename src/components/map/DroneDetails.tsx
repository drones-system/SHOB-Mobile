import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { droneClassificationColors, droneClassificationNames } from '../../constants/drone';
import { Drone } from '../../types/types';

interface DroneDetailsProps {
  drone: Drone;
}

export default function DroneDetails({ drone }: DroneDetailsProps) {
  const color = droneClassificationColors[drone.classification] || '#FFF';
  const title = droneClassificationNames[drone.classification] || 'לא מזוהה';

  const latitude = drone.droneGeom.coordinates[1].toFixed(5);
  const longitude = drone.droneGeom.coordinates[0].toFixed(5);
  const altitude = Math.round(drone.altitude);

  // Calculate speed assuming velocity is in m/s, converting to km/h
  const speed = Math.round(Math.sqrt(Math.pow(drone.velocityNorth || 0, 2) + Math.pow(drone.velocityEast || 0, 2)) * 3.6);
  const heading = Math.round(drone.heading || 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderRightColor: color, borderRightWidth: 6 }]}>
        <View style={styles.titleContainer}>
          <View>
            <View style={styles.nameContainer}>
              <Text style={styles.title}>{drone.type}</Text>
              <Text style={[styles.box, { backgroundColor: color }]}>{title}</Text>
            </View>
            <Text style={styles.subtitle}>רחפן {title}</Text>
          </View>
          <Feather name="alert-circle" color={color} size={30}></Feather>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>מזהה</Text>
          <Text style={styles.value}>{drone.trackId}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>גובה</Text>
          <Text style={styles.value}>{altitude} מ׳</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>מהירות</Text>
          <Text style={styles.value}>{speed} קמ״ש</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>כיוון</Text>
          <Text style={styles.value}>{heading}°</Text>
        </View>
      </View>

      <View style={styles.locationRow}>
        <Text style={styles.label}>נ.צ.</Text>
        <Text style={styles.value}>{latitude}°, {longitude}°</Text>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    alignSelf: 'center',
    width: width * 0.9,
    backgroundColor: 'rgba(15, 17, 21, 0.92)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    padding: 16,
  },
  header: {
    marginBottom: 16,
    paddingRight: 12, // Since border is on the right
  },
  titleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: 'white',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A8D93',
    marginTop: 4,
    textAlign: 'right',
  },
  detailsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  gridItem: {
    width: '45%',
    marginBottom: 12,
    alignItems: 'flex-start', // Because row-reverse, flex-start will be right side conceptually? Wait, if row-reverse, flex-start might be on the right or left? Actually alignItems 'flex-start' will just align to the top. To align text to right, we use alignItems: 'flex-end' or just textAlign: 'right'
  },
  locationRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 13,
    color: '#8A8D93',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'right',
  },
  value: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  nameContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12
  },
  box: {
    fontFamily: 'Rubik',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 13.5112,
    lineHeight: 16,
    color: '#FFFFFF',
    padding: 5,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 5,
    flexGrow: 0,
  }
});
