import { Stack } from "expo-router";
import { ToastProvider } from "react-native-toast-notifications";
import Navbar from "../components/navbar/Navbar";

export default function RootLayout() {
  return (
    <ToastProvider>
      <Stack screenOptions={{ header: () => <Navbar /> }} />
    </ToastProvider>
  );
}
