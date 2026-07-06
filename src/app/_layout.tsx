import { Stack } from "expo-router";
import Navbar from "../components/navbar/Navbar";

export default function RootLayout() {
  return <Stack screenOptions={{ header: () => <Navbar /> }} />;
}
