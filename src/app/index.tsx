import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {

  const handlePress = async () => {
    try {
      const appReturnUrl = Linking.createURL("/profile");
      console.log("Your App Return URL is:", appReturnUrl);

      const backendAuthUrl = `http://172.17.124.68:8080/auth/sso/login?redirectUrl=${encodeURIComponent(appReturnUrl)}`;

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
});
