import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Colors, FontFamily } from './constants';

interface CaptureModalProps {
  visible: boolean;
  cameraPermission: any;
  requestCameraPermission: () => Promise<any>;
  onCapture: () => void;
  onClose: () => void;
}

// ── Targeting frame constants ────────────────────────────────────────────────
const TARGET_W = 285;
const TARGET_H = 244;
const TARGET_BORDER_RADIUS = 24;
// Corner bracket arm length and thickness
const ARM_LEN = 48;
const ARM_THICK = 4;
// The dim color applied outside the target box
const DIM = 'rgba(10, 0, 24, 0.62)';

export function CaptureModal({
  visible,
  cameraPermission,
  requestCameraPermission,
  onCapture,
  onClose,
}: CaptureModalProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();

  // Calculate the vertical centre of the target box
  const targetTop = Math.round(screenH * 0.32);
  const targetLeft = Math.round((screenW - TARGET_W) / 2);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* ── Camera background (full screen) ──────────────────────── */}
        {cameraPermission?.granted ? (
          <CameraView style={StyleSheet.absoluteFillObject} facing="back" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.noCamera]}>
            <ActivityIndicator color={Colors.accentSoft} size="large" />
          </View>
        )}

        {/* ── Dark overlay with rounded cutout ─────────────────────── */}
        <View
          pointerEvents="none"
          style={[
            styles.overlayCutout,
            {
              top: targetTop - 2000,
              left: targetLeft - 2000,
            },
          ]}
        />

        {/* ── Corner L-brackets (red, rounded caps) ────────────────── */}

        {/* Top-Left corner */}
        <View
          pointerEvents="none"
          style={[
            styles.cornerBracket,
            {
              top: targetTop,
              left: targetLeft,
              borderTopWidth: ARM_THICK,
              borderLeftWidth: ARM_THICK,
              borderTopLeftRadius: TARGET_BORDER_RADIUS,
            },
          ]}
        >
          {/* Round end cap for horizontal arm */}
          <View style={[styles.endCap, { top: -ARM_THICK, right: -ARM_THICK / 2 }]} />
          {/* Round end cap for vertical arm */}
          <View style={[styles.endCap, { bottom: -ARM_THICK / 2, left: -ARM_THICK }]} />
        </View>

        {/* Top-Right corner */}
        <View
          pointerEvents="none"
          style={[
            styles.cornerBracket,
            {
              top: targetTop,
              left: targetLeft + TARGET_W - ARM_LEN,
              borderTopWidth: ARM_THICK,
              borderRightWidth: ARM_THICK,
              borderTopRightRadius: TARGET_BORDER_RADIUS,
            },
          ]}
        >
          {/* Round end cap for horizontal arm */}
          <View style={[styles.endCap, { top: -ARM_THICK, left: -ARM_THICK / 2 }]} />
          {/* Round end cap for vertical arm */}
          <View style={[styles.endCap, { bottom: -ARM_THICK / 2, right: -ARM_THICK }]} />
        </View>

        {/* Bottom-Left corner */}
        <View
          pointerEvents="none"
          style={[
            styles.cornerBracket,
            {
              top: targetTop + TARGET_H - ARM_LEN,
              left: targetLeft,
              borderBottomWidth: ARM_THICK,
              borderLeftWidth: ARM_THICK,
              borderBottomLeftRadius: TARGET_BORDER_RADIUS,
            },
          ]}
        >
          {/* Round end cap for horizontal arm */}
          <View style={[styles.endCap, { bottom: -ARM_THICK, right: -ARM_THICK / 2 }]} />
          {/* Round end cap for vertical arm */}
          <View style={[styles.endCap, { top: -ARM_THICK / 2, left: -ARM_THICK }]} />
        </View>

        {/* Bottom-Right corner */}
        <View
          pointerEvents="none"
          style={[
            styles.cornerBracket,
            {
              top: targetTop + TARGET_H - ARM_LEN,
              left: targetLeft + TARGET_W - ARM_LEN,
              borderBottomWidth: ARM_THICK,
              borderRightWidth: ARM_THICK,
              borderBottomRightRadius: TARGET_BORDER_RADIUS,
            },
          ]}
        >
          {/* Round end cap for horizontal arm */}
          <View style={[styles.endCap, { bottom: -ARM_THICK, left: -ARM_THICK / 2 }]} />
          {/* Round end cap for vertical arm */}
          <View style={[styles.endCap, { top: -ARM_THICK / 2, right: -ARM_THICK }]} />
        </View>

        {/* ── Top bar: close button ──────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close camera"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── Instruction text ──────────────────────────────────────── */}
        <Text style={[styles.instructionText, { top: targetTop - 60 }]}>
          כוון את המצלמה כלפי הרחפן
        </Text>

        {/* ── Camera permission prompt ──────────────────────────────── */}
        {!cameraPermission?.granted && (
          <View style={styles.permissionPrompt}>
            <Text style={styles.permissionText}>
              Camera access required to aim at the drone.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestCameraPermission}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Shutter button ────────────────────────────────────────── */}
        <View style={styles.shutterContainer}>
          <TouchableOpacity
            style={[
              styles.shutterButton,
              !cameraPermission?.granted && styles.shutterDisabled,
            ]}
            onPress={onCapture}
            disabled={!cameraPermission?.granted}
            accessibilityRole="button"
            accessibilityLabel="Capture drone sighting"
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  noCamera: {
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dark overlay cutout view
  overlayCutout: {
    position: 'absolute',
    width: TARGET_W + 4000,
    height: TARGET_H + 4000,
    borderWidth: 2000,
    borderColor: DIM,
    borderRadius: 2000 + TARGET_BORDER_RADIUS,
  },

  // Red corner bracket style
  cornerBracket: {
    position: 'absolute',
    width: ARM_LEN,
    height: ARM_LEN,
    borderColor: '#DA3E3F',
  },
  endCap: {
    position: 'absolute',
    width: ARM_THICK,
    height: ARM_THICK,
    borderRadius: ARM_THICK / 2,
    backgroundColor: '#DA3E3F',
  },

  // Close button
  topBar: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(38, 25, 58, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(195,135,255,0.35)',
  },
  closeButtonText: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FontFamily,
  },

  // Instruction text
  instructionText: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FontFamily,
    zIndex: 10,
  },

  // Permission prompt
  permissionPrompt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 20,
    backgroundColor: 'rgba(10,0,24,0.7)',
  },
  permissionText: {
    color: Colors.accent,
    fontSize: 15,
    fontFamily: FontFamily,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  permissionButton: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: Colors.bgDeep,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FontFamily,
  },

  // Shutter button
  shutterContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  shutterButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: {
    opacity: 0.3,
  },
  shutterInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.white,
  },
});
