import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLocation } from '@/hooks/use-location';
import { useReportDrone } from '@/hooks/use-report-drone';

// ─── Design tokens derived from the ARGUS Figma design system ─────────────────
const Colors = {
  bgDeep: '#0A0018',        // deep navy/black used in input backgrounds
  bgCard: '#26193A',        // main dark-purple surface
  bgOverlay: 'rgba(38, 25, 58, 0.92)',
  accent: '#E9D3FF',        // lavender – primary text and button fill
  accentSoft: '#C387FF',    // mid-purple – borders, dividers, secondary labels
  danger: '#DA372E',        // critical-alert red
  dangerSoft: 'rgba(220, 55, 46, 0.15)',
  white: '#FFFFFF',
  textMuted: 'rgba(233, 211, 255, 0.55)',
  inputBorder: 'rgba(195, 135, 255, 0.25)',
  successGreen: '#4CAF50',
  successSoft: 'rgba(76, 175, 80, 0.15)',
} as const;

const FontFamily = Platform.select({
  ios: 'System',
  default: 'sans-serif',
});

// ─── Location status badge ────────────────────────────────────────────────────
function LocationBadge({
  isLoading,
  latitude,
  longitude,
  error,
}: {
  isLoading: boolean;
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}) {
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

// ─── Main page component ──────────────────────────────────────────────────────
export function ReportPage() {
  const [description, setDescription] = useState('');

  const location = useLocation();
  const { isLoading, isSuccess, error, submitReport, reset } = useReportDrone();

  const canSubmit =
    description.trim().length > 0 &&
    !location.isLoading &&
    location.latitude !== null &&
    !isLoading;

  async function handleSubmit() {
    if (!canSubmit || location.latitude === null || location.longitude === null)
      return;

    await submitReport({
      latitude: location.latitude,
      longitude: location.longitude,
      description: description.trim(),
    });
  }

  function handleReset() {
    setDescription('');
    reset();
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (isSuccess) {
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
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="Submit another report"
          >
            <Text style={styles.secondaryButtonText}>Report Another</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Report form ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ───────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>UNDETECTED</Text>
            </View>
            <Text style={styles.headerTitle}>Report Drone</Text>
            <Text style={styles.headerSubtitle}>
              Report an undetected drone sighting to the command center.
              Your GPS location will be attached automatically.
            </Text>
          </View>

          {/* ── Divider ──────────────────────────────────────────────────── */}
          <View style={styles.divider} />

          {/* ── Location card ─────────────────────────────────────────────── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>YOUR POSITION</Text>
            <LocationBadge
              isLoading={location.isLoading}
              latitude={location.latitude}
              longitude={location.longitude}
              error={location.error}
            />
          </View>

          {/* ── Description input ─────────────────────────────────────────── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>SIGHTING DESCRIPTION</Text>
            <Text style={styles.inputHint}>
              Describe the drone's appearance, direction, altitude, and any
              distinguishing features.
            </Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Black quadcopter, heading south-east at ~150m altitude, no visible markings…"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={6}
              maxLength={500}
              textAlignVertical="top"
              accessibilityLabel="Drone sighting description"
              accessibilityHint="Describe what you observed about the drone"
            />
            <Text style={styles.charCount}>
              {description.length} / 500
            </Text>
          </View>

          {/* ── Error banner ─────────────────────────────────────────────── */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠ {error}</Text>
            </View>
          )}

          {/* ── Submit button ─────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!canSubmit || isLoading) && styles.primaryButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Submit drone report"
            accessibilityState={{ disabled: !canSubmit || isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.bgDeep} />
            ) : (
              <Text
                style={[
                  styles.primaryButtonText,
                  (!canSubmit) && styles.primaryButtonTextDisabled,
                ]}
              >
                Submit Report
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By submitting, you confirm this is an actual sighting and consent to
            sharing your location with the ARGUS command center.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },

  // Header
  header: {
    alignItems: 'flex-end', // RTL-friendly – labels sit right
    gap: 8,
    paddingTop: 16,
  },
  headerBadge: {
    backgroundColor: Colors.dangerSoft,
    borderColor: Colors.danger,
    borderWidth: 0.8,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  headerBadgeText: {
    color: Colors.danger,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: FontFamily,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: FontFamily,
    textAlign: 'right',
  },
  headerSubtitle: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: FontFamily,
    textAlign: 'right',
    opacity: 0.75,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.accentSoft,
    opacity: 0.4,
    marginVertical: 4,
  },

  // Section card
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderColor: Colors.inputBorder,
    borderWidth: 0.7,
    padding: 16,
    gap: 10,
  },
  sectionLabel: {
    color: Colors.accentSoft,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: FontFamily,
    textAlign: 'right',
  },

  // Location badge variants
  locationBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationBadgeLoading: {
    backgroundColor: 'rgba(195,135,255,0.1)',
  },
  locationBadgeError: {
    backgroundColor: Colors.dangerSoft,
  },
  locationBadgeSuccess: {
    backgroundColor: 'rgba(195,135,255,0.1)',
  },
  locationBadgeText: {
    color: Colors.accent,
    fontSize: 12,
    fontFamily: FontFamily,
    flexShrink: 1,
  },
  locationErrorIcon: {
    color: Colors.danger,
    fontSize: 14,
  },
  locationSuccessIcon: {
    color: Colors.accentSoft,
    fontSize: 14,
  },

  // Text input
  inputHint: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: FontFamily,
    lineHeight: 16,
    textAlign: 'right',
  },
  textArea: {
    backgroundColor: Colors.bgDeep,
    borderColor: Colors.inputBorder,
    borderWidth: 0.7,
    borderRadius: 6,
    color: Colors.accent,
    fontSize: 13,
    fontFamily: FontFamily,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 130,
    textAlign: 'right',
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: FontFamily,
    textAlign: 'left',
  },

  // Error banner
  errorBanner: {
    backgroundColor: Colors.dangerSoft,
    borderColor: Colors.danger,
    borderWidth: 0.7,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: 12,
    fontFamily: FontFamily,
    textAlign: 'right',
  },

  // Primary button
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 6,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: Colors.bgCard,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FontFamily,
    letterSpacing: 0.5,
  },
  primaryButtonTextDisabled: {
    color: Colors.bgCard,
  },

  // Disclaimer
  disclaimer: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: FontFamily,
    lineHeight: 15,
    textAlign: 'center',
  },

  // Success screen
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
  successIconText: {
    color: Colors.successGreen,
    fontSize: 32,
    fontWeight: '700',
  },
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
