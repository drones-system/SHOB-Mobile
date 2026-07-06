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
import { useDeviceOrientation } from '@/hooks/use-device-orientation';
import { useDeviceTilt } from '@/hooks/use-device-tilt';
import { CameraView, useCameraPermissions } from 'expo-camera';

// ─── Design tokens derived from the ARGUS Figma design system ─────────────────
const Colors = {
  bgDeep: '#0A0018',
  bgCard: '#26193A',
  accent: '#E9D3FF',
  accentSoft: '#C387FF',
  accentBlue: '#4084FF',
  danger: '#DA372E',
  dangerSoft: 'rgba(220, 55, 46, 0.15)',
  white: '#FFFFFF',
  textMuted: 'rgba(233, 211, 255, 0.55)',
  inputBorder: 'rgba(195, 135, 255, 0.25)',
  successGreen: '#4CAF50',
  successSoft: 'rgba(76, 175, 80, 0.15)',
  sensorActive: 'rgba(64, 132, 255, 0.15)',
  sensorBorder: 'rgba(64, 132, 255, 0.4)',
} as const;

const FontFamily = Platform.select({ ios: 'System', default: 'sans-serif' });

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

// ─── Compass needle drawn in pure RN views ─────────────────────────────────
function CompassNeedle({ heading }: { heading: number }) {
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

// ─── Main page component ──────────────────────────────────────────────────────
export function ReportPage() {
  const [description, setDescription] = useState('');

  // 'pointing' = use compass/tilt; 'text' = manual description only
  const [reportingMode, setReportingMode] = useState<'pointing' | 'text'>('text');
  // heading that was locked in by the user
  const [lockedHeading, setLockedHeading] = useState<number | null>(null);
  const [lockedPitch, setLockedPitch] = useState<number | null>(null);
  const [lockedRoll, setLockedRoll] = useState<number | null>(null);
  const [lockedRotation, setLockedRotation] = useState<{ alpha: number; beta: number; gamma: number } | null>(null);
  const [lockedMagnetometer, setLockedMagnetometer] = useState<{ x: number; y: number; z: number } | null>(null);

  const location = useLocation();
  const orientation = useDeviceOrientation();
  const tilt = useDeviceTilt();
  const { isLoading, isSuccess, error, submitReport, reset } = useReportDrone();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Switch to pointing mode and start sensor streaming
  function activatePointingMode() {
    setReportingMode('pointing');
    setLockedHeading(null);
    setLockedPitch(null);
    setLockedRoll(null);
    setLockedRotation(null);
    setLockedMagnetometer(null);
    orientation.start();
    tilt.start();
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
  }

  // Lock in the current heading and tilt readings simultaneously
  function handleCapture() {
    if (orientation.heading !== null) {
      setLockedHeading(Math.round(orientation.heading));
      setLockedMagnetometer(orientation.rawData);
    }
    if (tilt.pitch !== null) {
      setLockedPitch(Math.round(tilt.pitch));
      setLockedRoll(Math.round(tilt.roll ?? 0));
      setLockedRotation(tilt.rawRotation);
    } else {
      // Fallback if tilt is not available/calibrated yet
      setLockedPitch(null);
      setLockedRoll(null);
      setLockedRotation(null);
    }
    orientation.stop();
    tilt.stop();
  }

  // Switch back to text mode and stop sensors
  function deactivatePointingMode() {
    orientation.stop();
    tilt.stop();
    setLockedHeading(null);
    setLockedPitch(null);
    setLockedRoll(null);
    setLockedRotation(null);
    setLockedMagnetometer(null);
    setReportingMode('text');
  }

  const isPointingMode = reportingMode === 'pointing';
  const hasLockedHeading = lockedHeading !== null;

  const canSubmit =
    !location.isLoading &&
    location.latitude !== null &&
    !isLoading &&
    (isPointingMode
      ? hasLockedHeading           // pointing mode: need a locked heading
      : description.trim().length > 0); // text mode: need a description

  async function handleSubmit() {
    if (!canSubmit || location.latitude === null || location.longitude === null) return;

    await submitReport({
      latitude: location.latitude,
      longitude: location.longitude,
      description: description.trim(),
      heading: lockedHeading ?? undefined,
      deviceMotionRotation: lockedRotation,
      magnetometer: lockedMagnetometer,
      reportingMode,
    });
  }

  function handleReset() {
    setDescription('');
    setLockedHeading(null);
    setLockedPitch(null);
    setLockedRoll(null);
    setLockedRotation(null);
    setLockedMagnetometer(null);
    setReportingMode('text');
    orientation.stop();
    tilt.stop();
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

          <View style={styles.divider} />

          {/* ── Your position ─────────────────────────────────────────────── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>YOUR POSITION</Text>
            <LocationBadge
              isLoading={location.isLoading}
              latitude={location.latitude}
              longitude={location.longitude}
              error={location.error}
            />
          </View>

          {/* ── Pointing mode card (only when magnetometer available) ──────── */}
          {!orientation.isCheckingAvailability && orientation.isAvailable && (
            <View style={[styles.sectionCard, isPointingMode && styles.sectionCardActive]}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionLabel}>POINTING MODE</Text>
                {/* Sensor chip */}
                <View style={styles.sensorChip}>
                  <Text style={styles.sensorChipText}>SENSOR AVAILABLE</Text>
                </View>
              </View>

              <Text style={styles.inputHint}>
                Point your phone directly at the drone and lock the direction.
                This gives HQ a precise bearing to the target.
              </Text>

              {/* Mode not yet activated */}
              {!isPointingMode && (
                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={activatePointingMode}
                  accessibilityRole="button"
                  accessibilityLabel="Activate pointing mode"
                >
                  <Text style={styles.outlineButtonText}>⊕  Point at Drone</Text>
                </TouchableOpacity>
              )}

              {/* Active pointing mode */}
              {isPointingMode && (
                <>
                  {/* Camera Viewfinder */}
                  {!hasLockedHeading && (
                    <View style={styles.cameraBox}>
                      {cameraPermission?.granted ? (
                        <CameraView style={styles.camera} facing="back">
                          {/* Crosshair Overlay */}
                          <View style={styles.crosshairContainer}>
                            <View style={styles.crosshairLineH} />
                            <View style={styles.crosshairLineV} />
                            <View style={styles.crosshairCircle}>
                              <View style={styles.crosshairCenter} />
                            </View>
                          </View>
                        </CameraView>
                      ) : (
                        <View style={{ alignItems: 'center', padding: 16 }}>
                          <Text style={styles.permissionText}>
                            Camera access is required for aiming at the drone.
                          </Text>
                          <TouchableOpacity
                            style={styles.permissionButton}
                            onPress={requestCameraPermission}
                          >
                            <Text style={styles.permissionButtonText}>Grant Permission</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Compass & Tilt Indicators */}
                  {!hasLockedHeading && (
                    <>
                      {orientation.heading !== null ? (
                        <CompassNeedle heading={orientation.heading} />
                      ) : (
                        <View style={styles.compassPlaceholder}>
                          <ActivityIndicator color={Colors.accentBlue} />
                          <Text style={styles.locationBadgeText}>Calibrating sensors…</Text>
                        </View>
                      )}

                      {/* Live sensor readout (Heading + Pitch + Roll) */}
                      <View style={styles.tiltRow}>
                        {orientation.heading !== null && (
                          <View style={styles.tiltMetric}>
                            <Text style={styles.tiltVal}>
                              {Math.round(orientation.heading)}° {orientation.cardinalDirection}
                            </Text>
                            <Text style={styles.tiltLabel}>HEADING</Text>
                          </View>
                        )}

                        {tilt.isAvailable && tilt.pitch !== null && (
                          <View style={styles.tiltMetric}>
                            <Text style={styles.tiltVal}>{Math.round(tilt.pitch)}°</Text>
                            <Text style={styles.tiltLabel}>ELEVATION</Text>
                            {/* Horizontal progress bar representing elevation/pitch */}
                            <View style={styles.elevationBarContainer}>
                              <View
                                style={[
                                  styles.elevationBarFill,
                                  {
                                    width: `${((tilt.pitch + 90) / 180) * 100}%`,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        )}

                        {tilt.isAvailable && tilt.roll !== null && (
                          <View style={styles.tiltMetric}>
                            <Text style={styles.tiltVal}>{Math.round(tilt.roll)}°</Text>
                            <Text style={styles.tiltLabel}>ROLL</Text>
                          </View>
                        )}
                      </View>

                      {/* Capture button */}
                      <TouchableOpacity
                        style={[
                          styles.primaryButton,
                          styles.blueButton,
                          orientation.heading === null && styles.primaryButtonDisabled,
                        ]}
                        onPress={handleCapture}
                        disabled={orientation.heading === null}
                        accessibilityRole="button"
                        accessibilityLabel="Capture drone direction and tilt"
                      >
                        <Text style={styles.primaryButtonText}>📷  Capture Sighting</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Locked direction and tilt display */}
                  {hasLockedHeading && (
                    <View style={styles.lockedHeadingCard}>
                      <Text style={styles.lockedIcon}>📷</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lockedLabel}>Sighting Captured</Text>
                        <Text style={styles.lockedValue}>
                          Bearing: {lockedHeading}° {orientation.cardinalDirection ?? ''}
                        </Text>
                        {lockedPitch !== null && (
                          <Text style={styles.lockedSubValue}>
                            Elevation: {lockedPitch}° | Roll: {lockedRoll}°
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setLockedHeading(null);
                          setLockedPitch(null);
                          setLockedRoll(null);
                          setLockedRotation(null);
                          setLockedMagnetometer(null);
                          orientation.start();
                          tilt.start();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Re-aim"
                      >
                        <Text style={styles.reAimText}>Re-aim</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Optional description even in pointing mode */}
                  <Text style={[styles.sectionLabel, { marginTop: 4 }]}>
                    ADDITIONAL NOTES (OPTIONAL)
                  </Text>
                  <TextInput
                    style={[styles.textArea, { minHeight: 70 }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Any other details about the drone…"
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    maxLength={300}
                    textAlignVertical="top"
                    accessibilityLabel="Additional notes"
                  />

                  {/* Cancel pointing mode */}
                  <TouchableOpacity
                    style={styles.ghostButton}
                    onPress={deactivatePointingMode}
                    accessibilityRole="button"
                    accessibilityLabel="Switch to text mode"
                  >
                    <Text style={styles.ghostButtonText}>Use text description instead</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ── Text description (always shown in text mode; sensor unavailable) ── */}
          {(!isPointingMode) && (
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
              <Text style={styles.charCount}>{description.length} / 500</Text>
            </View>
          )}

          {/* ── Unavailable notice ────────────────────────────────────────── */}
          {!orientation.isCheckingAvailability && !orientation.isAvailable && (
            <View style={styles.unavailableBanner}>
              <Text style={styles.unavailableBannerText}>
                ⓘ  Compass sensor not available on this device — use the text description above.
              </Text>
            </View>
          )}

          {/* ── Error banner ─────────────────────────────────────────────── */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠ {error}</Text>
            </View>
          )}

          {/* ── Submit ───────────────────────────────────────────────────── */}
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
                  { color: Colors.bgCard },
                  !canSubmit && styles.primaryButtonTextDisabled,
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
const COMPASS_SIZE = 160;
const NEEDLE_LENGTH = 56; // half-needle length

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.bgDeep },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },

  // Header
  header: { alignItems: 'flex-end', gap: 8, paddingTop: 16 },
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
    lineHeight: 19,
    fontFamily: FontFamily,
    textAlign: 'right',
    opacity: 0.75,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.accentSoft,
    opacity: 0.4,
    marginVertical: 4,
  },

  // Section cards
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderColor: Colors.inputBorder,
    borderWidth: 0.7,
    padding: 16,
    gap: 10,
  },
  sectionCardActive: {
    borderColor: Colors.accentBlue,
    borderWidth: 1,
    backgroundColor: 'rgba(10, 0, 24, 0.95)',
  },
  sectionLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: Colors.accentSoft,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: FontFamily,
    textAlign: 'right',
  },

  // Sensor available chip
  sensorChip: {
    backgroundColor: Colors.sensorActive,
    borderColor: Colors.sensorBorder,
    borderWidth: 0.7,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sensorChipText: {
    color: Colors.accentBlue,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: FontFamily,
  },

  // Location badge
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

  // Compass
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

  compassPlaceholder: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },

  // Heading readout
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: 8,
  },
  headingDegree: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '700',
    fontFamily: FontFamily,
  },
  headingCardinal: {
    color: Colors.accentSoft,
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FontFamily,
  },

  // Locked heading display
  lockedHeadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sensorActive,
    borderColor: Colors.sensorBorder,
    borderWidth: 0.8,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  lockedIcon: { color: Colors.accentBlue, fontSize: 22 },
  lockedLabel: {
    color: Colors.accentSoft,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: FontFamily,
  },
  lockedValue: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FontFamily,
  },
  reAimText: {
    color: Colors.accentBlue,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FontFamily,
  },

  // Unavailable notice
  unavailableBanner: {
    backgroundColor: 'rgba(195,135,255,0.08)',
    borderColor: Colors.inputBorder,
    borderWidth: 0.7,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  unavailableBannerText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: FontFamily,
    lineHeight: 16,
    textAlign: 'right',
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

  // Buttons
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 6,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  blueButton: { backgroundColor: Colors.accentBlue },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FontFamily,
    letterSpacing: 0.5,
  },
  primaryButtonTextDisabled: {},
  outlineButton: {
    borderColor: Colors.accentBlue,
    borderWidth: 1,
    borderRadius: 6,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    color: Colors.accentBlue,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FontFamily,
  },
  ghostButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  ghostButtonText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: FontFamily,
    textDecorationLine: 'underline',
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
  cameraBox: {
    height: 180,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  crosshairContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(233, 211, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentBlue,
  },
  crosshairLineH: {
    width: 64,
    height: 1.5,
    backgroundColor: 'rgba(233, 211, 255, 0.4)',
    position: 'absolute',
  },
  crosshairLineV: {
    width: 1.5,
    height: 64,
    backgroundColor: 'rgba(233, 211, 255, 0.4)',
    position: 'absolute',
  },
  permissionText: {
    color: Colors.accent,
    fontSize: 12,
    fontFamily: FontFamily,
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.accentSoft,
  },
  permissionButtonText: {
    color: Colors.bgDeep,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FontFamily,
  },
  tiltRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  tiltMetric: {
    alignItems: 'center',
    gap: 4,
  },
  tiltVal: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FontFamily,
  },
  tiltLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FontFamily,
  },
  elevationBarContainer: {
    width: 120,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  elevationBarFill: {
    height: '100%',
    backgroundColor: Colors.accentBlue,
    borderRadius: 6,
  },
  lockedSubValue: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: FontFamily,
    marginTop: 2,
  },
});
