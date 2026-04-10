import Constants from "expo-constants";
import { Platform } from "react-native";
import { useSettingsStore } from "../store/useSettingsStore";

/**
 * Build-time / emulator defaults (no in-app override).
 * Default: Android emulator → host machine via 10.0.2.2.
 * Physical device: set EXPO_PUBLIC_API_BASE_URL (e.g. http://192.168.1.10:3000/api)
 * or use Dashboard → Server configuration.
 */
export function getBuiltInApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/$/, "");
  }

  const extra = Constants.expoConfig?.extra as
    | { apiBaseUrl?: string }
    | undefined;
  if (extra?.apiBaseUrl && extra.apiBaseUrl.length > 0) {
    return extra.apiBaseUrl.replace(/\/$/, "");
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000/api";
  }

  return "http://localhost:3000/api";
}

/**
 * Effective API origin: in-app `customApiUrl` (AsyncStorage) wins, then built-in chain.
 */
export function getApiBaseUrl(): string {
  const custom = useSettingsStore.getState().customApiUrl;
  if (typeof custom === "string" && custom.trim().length > 0) {
    return custom.trim().replace(/\/$/, "");
  }
  return getBuiltInApiBaseUrl();
}
