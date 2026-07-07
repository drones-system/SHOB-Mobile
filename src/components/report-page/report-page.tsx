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
import { useCameraPermissions } from 'expo-camera';

import { Colors, FontFamily } from './constants';
import { CaptureModal } from './capture-modal';
import { SuccessView } from './success-view';

export function ReportPage() {
  const [description, setDescription] = useState('');
  const [captureModalVisible, setCaptureModalVisible] = useState(false);

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

  // ── Open capture modal ────────────────────────────────────────────────────
  function openCapture() {
    orientation.start();
    tilt.start();
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
    setCaptureModalVisible(true);
  }

  // ── Lock heading/tilt and close modal ─────────────────────────────────────
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
      setLockedPitch(null);
      setLockedRoll(null);
      setLockedRotation(null);
    }
    orientation.stop();
    tilt.stop();
    setCaptureModalVisible(false);
  }

  // ── Close modal without capturing ─────────────────────────────────────────
  function closeCapture() {
    orientation.stop();
    tilt.stop();
    setCaptureModalVisible(false);
  }

  const hasCapture = lockedHeading !== null;

  // Capture is only possible when camera is granted AND both sensors are available.
  // While availability is still being checked we also disable (to avoid a flash of enabled state).
  const canCapture =
    cameraPermission?.granted === true &&
    !orientation.isCheckingAvailability &&
    orientation.isAvailable &&
    !tilt.isCheckingAvailability &&
    tilt.isAvailable;

  const canSubmit =
    !location.isLoading &&
    location.latitude !== null &&
    !isLoading &&
    description.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit || location.latitude === null || location.longitude === null) return;

    await submitReport({
      latitude: location.latitude,
      longitude: location.longitude,
      description: description.trim(),
      heading: lockedHeading ?? undefined,
      deviceMotionRotation: lockedRotation,
      magnetometer: lockedMagnetometer,
      reportingMode: hasCapture ? 'pointing' : 'text',
    });
  }

  function handleReset() {
    setDescription('');
    setLockedHeading(null);
    setLockedPitch(null);
    setLockedRoll(null);
    setLockedRotation(null);
    setLockedMagnetometer(null);
    orientation.stop();
    tilt.stop();
    reset();
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (isSuccess) {
    return <SuccessView onReset={handleReset} />;
  }

  // ── Location display string ────────────────────────────────────────────────
  const locationText =
    location.isLoading
      ? 'Acquiring GPS…'
      : location.latitude !== null && location.longitude !== null
      ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
      : location.error ?? 'Location unavailable';

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
          {/* ── Page Title ───────────────────────────────────────────────── */}
          <Text style={styles.pageTitle}>דיווח הרחפן</Text>

          {/* ── Location row ─────────────────────────────────────────────── */}
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>הנ"צ הנוכחי של הרחפן הוא:</Text>
            <View style={styles.locationPill}>
              {location.isLoading ? (
                <ActivityIndicator size="small" color={Colors.bgDeep} style={{ marginRight: 6 }} />
              ) : (
                <View style={styles.locationDot} />
              )}
              <Text style={styles.locationPillText}>{locationText}</Text>
            </View>
          </View>

          {/* ── Capture button ───────────────────────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.captureButton,
              hasCapture && styles.captureButtonDone,
              !canCapture && !hasCapture && styles.captureButtonDisabled,
            ]}
            onPress={openCapture}
            disabled={!canCapture && !hasCapture}
            accessibilityRole="button"
            accessibilityLabel={hasCapture ? 'Re-capture drone direction' : 'Capture drone direction'}
            accessibilityState={{ disabled: !canCapture && !hasCapture }}
          >
            <Text style={styles.captureButtonIcon}>{hasCapture ? '📷' : '⊕'}</Text>
            <Text style={[styles.captureButtonText, !canCapture && !hasCapture && styles.captureButtonTextDisabled]}>
              {hasCapture
                ? `סיכול נלכד ◦ ${lockedHeading}°${lockedPitch !== null ? ` · ${lockedPitch}° elevation` : ''}`
                : !canCapture
                ? 'Camera / sensors unavailable'
                : 'כוון וצלם את הרחפן'}
            </Text>
          </TouchableOpacity>

          {/* ── Event description card ───────────────────────────────────── */}
          <View style={styles.descriptionCard}>
            {/* Card header */}
            <View style={styles.descriptionCardHeader}>
              <Text style={styles.descriptionCardTitle}>תיאור אירוע</Text>
              <Text style={styles.descriptionCardHint}>
                תאר את נראות הרחפן, כיוון תנועה, כל מידע שיכול להוסיף לאירוע.
              </Text>
            </View>

            {/* Dark inner text area */}
            <View style={styles.textAreaWrap}>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="רחפן שחור, נע בצורה חריגה, תנועות חדות, נע לכיוון מזרח..."
                placeholderTextColor="rgba(189,189,189,0.69)"
                multiline
                numberOfLines={6}
                maxLength={500}
                textAlignVertical="top"
                textAlign="right"
                accessibilityLabel="Drone sighting description"
              />
            </View>
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
              styles.submitButton,
              (!canSubmit || isLoading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Submit drone report"
            accessibilityState={{ disabled: !canSubmit || isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.bgCard} />
            ) : (
              <Text style={styles.submitButtonText}>שלח דיווח</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Full-screen camera capture modal ─────────────────────────────── */}
      <CaptureModal
        visible={captureModalVisible}
        cameraPermission={cameraPermission}
        requestCameraPermission={requestCameraPermission}
        onCapture={handleCapture}
        onClose={closeCapture}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.bgCard },
  scrollContent: {
    // ~95% width: 2.5% padding each side
    paddingHorizontal: '2.5%',
    paddingTop: 24,
    paddingBottom: 56,
    gap: 20,
    alignItems: 'flex-end',
  },

  // Page title
  pageTitle: {
    color: Colors.white,
    fontFamily: FontFamily,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'right',
    alignSelf: 'flex-end',
  },

  // Location row
  locationRow: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    gap: 8,
  },
  locationLabel: {
    color: Colors.accent,
    fontFamily: FontFamily,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.bgCard,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignSelf: 'stretch',
    gap: 10,
  },
  locationDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.accentBlue,
  },
  locationPillText: {
    color: Colors.bgDeep,
    fontFamily: FontFamily,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },

  // Capture button
  captureButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.accentBlue,
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: Colors.sensorActive,
    minHeight: 60,
  },
  captureButtonDone: {
    borderColor: Colors.successGreen,
    backgroundColor: Colors.successSoft,
  },
  captureButtonDisabled: {
    opacity: 0.38,
    borderColor: Colors.textMuted,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  captureButtonIcon: {
    fontSize: 22,
  },
  captureButtonText: {
    color: Colors.white,
    fontFamily: FontFamily,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  captureButtonTextDisabled: {
    color: Colors.textMuted,
  },

  // Description card
  descriptionCard: {
    alignSelf: 'stretch',
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.bgCard,
    borderRadius: 8,
    overflow: 'hidden',
  },
  descriptionCardHeader: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 10,
    gap: 5,
    alignItems: 'flex-end',
  },
  descriptionCardTitle: {
    color: Colors.bgDeep,
    fontFamily: FontFamily,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  descriptionCardHint: {
    color: Colors.bgCard,
    fontFamily: FontFamily,
    fontSize: 11,
    textAlign: 'right',
    lineHeight: 16,
  },
  textAreaWrap: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 8,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
  },
  textArea: {
    color: Colors.accent,
    fontFamily: FontFamily,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 190,
    textAlignVertical: 'top',
  },

  // Error banner
  errorBanner: {
    alignSelf: 'stretch',
    backgroundColor: Colors.dangerSoft,
    borderColor: Colors.danger,
    borderWidth: 0.7,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: 14,
    fontFamily: FontFamily,
    textAlign: 'right',
  },

  // Submit button
  submitButton: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(233, 211, 255, 0.64)',
    borderRadius: 8,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: Colors.bgCard,
    fontFamily: FontFamily,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
