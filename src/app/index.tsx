import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const handlePress = async () => {
    try {
      const keycloakUrl = "https://keycloak.hashlama020.domain/";
      const authUrl = `https://backendUrl/auth/sso/login?redirectUrl=${encodeURIComponent(keycloakUrl)}`;

      // Send the HTTP GET request to your authUrl parameter behind the scenes
      fetch(authUrl).catch(err => console.error("Fetch Error:", err));

      // Redirect the user visibly to the SSO server (Keycloak)
      // The second parameter is the deep link Expo listens to, so Keycloak knows how to return the user to the app
      const appReturnUrl = Linking.createURL("/profile");
      const result = await WebBrowser.openAuthSessionAsync(keycloakUrl, appReturnUrl);

      // 4. Handle the result (e.g., extract parameters like tokens if the type is "success")
      console.log("SSO Result:", result);
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
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F3E8FF", // Light purple background
    borderRadius: 12,           // Rounded corners
  },
  buttonText: {
    color: "#6B21A8",           // Dark purple text for good contrast
    fontSize: 18,
    fontWeight: "600",
  },
});
