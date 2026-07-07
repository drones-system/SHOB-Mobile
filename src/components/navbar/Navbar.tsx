import { MaterialIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../icons/appIcon/AppIcon';
export default function Navbar() {
  const insets = useSafeAreaInsets()
  const pathname = usePathname();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navContent}>
        {/* Left Side: Actions */}
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="more-vert" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              if (pathname !== '/report') {
                router.push('/report');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Open drone report"
          >
            <MaterialIcons name="campaign" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Right Side: Title and Icon */}
        <View style={styles.rightSection}>
          <Text style={styles.title}>מפקד בשטח</Text>
          <View style={styles.appIconPlaceholder}>
            <AppIcon />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#26193A', // Figma background color
    width: '100%',
  },
  navContent: {
    height: 60, // Fixed height for the inner content
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12, // Space between text and icon
  },
  appIconPlaceholder: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
