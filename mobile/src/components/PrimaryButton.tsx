import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { theme } from "../theme/theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "danger" | "outline";
  accessibilityHint?: string;
  icon?: ReactNode;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  accessibilityHint,
  icon,
}: Props) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  const bg = isPrimary
    ? theme.colors.primary
    : isDanger
      ? theme.colors.danger
      : theme.colors.surface;

  const borderColor =
    variant === "outline" ? theme.colors.borderStrong : bg;
  const spinnerColor =
    isPrimary || isDanger ? theme.colors.onPrimary : theme.colors.primary;
  const textColor =
    isPrimary || isDanger ? theme.colors.onPrimary : theme.colors.text;

  const isDisabled = !!(disabled || loading);

  const androidRipple =
    Platform.OS === "android"
      ? variant === "outline"
        ? { color: "rgba(37, 99, 235, 0.18)", foreground: true }
        : isDanger
          ? { color: "rgba(255, 255, 255, 0.22)", foreground: true }
          : { color: "rgba(255, 255, 255, 0.28)", foreground: true }
      : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      disabled={disabled || loading}
      android_ripple={androidRipple}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          opacity: pressed && !disabled && !loading ? 0.92 : 1,
        },
        (disabled || loading) && styles.disabled,
        variant === "outline" && styles.outlineBg,
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={spinnerColor} />
        ) : (
          <>
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: theme.touchMin,
    alignSelf: "stretch",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.space.lg,
    justifyContent: "center",
  },
  outlineBg: {
    backgroundColor: theme.colors.surface,
  },
  disabled: { opacity: 0.5 },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.space.sm,
  },
  icon: { marginRight: 2 },
  label: {
    fontSize: theme.type.bodyLarge,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});
