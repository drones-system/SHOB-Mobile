import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, FontFamily } from './constants';

interface TextDescriptionSectionProps {
  description: string;
  onChangeDescription: (text: string) => void;
}

export function TextDescriptionSection({
  description,
  onChangeDescription,
}: TextDescriptionSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionLabel}>SIGHTING DESCRIPTION</Text>
      <Text style={styles.inputHint}>
        Describe the drone's appearance, direction, altitude, and any
        distinguishing features.
      </Text>
      <TextInput
        style={styles.textArea}
        value={description}
        onChangeText={onChangeDescription}
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
  sectionLabel: {
    color: Colors.accentSoft,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: FontFamily,
    textAlign: 'right',
  },
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
});
