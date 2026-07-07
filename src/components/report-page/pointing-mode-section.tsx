import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Colors, FontFamily } from './constants';
import { CompassNeedle } from './compass-needle';
import { useDeviceOrientation } from '@/hooks/use-device-orientation';
import { useDeviceTilt } from '@/hooks/use-device-tilt';

interface PointingModeSectionProps {
  isPointingMode: boolean;
  lockedHeading: number | null;
  lockedPitch: number | null;
  lockedRoll: number | null;
  orientation: ReturnType<typeof useDeviceOrientation>;
  tilt: ReturnType<typeof useDeviceTilt>;
  cameraPermission: any;
  requestCameraPermission: () => Promise<any>;
  activatePointingMode: () => void;
  deactivatePointingMode: () => void;
  handleCapture: () => void;
  onReAim: () => void;
  description: string;
  onChangeDescription: (text: string) => void;
}

export function PointingModeSection({
  isPointingMode,
  lockedHeading,
  lockedPitch,
  lockedRoll,
  orientation,
  tilt,
  cameraPermission,
  requestCameraPermission,
  activatePointingMode,
  deactivatePointingMode,
  handleCapture,
  onReAim,
  description,
  onChangeDescription,
}: PointingModeSectionProps) {
  const hasLockedHeading = lockedHeading !== null;

  return (
    <View style={[styles.sectionCard, isPointingMode && styles.sectionCardActive]}>
      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>POINTING MODE</Text>
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
                onPress={onReAim}
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
            onChangeText={onChangeDescription}
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
  );
}

const styles = StyleSheet.create({
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
  inputHint: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: FontFamily,
    lineHeight: 16,
    textAlign: 'right',
  },
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
  compassPlaceholder: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  locationBadgeText: {
    color: Colors.accent,
    fontSize: 12,
    fontFamily: FontFamily,
    flexShrink: 1,
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
    color: Colors.white,
  },
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
  lockedSubValue: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: FontFamily,
    marginTop: 2,
  },
  reAimText: {
    color: Colors.accentBlue,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FontFamily,
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
});
