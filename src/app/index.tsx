import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const [showNotification, setShowNotification] = useState(false);
  const translateY = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (showNotification) {
      translateY.setValue(-200);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 10,
      }).start();
    }
  }, [showNotification]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (e, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy < -50 || gestureState.vy < -0.5) {
          Animated.timing(translateY, {
            toValue: -200,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowNotification(false);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handlePress = async () => {
    try {
      const appReturnUrl = Linking.createURL("/profile");
      console.log("Your App Return URL is:", appReturnUrl);

      const backendAuthUrl = `https://rest-server.hashlama020.domain/auth/sso/login?redirectUrl=${encodeURIComponent(appReturnUrl)}`;

      const result = await WebBrowser.openAuthSessionAsync(backendAuthUrl, appReturnUrl);

      console.log("SSO Result:", result);

      if (result.type === 'success' && result.url) {
        // Handle the token/code returned in the URL here
      }
    } catch (error) {
      console.error("SSO Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      {showNotification && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.notificationContainer,
            { transform: [{ translateY }] }
          ]}
        >
          <View style={styles.notificationContent}>
            <View style={styles.notificationTextContainer}>
              <Text style={styles.notificationTitle}>רחפן עוין נמצא בקרבתך!</Text>
              <Text style={styles.notificationSubtitle}>מרחק 100 מ'</Text>
            </View>
            <Ionicons name="alert-circle" size={36} color="#EF4444" />
          </View>
        </Animated.View>
      )}

      <TouchableOpacity
        onPress={() => setShowNotification(true)}
        style={[styles.button, styles.enemyButton]}
        activeOpacity={0.7}
      >
        <Text style={styles.enemyButtonText}>enemy!!</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handlePress} style={styles.button} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={18} color="#6B21A8" />
        <Text style={styles.buttonText}>התחבר באמצעות SSO</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F3E8FF", // Light purple background
    borderRadius: 12,           // Rounded corners
    width: 250, // Setting explicit width to make both buttons same size and centered
  },
  buttonText: {
    color: "#6B21A8",           // Dark purple text for good contrast
    fontSize: 18,
    fontWeight: "600",
  },
  enemyButton: {
    backgroundColor: "#FEE2E2", // Pleasant red background
    marginBottom: 16,
  },
  enemyButtonText: {
    color: "#E11D48", // Darker red text for good contrast
    fontSize: 18,
    fontWeight: "600",
  },
  notificationContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "#2E1065", // Dark purple background
    borderColor: "#EF4444", // Red outline
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    zIndex: 100,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notificationTextContainer: {
    flex: 1,
    marginRight: 16, // Space between text and the icon on the right
    alignItems: "flex-end", // Align text to the right for Hebrew
  },
  notificationTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "right",
  },
  notificationSubtitle: {
    color: "#E9D5FF", // Light purple text for subtitle
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
});
