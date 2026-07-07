import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, FontFamily } from './constants';

interface LocationBadgeProps {
  isLoading: boolean;
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

export function LocationBadge({
  isLoading,
  latitude,
  longitude,
  error,
}: LocationBadgeProps) {
  if (isLoading) {
    return (
      <View style={[styles.locationBadge, styles.locationBadgeLoading]}>
        <ActivityIndicator size="small" color={Colors.accentSoft} />
        <Text style={styles.locationBadgeText}>Acquiring GPS position…</Text>
      </View>
    );
  }
  if (error || !latitude || !longitude) {
    return (
      <View style={[styles.locationBadge, styles.locationBadgeError]}>
        <Text style={styles.locationErrorIcon}>⚠</Text>
        <Text style={[styles.locationBadgeText, { color: Colors.danger }]}>
          {error ?? 'Location unavailable'}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.locationBadge, styles.locationBadgeSuccess]}>
      <Text style={styles.locationSuccessIcon}>◎</Text>
      <Text style={[styles.locationBadgeText, { color: Colors.accentSoft }]}>
        {latitude.toFixed(5)}°, {longitude.toFixed(5)}°
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  locationBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationBadgeLoading: { backgroundColor: 'rgba(195,135,255,0.1)' },
  locationBadgeError: { backgroundColor: Colors.dangerSoft },
  locationBadgeSuccess: { backgroundColor: 'rgba(195,135,255,0.1)' },
  locationBadgeText: { color: Colors.accent, fontSize: 12, fontFamily: FontFamily, flexShrink: 1 },
  locationErrorIcon: { color: Colors.danger, fontSize: 14 },
  locationSuccessIcon: { color: Colors.accentSoft, fontSize: 14 },
});
