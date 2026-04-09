import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RouteProp } from "@react-navigation/native";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { LARGE_LIST_PROPS } from "../constants/listPerformance";
import { AdvancedFilterModal } from "../components/AdvancedFilterModal";
import { AuditProductLine } from "../components/AuditProductLine";
import { ErrorBanner } from "../components/ErrorBanner";
import { PrimaryButton } from "../components/PrimaryButton";
import { useKeyboardWedgeScan } from "../hooks/useKeyboardWedgeScan";
import type { RootTabParamList } from "../navigation/RootTabs";
import {
  getAuditSession,
  saveAuditSession,
} from "../storage/auditSessionStorage";
import { useInventoryStore } from "../store/useInventoryStore";
import { theme } from "../theme/theme";
import type { ProductDto } from "../types/inventory";
import {
  displayGrossWt,
  displaySku,
  displayStyleCode,
} from "../utils/productDisplay";
import { buildAuditShareText } from "../utils/auditShareText";
import {
  computeAuditView,
  productMatchesSearch,
  uniqueValues,
  type AuditScopeFilters,
} from "../utils/clientAudit";
import { triggerHardwareScanIntent } from "../utils/triggerHardwareScan";
import { shareText } from "../utils/shareAuditReport";

type Phase = "scan" | "report";

type ReportRow =
  | { key: string; kind: "foundTitle" }
  | { key: string; kind: "foundItem"; product: ProductDto }
  | { key: string; kind: "foundEmpty" }
  | { key: string; kind: "missingTitle" }
  | { key: string; kind: "missingSearch" }
  | { key: string; kind: "missingItem"; product: ProductDto }
  | { key: string; kind: "missingEmpty" }
  | { key: string; kind: "unknownTitle" }
  | { key: string; kind: "unknownItem"; barcode: string }
  | { key: string; kind: "unknownEmpty" };

const ALL = "";

