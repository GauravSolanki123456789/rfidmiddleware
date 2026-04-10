import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "@rfid/settings/customApiUrl";

type SettingsState = {
  /** Persisted override; null = use build-time / platform default from `getApiBaseUrl` chain */
  customApiUrl: string | null;
  /** True after `hydrateFromStorage` has finished (success or failure). */
  hydrated: boolean;
  hydrateFromStorage: () => Promise<void>;
  setCustomApiUrl: (url: string | null) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  customApiUrl: null,
  hydrated: false,

  hydrateFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const trimmed = raw?.trim() ?? "";
      if (trimmed.length > 0) {
        set({ customApiUrl: trimmed, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  setCustomApiUrl: async (url) => {
    const trimmed = url?.trim() ?? "";
    if (trimmed.length === 0) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ customApiUrl: null });
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
    set({ customApiUrl: trimmed });
  },
}));
