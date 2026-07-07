import { Stack } from "expo-router";
import React from "react";
import Navbar from "../components/navbar/Navbar";
import GlobalNotification from "../components/notification/GlobalNotification";
import { NotificationProvider } from "../components/notification/NotificationContext";

export default function RootLayout() {
  return (
    <NotificationProvider>
      <Stack screenOptions={{ header: () => <Navbar /> }} />
      <GlobalNotification />
    </NotificationProvider>
  );
}