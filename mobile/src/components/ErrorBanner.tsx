import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

type Props = {
  message: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorBanner({
  message,
  title = "Something went wrong",
  onRetry,
  retryLabel = "Retry",
}: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Ionicons
        name="cloud-offline-outline"
        size={22}
        color={theme.colors.danger}
        style={styles.icon}
      />
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retry,
              pressed && { opacity: 0.88 },
            ]}
            hitSlop={8}
          >
            <Text style={styles.retryText}>{retryLabel}</Text>
            <Ionicons
              name="refresh"
              size={16}
              color={theme.colors.primary}
              style={styles.retryIcon}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.space.md,
    backgroundColor: theme.colors.dangerBg,
    borderColor: theme.colors.dangerBorder,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.space.md,
    ...theme.shadow.card,
  },
  icon: { marginTop: 2 },
  body: { flex: 1, gap: theme.space.xs },
  title: {
    color: theme.colors.text,
    fontSize: theme.type.label,
    fontWeight: "800",
  },
  message: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.body,
    fontWeight: "600",
    lineHeight: 24,
  },
  retry: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: theme.space.xs,
    marginTop: theme.space.sm,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  retryText: {
    color: theme.colors.primary,
    fontSize: theme.type.label,
    fontWeight: "800",
  },
  retryIcon: { marginLeft: 2 },
});
