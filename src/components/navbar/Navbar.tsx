import { MaterialIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEasterEgg } from '../easter-egg/EasterEggContext';
import AppIcon from '../icons/appIcon/AppIcon';
import { useNotification } from '../notification/NotificationContext';

export default function Navbar() {
  const insets = useSafeAreaInsets();
  const { showNotification } = useNotification();
  const { funnyMode, activateFunnyMode } = useEasterEgg();

  const handleAlertTrigger = () => {
    // Triggers your custom global alert notification
    showNotification("רחפן עיון נמצא בקרבתך! מרחק 100 מ'");
  };

  // Easter egg: count taps on the app icon
  const tapCountRef = useRef(0);
  const tapResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAppIconPress = () => {
    if (funnyMode) return; // Already activated, no need to count

    tapCountRef.current += 1;

    // Reset the counter if no new tap within 2 seconds
    if (tapResetTimerRef.current) {
      clearTimeout(tapResetTimerRef.current);
    }
    tapResetTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);

    if (tapCountRef.current >= 10) {
      tapCountRef.current = 0;
      if (tapResetTimerRef.current) {
        clearTimeout(tapResetTimerRef.current);
      }
      activateFunnyMode();
    }
  };

  const pathname = usePathname();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navContent}>
        {/* Left Side: Actions */}
        <View style={styles.leftSection}>
          {/* Three-dots button triggers the notification */}
          <TouchableOpacity style={styles.iconButton} onPress={handleAlertTrigger}>
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
          <TouchableOpacity
            style={styles.appIconPlaceholder}
            onPress={handleAppIconPress}
            activeOpacity={0.7}
            accessibilityLabel="App icon"
          >
            <AppIcon />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#26193A', // Your Figma background color
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