export function StockAuditScreen() {
  const route = useRoute<RouteProp<RootTabParamList, "StockAudit">>();
  const navigation =
    useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const {
    items,
    loadDashboard,
    refreshMasterList,
    error: catalogError,
    selectedSkus,
  } = useInventoryStore();
  const isFocused = useIsFocused();

  const [phase, setPhase] = useState<Phase>("scan");
  const [scannedBarcodes, setScannedBarcodes] = useState<string[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Pick<AuditScopeFilters, "binLocation">>(
    { binLocation: ALL },
  );
  const [missingQuery, setMissingQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [intentScanning, setIntentScanning] = useState(false);

  const pauseRefocusRef = useRef(false);
  pauseRefocusRef.current = filterModalOpen;

  const wedgeEnabled =
    isFocused && phase === "scan" && items.length > 0;

  const {
    inputRef,
    count,
    reset: resetWedge,
    getScanned,
    wedgeInputProps,
  } = useKeyboardWedgeScan(wedgeEnabled, { pauseRefocusRef });

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const resumeId = route.params?.resumeSessionId;

  useEffect(() => {
    if (!resumeId) return;
    let cancelled = false;
    void (async () => {
      const session = await getAuditSession(resumeId);
      if (cancelled) return;
      if (!session) {
        Alert.alert('Session not found', "It may have been deleted.");
        navigation.setParams({ resumeSessionId: undefined });
        return;
      }
      setActiveSessionId(session.id);
      setScannedBarcodes(session.scannedBarcodes);
      resetWedge(session.scannedBarcodes);
      setPhase("scan");
      setIntentScanning(false);
      setFilters({ binLocation: ALL });
      setMissingQuery("");
      navigation.setParams({ resumeSessionId: undefined });
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeId, navigation, resetWedge]);

  const onRefreshCatalog = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMasterList();
    } finally {
      setRefreshing(false);
    }
  }, [refreshMasterList]);

  const binOptions = useMemo(
    () => uniqueValues(items, "binLocation"),
    [items],
  );

  const auditFilters = useMemo(
    (): AuditScopeFilters => ({
      binLocation: filters.binLocation,
      selectedSkus,
    }),
    [filters.binLocation, selectedSkus],
  );

  const audit = useMemo(
    () =>
      computeAuditView(items, scannedBarcodes, auditFilters),
    [items, scannedBarcodes, auditFilters],
  );

  const missingFiltered = useMemo(() => {
    return audit.missing.filter((p) => productMatchesSearch(p, missingQuery));
  }, [audit.missing, missingQuery]);

  const reportRows = useMemo((): ReportRow[] => {
    const rows: ReportRow[] = [];
    rows.push({ key: "t-found", kind: "foundTitle" });
    if (audit.found.length === 0) {
      rows.push({ key: "e-found", kind: "foundEmpty" });
    } else {
      for (const p of audit.found) {
        rows.push({ key: `f-${p.id}`, kind: "foundItem", product: p });
      }
    }
    rows.push({ key: "t-miss", kind: "missingTitle" });
    rows.push({ key: "miss-search", kind: "missingSearch" });
    if (missingFiltered.length === 0) {
      rows.push({ key: "e-miss", kind: "missingEmpty" });
    } else {
      for (const p of missingFiltered) {
        rows.push({ key: `m-${p.id}`, kind: "missingItem", product: p });
      }
    }
    rows.push({ key: "t-unk", kind: "unknownTitle" });
    if (audit.unknown.length === 0) {
      rows.push({ key: "e-unk", kind: "unknownEmpty" });
    } else {
      for (const b of audit.unknown) {
        rows.push({ key: `u-${b}`, kind: "unknownItem", barcode: b });
      }
    }
    return rows;
  }, [audit.found, audit.unknown, missingFiltered]);

  const onSaveSession = useCallback(async () => {
    const barcodes =
      phase === "scan" ? getScanned() : scannedBarcodes;
    if (barcodes.length === 0) {
      Alert.alert(
        "Nothing to save",
        "Scan at least one 8-digit barcode first.",
      );
      return;
    }
    try {
      const rec = await saveAuditSession({
        id: activeSessionId ?? undefined,
        scannedBarcodes: barcodes,
      });
      setActiveSessionId(rec.id);
      Alert.alert("Saved", "Session stored on this device.");
    } catch (e) {
      Alert.alert(
        "Save failed",
        e instanceof Error ? e.message : "Unknown error",
      );
    }
  }, [phase, getScanned, scannedBarcodes, activeSessionId]);

  const onShareReport = useCallback(async () => {
    try {
      const text = buildAuditShareText({
        filters: auditFilters,
        catalog: items,
        found: audit.found,
        missingForList: missingQuery.trim() ? missingFiltered : audit.missing,
        missingTotalCount: audit.missing.length,
        unknownBarcodes: audit.unknown,
        missingSearchQuery: missingQuery,
        expectedCount: audit.expectedCount,
      });
      await shareText(text, { title: "Audit report", subject: "Audit report" });
    } catch (e) {
      Alert.alert(
        "Share failed",
        e instanceof Error ? e.message : "Unknown error",
      );
    }
  }, [auditFilters, items, audit, missingFiltered, missingQuery]);

  const onToggleIntentScanning = useCallback(() => {
    if (Platform.OS !== "android") {
      Alert.alert(
        "Hardware trigger",
        "Software scan triggers are for Android scanners. The hidden keyboard field stays active for your wedge or gun.",
      );
      return;
    }
    const next = !intentScanning;
    setIntentScanning(next);
    void triggerHardwareScanIntent(next ? "start" : "stop");
  }, [intentScanning]);

  const onFinishScan = useCallback(() => {
    const codes = getScanned();
    if (codes.length === 0) {
      Alert.alert(
        "No barcodes",
        "Scan at least one 8-digit barcode, then finish.",
      );
      return;
    }
    if (items.length === 0) {
      Alert.alert(
        "Catalog empty",
        "Sync inventory before running an audit.",
      );
      return;
    }
    setScannedBarcodes(codes);
    setPhase("report");
    setIntentScanning(false);
    setFilters({ binLocation: ALL });
    setMissingQuery("");
  }, [getScanned, items.length]);

  const onNewScan = useCallback(() => {
    setPhase("scan");
    setScannedBarcodes([]);
    setActiveSessionId(null);
    setIntentScanning(false);
    resetWedge();
    setMissingQuery("");
    setFilters({ binLocation: ALL });
  }, [resetWedge]);

  const renderReportItem = useCallback(
    ({ item }: { item: ReportRow }) => {
      switch (item.kind) {
        case "foundTitle":
          return (
            <Text style={styles.sectionTitle}>
              Found · {audit.found.length}
            </Text>
          );
        case "foundEmpty":
          return (
            <Text style={styles.emptyLine}>None in current scope</Text>
          );
        case "foundItem":
          return (
            <AuditProductLine product={item.product} tone="success" />
          );
        case "missingTitle":
          return (
            <Text style={[styles.sectionTitle, styles.sectionGap]}>
              Missing · {audit.missing.length}
              {missingQuery.trim() ? (
                <Text style={styles.sectionHint}>
                  {" "}
                  ({missingFiltered.length} shown)
                </Text>
              ) : null}
            </Text>
          );
        case "missingSearch":
          return (
            <View style={styles.searchWrap}>
              <Ionicons
                name="search"
                size={20}
                color={theme.colors.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                value={missingQuery}
                onChangeText={setMissingQuery}
                placeholder="Search missing by name, SKU, style, weight, bin…"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>
          );
        case "missingEmpty":
          return (
            <Text style={styles.emptyLine}>
              {missingQuery.trim()
                ? "No missing rows match this search"
                : "None in current scope"}
            </Text>
          );
        case "missingItem":
          return (
            <AuditProductLine product={item.product} tone="danger" />
          );
        case "unknownTitle":
          return (
            <Text style={[styles.sectionTitle, styles.sectionGap]}>
              Unknown · {audit.unknown.length}
            </Text>
          );
        case "unknownEmpty":
          return (
            <Text style={styles.emptyLine}>None — every scan is in scope</Text>
          );
        case "unknownItem": {
          const known = items.find((p) => p.barcode === item.barcode);
          const line = known
            ? `[${item.barcode}] | ${displayStyleCode(known)} - ${displaySku(known)} | ${displayGrossWt(known)}g · out of scope`
            : `[${item.barcode}] · not in catalog / out of scope`;
          return (
            <View style={styles.unknownRow}>
              <Text style={styles.unknownLine} numberOfLines={3}>
                {line}
              </Text>
            </View>
          );
        }
        default:
          return null;
      }
    },
    [
      audit,
      audit.found.length,
      audit.missing.length,
      audit.unknown.length,
      items,
      missingFiltered.length,
      missingQuery,
    ],
  );

  const reportHeader = useMemo(
    () => (
      <View style={styles.reportHeader}>
        <View style={styles.saveShareRow}>
          <Pressable
            onPress={() => void onSaveSession()}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save session"
          >
            <Ionicons
              name="save-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.secondaryBtnLabel}>Save session</Text>
          </Pressable>
          <Pressable
            onPress={() => void onShareReport()}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Share report"
          >
            <Ionicons
              name="share-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.secondaryBtnLabel}>Share report</Text>
          </Pressable>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.filterCardTitle}>Scope filters</Text>
          <Text style={styles.filterCardSub}>
            Counts update instantly. Pick SKUs (multi-select), then optionally
            narrow by bin.
          </Text>
          <Pressable
            onPress={() => setFilterModalOpen(true)}
            style={({ pressed }) => [
              styles.advancedFilterBtn,
              pressed && { opacity: 0.92 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open SKU filter"
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={theme.colors.onPrimary}
            />
            <Text style={styles.advancedFilterBtnLabel}>
              {selectedSkus.length === 0
                ? "Choose SKU scope…"
                : `${selectedSkus.length} SKU${
                    selectedSkus.length === 1 ? "" : "s"
                  } selected`}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.onPrimary}
            />
          </Pressable>
          <Text style={styles.pickerLabel}>Bin location</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={filters.binLocation}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, binLocation: String(v) }))
              }
              mode="dropdown"
              style={styles.picker}
              dropdownIconColor={theme.colors.text}
            >
              <Picker.Item label="All bins" value={ALL} />
              {binOptions.map((s) => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={[styles.statChip, { borderColor: theme.colors.successBorder, backgroundColor: theme.colors.successBg }]}>
            <Text style={styles.statChipLabel}>Found</Text>
            <Text style={[styles.statChipValue, { color: theme.colors.success }]}>
              {audit.found.length}
            </Text>
          </View>
          <View style={[styles.statChip, { borderColor: theme.colors.dangerBorder, backgroundColor: theme.colors.dangerBg }]}>
            <Text style={styles.statChipLabel}>Missing</Text>
            <Text style={[styles.statChipValue, { color: theme.colors.danger }]}>
              {audit.missing.length}
            </Text>
          </View>
          <View style={[styles.statChip, { borderColor: theme.colors.warningBorder, backgroundColor: theme.colors.warningBg }]}>
            <Text style={styles.statChipLabel}>Unknown</Text>
            <Text style={[styles.statChipValue, { color: theme.colors.warning }]}>
              {audit.unknown.length}
            </Text>
          </View>
        </View>

        <Text style={styles.scannedMeta}>
          {scannedBarcodes.length} unique barcode
          {scannedBarcodes.length === 1 ? "" : "s"} captured · expected in
          scope {audit.expectedCount}
        </Text>

        <Pressable
          onPress={onNewScan}
          style={({ pressed }) => [
            styles.newScanBtn,
            pressed && { opacity: 0.9 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Start a new scan session"
        >
          <Ionicons
            name="refresh"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.newScanLabel}>New scan session</Text>
        </Pressable>
      </View>
    ),
    [
      audit.expectedCount,
      audit.found.length,
      audit.missing.length,
      audit.unknown.length,
      binOptions,
      filters.binLocation,
      onNewScan,
      onSaveSession,
      onShareReport,
      scannedBarcodes.length,
      selectedSkus.length,
    ],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <TextInput
        ref={inputRef}
        {...wedgeInputProps}
        style={styles.wedgeInput}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />

      <AdvancedFilterModal
        visible={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        items={items}
      />

      {catalogError ? (
        <View style={styles.syncBanner}>
          <ErrorBanner
            title="Could not sync catalog"
            message={catalogError}
            onRetry={() => void loadDashboard()}
          />
        </View>
      ) : null}

      {phase === "scan" ? (
        <View style={styles.scanRoot}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scanScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            <View style={styles.hero}>
              <Text style={styles.heroKicker}>Room audit</Text>
              <Text style={styles.heroTitle}>Scan anything</Text>
              <Text style={styles.heroBody}>
                The hidden field stays focused for your wedge or gun (8-digit
                barcode + Enter). Optionally limit SKUs before you finish — then
                open the report and refine filters. Resume a session from
                History anytime.
              </Text>
            </View>

            <Pressable
              onPress={() => setFilterModalOpen(true)}
              style={({ pressed }) => [
                styles.scopeChip,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Choose SKU scope"
            >
              <Ionicons
                name="funnel-outline"
                size={22}
                color={theme.colors.primary}
              />
              <View style={styles.scopeChipText}>
                <Text style={styles.scopeChipTitle}>SKU scope</Text>
                <Text style={styles.scopeChipSub} numberOfLines={2}>
                  {selectedSkus.length === 0
                    ? "Full catalog — tap to narrow by style & SKU"
                    : `${selectedSkus.length} SKU${
                        selectedSkus.length === 1 ? "" : "s"
                      } in scope`}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textMuted}
              />
            </Pressable>

            <View style={styles.primaryIntentRow}>
              <PrimaryButton
                label={intentScanning ? "Stop scanning" : "Start scanning"}
                onPress={onToggleIntentScanning}
                variant="primary"
                icon={
                  <Ionicons
                    name={intentScanning ? "stop-circle" : "radio-outline"}
                    size={26}
                    color={theme.colors.onPrimary}
                  />
                }
              />
              <Text style={styles.intentHint}>
                {Platform.OS === "android"
                  ? "Best-effort vendor scan intent (Zebra/Chainway vary). The wedge field stays active — use both."
                  : "Intent trigger runs on Android only. The hidden wedge field still captures scans here."}
              </Text>
            </View>

            <View style={styles.counterCard}>
              <Text style={styles.counterLabel}>Unique barcodes</Text>
              <Text style={styles.counterValue}>{count}</Text>
              <Text style={styles.counterHint}>
                Wedge field stays focused · invalid reads are ignored
              </Text>
            </View>

            <View style={styles.scanActions}>
              <View style={styles.scanBtnWrap}>
                <PrimaryButton
                  label="Finish & build report"
                  onPress={onFinishScan}
                  disabled={items.length === 0}
                  variant="primary"
                  icon={
                    <Ionicons
                      name="checkmark-done"
                      size={24}
                      color={theme.colors.onPrimary}
                    />
                  }
                />
              </View>
              <Pressable
                onPress={() => void onSaveSession()}
                style={({ pressed }) => [
                  styles.saveScanBtn,
                  pressed && { opacity: 0.9 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Save scan session"
              >
                <Ionicons
                  name="save-outline"
                  size={22}
                  color={theme.colors.primary}
                />
                <Text style={styles.saveScanLabel}>Save session</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={styles.listWrap}>
          <FlatList
            style={styles.flex}
            data={reportRows}
            keyExtractor={(item) => item.key}
            renderItem={renderReportItem}
            ListHeaderComponent={reportHeader}
            contentContainerStyle={styles.reportList}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefreshCatalog}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
            extraData={{
              f: auditFilters,
              m: missingQuery,
              a: audit,
            }}
            {...LARGE_LIST_PROPS}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  wedgeInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
    zIndex: -1,
  },
  syncBanner: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.xs,
  },
  scanRoot: {
    flex: 1,
    minHeight: 0,
  },
  scanScrollContent: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.xxl,
    gap: theme.space.lg,
  },
  listWrap: {
    flex: 1,
    minHeight: 0,
  },
  scopeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.md,
    padding: theme.space.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
  },
  scopeChipText: { flex: 1 },
  scopeChipTitle: {
    fontSize: theme.type.label,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: theme.colors.primary,
  },
  scopeChipSub: {
    marginTop: 4,
    fontSize: theme.type.body,
    lineHeight: 24,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  primaryIntentRow: {
    gap: theme.space.sm,
  },
  intentHint: {
    fontSize: theme.type.caption,
    lineHeight: 20,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textAlign: "center",
    paddingHorizontal: theme.space.sm,
  },
  hero: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.lg,
    ...theme.shadow.card,
  },
  heroKicker: {
    fontSize: theme.type.caption,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: theme.colors.primary,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: theme.space.xs,
    fontSize: 28,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  heroBody: {
    marginTop: theme.space.md,
    fontSize: theme.type.body,
    lineHeight: 26,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  counterCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.space.xl,
    paddingHorizontal: theme.space.lg,
    alignItems: "center",
    ...theme.shadow.card,
  },
  counterLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.type.label,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  counterValue: {
    marginTop: theme.space.sm,
    fontSize: 56,
    fontWeight: "900",
    color: theme.colors.primary,
    letterSpacing: -1,
  },
  counterHint: {
    marginTop: theme.space.md,
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: theme.type.body,
    lineHeight: 24,
    fontWeight: "600",
    maxWidth: 320,
  },
  scanActions: {
    gap: theme.space.md,
  },
  scanBtnWrap: { width: "100%" },
  saveScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.space.sm,
    paddingVertical: theme.space.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minHeight: 52,
  },
  saveScanLabel: {
    fontSize: theme.type.body,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  reportList: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.xxl,
  },
  reportHeader: {
    gap: theme.space.md,
    marginBottom: theme.space.md,
  },
  saveShareRow: {
    flexDirection: "row",
    gap: theme.space.sm,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.space.sm,
    paddingVertical: theme.space.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    minHeight: 52,
  },
  secondaryBtnLabel: {
    fontSize: theme.type.label,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  filterCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.lg,
    ...theme.shadow.card,
  },
  filterCardTitle: {
    fontSize: theme.type.section,
    fontWeight: "900",
    color: theme.colors.text,
  },
  filterCardSub: {
    marginTop: theme.space.xs,
    marginBottom: theme.space.md,
    fontSize: theme.type.body,
    lineHeight: 24,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  advancedFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.space.sm,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    marginBottom: theme.space.md,
    minHeight: theme.touchMin,
  },
  advancedFilterBtnLabel: {
    flex: 1,
    fontSize: theme.type.body,
    fontWeight: "800",
    color: theme.colors.onPrimary,
  },
  pickerLabel: {
    fontSize: theme.type.label,
    fontWeight: "800",
    color: theme.colors.textSecondary,
    marginBottom: theme.space.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: "hidden",
    marginBottom: theme.space.md,
  },
  picker: {
    color: theme.colors.text,
    minHeight: theme.touchMin - 4,
    fontSize: theme.type.body,
  },
  statRow: {
    flexDirection: "row",
    gap: theme.space.sm,
    justifyContent: "space-between",
  },
  statChip: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.sm,
    alignItems: "center",
  },
  statChipLabel: {
    fontSize: theme.type.caption,
    fontWeight: "800",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statChipValue: {
    marginTop: 4,
    fontSize: theme.type.stat,
    fontWeight: "900",
  },
  scannedMeta: {
    fontSize: theme.type.caption,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  newScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.space.sm,
    paddingVertical: theme.space.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  newScanLabel: {
    fontSize: theme.type.body,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  sectionTitle: {
    marginTop: theme.space.sm,
    fontSize: theme.type.label,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.colors.textSecondary,
  },
  sectionGap: {
    marginTop: theme.space.lg,
  },
  sectionHint: {
    fontWeight: "700",
    textTransform: "none",
    letterSpacing: 0,
    color: theme.colors.textMuted,
    fontSize: theme.type.caption,
  },
  emptyLine: {
    color: theme.colors.textMuted,
    fontSize: theme.type.body,
    fontWeight: "600",
    paddingVertical: theme.space.sm,
    fontStyle: "italic",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.space.md,
    marginBottom: theme.space.sm,
    minHeight: theme.touchMin,
    ...theme.shadow.card,
  },
  searchIcon: { marginRight: theme.space.sm },
  searchInput: {
    flex: 1,
    fontSize: theme.type.body,
    color: theme.colors.text,
    fontWeight: "600",
    paddingVertical: theme.space.sm,
  },
  unknownRow: {
    backgroundColor: theme.colors.warningBg,
    borderColor: theme.colors.warningBorder,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    marginBottom: theme.space.sm,
  },
  unknownLine: {
    color: theme.colors.text,
    fontSize: theme.type.label,
    fontWeight: "700",
    lineHeight: 22,
  },
});
