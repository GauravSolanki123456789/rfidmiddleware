import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootTabs } from "./src/navigation/RootTabs";
import { useSettingsStore } from "./src/store/useSettingsStore";
import { theme } from "./src/theme/theme";

const rootStyle = { flex: 1, backgroundColor: theme.colors.bg };

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.bg,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.primary,
  },
};

export default function App() {
  const hydrateFromStorage = useSettingsStore((s) => s.hydrateFromStorage);
  const hydrated = useSettingsStore((s) => s.hydrated);

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  if (!hydrated) {
    return (
      <GestureHandlerRootView style={rootStyle}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.colors.bg,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={rootStyle}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="dark" />
          <RootTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
