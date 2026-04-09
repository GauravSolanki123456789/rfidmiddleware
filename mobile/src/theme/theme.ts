import { Platform, type ViewStyle } from "react-native";

/**
 * Retail handheld: high contrast, large type, generous touch targets.
 * Surfaces are white on light gray page background.
 */
export const theme = {
  colors: {
    bg: "#F8F9FA",
    bgAlt: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceMuted: "#F1F5F9",
    border: "#E2E8F0",
    borderStrong: "#CBD5E1",
    /** Primary body / headings */
    text: "#0F172A",
    textSecondary: "#334155",
    textMuted: "#64748B",
    /** Brand / primary actions */
    primary: "#2563EB",
    primaryPressed: "#1D4ED8",
    onPrimary: "#FFFFFF",
    accent: "#2563EB",
    success: "#059669",
    successBg: "#ECFDF5",
    successBorder: "#A7F3D0",
    danger: "#DC2626",
    dangerBg: "#FEF2F2",
    dangerBorder: "#FECACA",
    warning: "#D97706",
    warningBg: "#FFFBEB",
    warningBorder: "#FDE68A",
    tabInactive: "#64748B",
    tabActive: "#2563EB",
    /** Metric card accents */
    metricTotal: "#2563EB",
    metricInStock: "#059669",
    metricMissing: "#E11D48",
    metricSold: "#475569",
    metricBins: "#7C3AED",
  },
  shadow: {
    card: Platform.select<ViewStyle>({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
    header: Platform.select<ViewStyle>({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  space: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
  },
  type: {
    screenTitle: Platform.select({ android: 20, ios: 20, default: 20 }) ?? 20,
    title: Platform.select({ android: 26, ios: 26, default: 26 }) ?? 26,
    section: Platform.select({ android: 18, ios: 18, default: 18 }) ?? 18,
    body: Platform.select({ android: 18, ios: 18, default: 18 }) ?? 18,
    bodyLarge: Platform.select({ android: 19, ios: 19, default: 19 }) ?? 19,
    label: Platform.select({ android: 15, ios: 15, default: 15 }) ?? 15,
    caption: Platform.select({ android: 13, ios: 13, default: 13 }) ?? 13,
    stat: Platform.select({ android: 36, ios: 36, default: 36 }) ?? 36,
    statLarge: Platform.select({ android: 40, ios: 40, default: 40 }) ?? 40,
  },
  touchMin: 56,
};
