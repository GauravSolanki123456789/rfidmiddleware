import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform, StyleSheet } from "react-native";
import { DashboardScreen } from "../screens/DashboardScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { LocateItemScreen } from "../screens/LocateItemScreen";
import { StockAuditScreen } from "../screens/StockAuditScreen";
import { TransferScreen } from "../screens/TransferScreen";
import { theme } from "../theme/theme";

export type RootTabParamList = {
  Dashboard: undefined;
  StockAudit: { resumeSessionId?: string } | undefined;
  History: undefined;
  Transfer: undefined;
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

/** Web: RN bottom-tabs often hides custom tabBarLabel renderers; use string labels + styles. */
const tabBarStyle = Platform.select({
  web: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 76,
    paddingBottom: 12,
    paddingTop: 8,
  },
  ios: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    minHeight: 64,
    paddingBottom: 10,
    paddingTop: 8,
  },
  default: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    minHeight: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
});

const tabBarLabelStyle = Platform.select({
  web: {
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
    marginTop: 4,
    marginBottom: 0,
    overflow: "visible" as const,
  },
  default: {
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
    marginTop: 2,
  },
});

const tabBarIconStyle = Platform.select({
  web: { marginBottom: 0 },
  default: { marginBottom: -2 },
});

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...headerOptions,
        headerTitleAlign: "center",
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: theme.colors.tabActive,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarIconStyle,
        tabBarStyle,
        tabBarLabelStyle,
        tabBarItemStyle: {
          paddingVertical: Platform.OS === "web" ? 2 : 2,
          flex: 1,
          justifyContent: "center" as const,
          alignItems: "center" as const,
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
          tabBarAccessibilityLabel: "Dashboard tab",
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
          tabBarAccessibilityLabel: "Audit tab",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan" color={color} size={size + 2} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: "History",
          tabBarLabel: "History",
          tabBarAccessibilityLabel: "History tab",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" color={color} size={size + 2} />
          ),
        }}
      />
      <Tab.Screen
        name="Transfer"
        component={TransferScreen}
        options={{
          title: "Transfer",
          tabBarLabel: "Transfer",
          tabBarAccessibilityLabel: "Transfer tab",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paper-plane" color={color} size={size + 2} />
          ),
        }}
      />
      <Tab.Screen
        name="LocateItem"
        component={LocateItemScreen}
        options={{
          title: "Locate item",
          tabBarLabel: "Locate",
          tabBarAccessibilityLabel: "Locate tab",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate" color={color} size={size + 2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
