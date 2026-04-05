import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform, StyleSheet } from "react-native";
import { DashboardScreen } from "../screens/DashboardScreen";
import { LocateItemScreen } from "../screens/LocateItemScreen";
import { StockAuditScreen } from "../screens/StockAuditScreen";
import { theme } from "../theme/theme";

export type RootTabParamList = {
  Dashboard: undefined;
  StockAudit: undefined;
  LocateItem: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const headerOptions = {
  headerShown: true as const,
  headerStyle: {
    backgroundColor: theme.colors.surface,
    ...theme.shadow.header,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerTitleStyle: {
    fontWeight: "800" as const,
    fontSize: theme.type.screenTitle,
    color: theme.colors.text,
  },
  headerTintColor: theme.colors.text,
  headerShadowVisible: false,
};

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...headerOptions,
        headerTitleAlign: "center",
        tabBarActiveTintColor: theme.colors.tabActive,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          minHeight: Platform.OS === "ios" ? 64 : 60,
          paddingBottom: Platform.OS === "ios" ? 10 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "700",
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size + 2} />
          ),
        }}
      />
      <Tab.Screen
        name="StockAudit"
        component={StockAuditScreen}
        options={{
          title: "Stock audit",
          tabBarLabel: "Audit",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan" color={color} size={size + 2} />
          ),
        }}
      />
      <Tab.Screen
        name="LocateItem"
        component={LocateItemScreen}
        options={{
          title: "Locate item",
          tabBarLabel: "Locate",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate" color={color} size={size + 2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
