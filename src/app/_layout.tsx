import { Stack } from "expo-router";
import React from "react";
import { ToastProvider } from "react-native-toast-notifications";
import { EasterEggProvider } from "../components/easter-egg/EasterEggContext";
import Navbar from "../components/navbar/Navbar";
import GlobalNotification from "../components/notification/GlobalNotification";
import { NotificationProvider } from "../components/notification/NotificationContext";

export default function RootLayout() {
  return (
    <EasterEggProvider>
      <NotificationProvider>
        <ToastProvider>
          <Stack screenOptions={{ header: () => <Navbar /> }} />
          <GlobalNotification />
        </ToastProvider>
      </NotificationProvider>
    </EasterEggProvider>
  );
}
