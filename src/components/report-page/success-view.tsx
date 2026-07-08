import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily } from './constants';

interface SuccessViewProps {
  onReset: () => void;
}

export function SuccessView({ onReset }: SuccessViewProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.successContainer}>
        <View style={styles.successIconWrap}>
          <Text style={styles.successIconText}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Report Submitted</Text>
        <Text style={styles.successSubtitle}>
          Your sighting has been reported to the command center. Stay alert.
        </Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onReset}
          accessibilityRole="button"
          accessibilityLabel="Submit another report"
        >
          <Text style={styles.secondaryButtonText}>Report Another</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgDeep },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
    backgroundColor: Colors.bgDeep,
  },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.successSoft,
    borderColor: Colors.successGreen,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successIconText: { color: Colors.successGreen, fontSize: 32, fontWeight: '700' },
  successTitle: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: FontFamily,
    textAlign: 'center',
  },
  successSubtitle: {
    color: Colors.accent,
    fontSize: 14,
    fontFamily: FontFamily,
    lineHeight: 20,
    textAlign: 'center',
    opacity: 0.75,
  },
  secondaryButton: {
    marginTop: 8,
    borderColor: Colors.accentSoft,
    borderWidth: 0.8,
    borderRadius: 6,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FontFamily,
  },
});
