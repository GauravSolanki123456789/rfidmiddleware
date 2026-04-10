import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { PrimaryButton } from "../components/PrimaryButton";
import { ErrorBanner } from "../components/ErrorBanner";
import { getApiBaseUrl, getBuiltInApiBaseUrl } from "../config/api";
import { LARGE_LIST_PROPS } from "../constants/listPerformance";
import { useInventoryStore } from "../store/useInventoryStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { theme } from "../theme/theme";
import { buildCatalogOverview, type StyleGroupRow } from "../utils/catalogGrouping";
import { formatShortDateTime } from "../utils/formatTime";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function DashboardScreen() {
  const navigation = useNavigation();
  const { summary, loading, error, lastFetchedAt, items, loadDashboard } =
    useInventoryStore();
  const customApiUrl = useSettingsStore((s) => s.customApiUrl);
  const setCustomApiUrl = useSettingsStore((s) => s.setCustomApiUrl);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [serverUrlDraft, setServerUrlDraft] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  const styleGroups = useMemo(() => buildCatalogOverview(items), [items]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setSettingsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Server configuration"
          style={({ pressed }) => ({
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={theme.colors.text}
          />
        </Pressable>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (settingsOpen) {
      setServerUrlDraft(customApiUrl ?? "");
    }
  }, [settingsOpen, customApiUrl]);

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

  const onSaveServerUrl = useCallback(async () => {
    setSaveLoading(true);
    try {
      const trimmed = serverUrlDraft.trim();
      await setCustomApiUrl(trimmed.length > 0 ? trimmed : null);
      try {
        await Updates.reloadAsync();
      } catch {
        await loadDashboard();
        setSettingsOpen(false);
      }
    } finally {
      setSaveLoading(false);
    }
  }, [serverUrlDraft, setCustomApiUrl, loadDashboard]);

  const toggleStyle = useCallback((code: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const renderStyleRow = useCallback(
    ({ item }: { item: StyleGroupRow }) => {
      const isOpen = expanded.has(item.styleCode);
      return (
        <View style={styles.styleBlock}>
          <Pressable
            onPress={() => toggleStyle(item.styleCode)}
            style={({ pressed }) => [
              styles.styleHeader,
              pressed && { opacity: 0.92 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ expanded: isOpen }}
            accessibilityLabel={`${item.styleCode}, ${item.totalCount} items. ${isOpen ? "Collapse" : "Expand"} SKU breakdown`}
          >
            <Ionicons
              name={isOpen ? "chevron-down" : "chevron-forward"}
              size={22}
              color={theme.colors.primary}
              style={styles.chevron}
            />
            <View style={styles.styleHeaderText}>
              <Text style={styles.styleTitle} numberOfLines={2}>
                {item.styleCode}
              </Text>
              <Text style={styles.styleMeta}>
                {item.totalCount}{" "}
                {item.totalCount === 1 ? "piece" : "pieces"}
              </Text>
            </View>
          </Pressable>
          {isOpen ? (
            item.skuRows.length > 28 ? (
              <ScrollView
                nestedScrollEnabled
                style={[styles.skuList, { maxHeight: 320 }]}
                keyboardShouldPersistTaps="handled"
              >
                {item.skuRows.map((row) => (
                  <View
                    key={`${item.styleCode}::${row.sku}`}
                    style={styles.skuRow}
                  >
                    <Text style={styles.skuLabel} numberOfLines={2}>
                      {row.sku}
                    </Text>
                    <Text style={styles.skuCount}>
                      {row.count}{" "}
                      {row.count === 1 ? "item" : "items"}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.skuList}>
                {item.skuRows.map((row) => (
                  <View
                    key={`${item.styleCode}::${row.sku}`}
                    style={styles.skuRow}
                  >
                    <Text style={styles.skuLabel} numberOfLines={2}>
                      {row.sku}
                    </Text>
                    <Text style={styles.skuCount}>
                      {row.count}{" "}
                      {row.count === 1 ? "item" : "items"}
                    </Text>
                  </View>
                ))}
              </View>
            )
          ) : null}
        </View>
      );
    },
    [expanded, toggleStyle],
  );

  const listHeader = useMemo(
    () => (
      <>
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
              subtitle="ERP catalog"
            />
            <MetricCard
              label="In stock"
              value={summary === null ? "—" : summary.totalInStock}
              accent={theme.colors.metricInStock}
              subtitle="On floor"
            />
            <MetricCard
              label="Storage bins"
              value={
                summary === null ? "—" : (summary.distinctBinCount ?? 0)
              }
              accent={theme.colors.metricBins}
              subtitle="Distinct bin codes"
            />
            <MetricCard
              label="Sold"
              value={summary === null ? "—" : summary.totalSold}
              accent={theme.colors.metricSold}
              subtitle="Completed sales"
            />
          </View>
        )}

        {error && !loading && summary ? (
          <Text style={styles.staleHint}>
            Showing cached figures. Pull to refresh or tap Retry above.
          </Text>
        ) : null}

        <View style={styles.catalogHeader}>
          <Text style={styles.catalogTitle}>Catalog overview</Text>
          <Text style={styles.catalogSub}>
            By style code · expand to see SKU counts
          </Text>
        </View>
      </>
    ),
    [error, lastFetchedAt, summary, loading, onRetry],
  );

  const listEmpty = useMemo(
    () => (
      <View style={styles.catalogEmpty}>
        <Text style={styles.catalogEmptyText}>
          No in-stock rows loaded. Pull to refresh.
        </Text>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <Modal
        visible={settingsOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsOpen(false)}
      >
        <View style={styles.modalFill}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSettingsOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close settings"
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalKeyboard}
            pointerEvents="box-none"
          >
            <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Server configuration</Text>
            <Text style={styles.modalHint}>
              Enter your API base URL (include{" "}
              <Text style={styles.modalMono}>/api</Text> if your server uses
              that path). Example:{" "}
              <Text style={styles.modalMono}>
                http://192.168.1.6:3000/api
              </Text>
            </Text>
            <Text style={styles.modalLabel}>Server URL</Text>
            <TextInput
              value={serverUrlDraft}
              onChangeText={setServerUrlDraft}
              placeholder={getBuiltInApiBaseUrl()}
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.modalInput}
              editable={!saveLoading}
            />
            <Text style={styles.modalMeta}>
              Active now:{" "}
              <Text style={styles.modalMono}>{getApiBaseUrl()}</Text>
            </Text>
            <Text style={styles.modalMetaMuted}>
              If you clear the field and save, the app uses the build default:{" "}
              {getBuiltInApiBaseUrl()}
            </Text>
            <View style={styles.modalActions}>
              <View style={styles.modalActionBtn}>
                <PrimaryButton
                  label="Cancel"
                  variant="outline"
                  onPress={() => setSettingsOpen(false)}
                  disabled={saveLoading}
                />
              </View>
              <View style={styles.modalActionBtn}>
                <PrimaryButton
                  label="Save & Restart"
                  onPress={() => void onSaveServerUrl()}
                  loading={saveLoading}
                />
              </View>
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <FlatList
        data={styleGroups}
        keyExtractor={(item) => item.styleCode}
        renderItem={renderStyleRow}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={!loading && items.length === 0 ? listEmpty : null}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        {...LARGE_LIST_PROPS}
      />
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
  modalFill: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalKeyboard: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.lg,
    paddingBottom: theme.space.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.space.sm,
    ...theme.shadow.card,
  },
  modalTitle: {
    fontSize: theme.type.title,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  modalHint: {
    fontSize: theme.type.caption,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  modalMono: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    fontSize: theme.type.caption,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  modalLabel: {
    marginTop: theme.space.sm,
    fontSize: theme.type.label,
    fontWeight: "800",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
    fontSize: theme.type.body,
    fontWeight: "600",
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceMuted,
    minHeight: theme.touchMin,
  },
  modalMeta: {
    fontSize: theme.type.caption,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginTop: theme.space.xs,
  },
  modalMetaMuted: {
    fontSize: theme.type.caption,
    fontWeight: "600",
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.space.sm,
    marginTop: theme.space.md,
  },
  modalActionBtn: {
    flex: 1,
  },
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  listContent: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.xxl,
    flexGrow: 1,
    gap: theme.space.sm,
  },
  updated: {
    alignSelf: "center",
    color: theme.colors.textMuted,
    fontSize: theme.type.caption,
    fontWeight: "600",
    marginBottom: theme.space.xs,
  },
  staleHint: {
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: theme.type.caption,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: theme.space.xs,
    paddingHorizontal: theme.space.md,
    marginBottom: theme.space.sm,
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
  metrics: { gap: theme.space.md, marginBottom: theme.space.md },
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
  catalogHeader: {
    marginTop: theme.space.md,
    marginBottom: theme.space.sm,
    paddingTop: theme.space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  catalogTitle: {
    fontSize: theme.type.section,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  catalogSub: {
    marginTop: 4,
    fontSize: theme.type.caption,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  catalogEmpty: {
    paddingVertical: theme.space.xl,
    alignItems: "center",
  },
  catalogEmptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.type.body,
    fontWeight: "600",
  },
  styleBlock: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.space.sm,
    overflow: "hidden",
    ...theme.shadow.card,
  },
  styleHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.md,
    gap: theme.space.sm,
    minHeight: theme.touchMin,
  },
  chevron: { marginTop: 2 },
  styleHeaderText: { flex: 1 },
  styleTitle: {
    fontSize: theme.type.bodyLarge,
    fontWeight: "900",
    color: theme.colors.text,
  },
  styleMeta: {
    marginTop: 4,
    fontSize: theme.type.caption,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  skuList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
  skuRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.space.md,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  skuLabel: {
    flex: 1,
    fontSize: theme.type.body,
    fontWeight: "700",
    color: theme.colors.text,
  },
  skuCount: {
    fontSize: theme.type.label,
    fontWeight: "800",
    color: theme.colors.primary,
  },
});
