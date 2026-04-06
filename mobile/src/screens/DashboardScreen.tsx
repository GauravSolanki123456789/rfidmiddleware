import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ErrorBanner } from "../components/ErrorBanner";
import { useInventoryStore } from "../store/useInventoryStore";
import { theme } from "../theme/theme";
import { formatShortDateTime } from "../utils/formatTime";

export function DashboardScreen() {
  const { summary, loading, error, lastFetchedAt, loadDashboard } =
    useInventoryStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboard]);

  const onRetry = useCallback(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {error ? (
          <ErrorBanner
            title="Could not load inventory"
            message={error}
            onRetry={onRetry}
          />
        ) : null}

        {lastFetchedAt && summary ? (
          <Text style={styles.updated} accessibilityLiveRegion="polite">
            Last updated {formatShortDateTime(lastFetchedAt)}
          </Text>
        ) : null}

        {loading && !summary ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingLabel}>Loading summary…</Text>
          </View>
        ) : error && !summary ? null : (
          <View style={styles.metrics}>
            <MetricCard
              label="Total items"
              value={summary === null ? "—" : summary.totalItems}
              accent={theme.colors.metricTotal}
              subtitle="All SKUs"
            />
            <MetricCard
              label="In stock"
              value={summary === null ? "—" : summary.totalInStock}
              accent={theme.colors.metricInStock}
              subtitle="On floor"
            />
            <MetricCard
              label="Missing"
              value={summary === null ? "—" : summary.totalMissing}
              accent={theme.colors.metricMissing}
              subtitle="Needs attention"
            />
            <MetricCard
              label="Sold"
              value={summary === null ? "—" : summary.totalSold}
              accent={theme.colors.metricSold}
              subtitle="Completed"
            />
          </View>
        )}

        {error && !loading && summary ? (
          <Text style={styles.staleHint}>
            Showing cached figures. Pull to refresh or tap Retry above.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  label,
  value,
  accent,
  subtitle,
}: {
  label: string;
  value: number | "—";
  accent: string;
  subtitle: string;
}) {
  return (
    <View
      style={styles.metricCard}
      accessibilityRole="summary"
      accessibilityLabel={`${label}, ${value === "—" ? "unknown" : value}, ${subtitle}`}
    >
      <View style={[styles.metricAccent, { backgroundColor: accent }]} />
      <View style={styles.metricBody}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: {
    padding: theme.space.lg,
    paddingBottom: theme.space.xxl,
    flexGrow: 1,
    gap: theme.space.md,
  },
  updated: {
    alignSelf: "center",
    color: theme.colors.textMuted,
    fontSize: theme.type.caption,
    fontWeight: "600",
  },
  staleHint: {
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: theme.type.caption,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: theme.space.xs,
    paddingHorizontal: theme.space.md,
  },
  loadingBlock: {
    paddingVertical: theme.space.xxl,
    alignItems: "center",
    gap: theme.space.md,
  },
  loadingLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.type.body,
    fontWeight: "600",
  },
  metrics: { gap: theme.space.md },
  metricCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    minHeight: theme.touchMin + 36,
    ...theme.shadow.card,
  },
  metricAccent: {
    width: 6,
    alignSelf: "stretch",
  },
  metricBody: {
    flex: 1,
    paddingVertical: theme.space.lg,
    paddingHorizontal: theme.space.lg,
    justifyContent: "center",
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.type.label,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: theme.type.statLarge,
    fontWeight: "900",
    marginTop: theme.space.xs,
    letterSpacing: -0.5,
  },
  metricSub: {
    color: theme.colors.textMuted,
    fontSize: theme.type.caption,
    marginTop: theme.space.xs,
    fontWeight: "600",
  },
});
