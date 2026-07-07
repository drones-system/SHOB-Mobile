import { FocusIcon, LayersIcon } from "@/components/icons/actionMapIcons/MapActionButtons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface MapActionButtonsProps {
  onFocusPress: () => void;
}

export default function MapActionButtons({ onFocusPress }: MapActionButtonsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onFocusPress}>
        <FocusIcon />
      </TouchableOpacity>
      <TouchableOpacity style={styles.button}>
        <LayersIcon />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    top: '10%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
  },
  button: {
    backgroundColor: '#1E1030', // Approximated background if needed, but since it's transparent with stroke, maybe add background if it looks better. I will leave it transparent first.
    borderRadius: 8,
  }
});