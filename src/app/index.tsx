import ShobMap from "@/components/map/shobMap";
import React from "react";
import { StyleSheet, View } from "react-native";
import GlobalNotification from "../components/notification/GlobalNotification";
import { NotificationProvider } from '../components/notification/NotificationContext';

export default function Index() {
  return (
    <NotificationProvider>
      <View style={styles.container}>
        <ShobMap></ShobMap>
      </View>

      {/* Keeping the notification below the map ensures it layers perfectly on top */}
      <GlobalNotification />
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

});


