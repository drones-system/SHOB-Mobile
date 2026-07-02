---
name: expo-react-native-standards
description: Core coding standards, strict architectural guidelines, and Expo-specific rules for the team's application.
version: 1.0.0
---

# Scope
Apply these rules globally when generating, modifying, refactoring, or reviewing any code within this project. This project strictly uses **Expo** and **TypeScript**.

# Tech Stack & Tooling
- **Framework:** React Native with Expo
- **Language:** TypeScript (strict mode enabled)
- **Navigation:** Expo Router (File-based routing)
- **Styling:** React Native `StyleSheet` API

# Directory Structure Constraints
Agents must place new files in the following designated directories:
- `/app`: EXCLUSIVELY for Expo Router screens, layouts (`_layout.tsx`), and API routes.
- `/components`: Reusable presentational and container UI components.
- `/hooks`: Custom React hooks for business logic.
- `/utils`: Helper functions, constants, and formatting logic.
- `/assets`: Images, fonts, and static resources.

# 🚨 Expo-Specific Hard Rules 🚨
These rules override standard React Native conventions:
- **Navigation:** ALWAYS use Expo Router (`import { Link, router } from 'expo-router'`). **Do NOT** install or use `@react-navigation/native` directly.
- **Native Modules:** **Do NOT** install libraries that require bare native linking unless they have an official Expo Config Plugin. Always default to the `expo-*` equivalent package (e.g., prefer `expo-camera`, `expo-location`, `expo-secure-store`).
- **Icons:** ALWAYS use `@expo/vector-icons`. **Do NOT** use `react-native-vector-icons`.
- **Images:** Prefer `expo-image` over the standard React Native `Image` component for better performance and aggressive caching.
- **Expo Version**: Use expo version 54.

# Component Standards
- **Syntax:** Write functional components using standard arrow functions. Never generate Class components.
- **TypeScript:** Define an explicitly named `interface` or `type` for component props immediately above the component declaration.
- **Exports:** Use `default` exports for screens inside the `/app` directory (required by Expo Router). Use `named` exports for all reusable components inside `/components`.

# Styling Conventions
- Always use `StyleSheet.create({})` placed at the bottom of the component file.
- **Do NOT** use inline styles (e.g., `style={{ margin: 10 }}`) unless calculating a dynamic property based on component state or props.

# Decision Logic & Workflows
- **IF** asked to create a new page/screen -> Create a new `.tsx` file inside the `/app` directory (or a subdirectory within it) to utilize Expo Router.
- **IF** a component's logic exceeds 50 lines -> Extract the business and state logic into a custom hook inside the `/hooks` directory and return only the necessary state and dispatch functions to the view.
- **IF** asked to persist user data locally -> Use `expo-secure-store` for sensitive data (tokens) and `AsyncStorage` for non-sensitive UI preferences.