import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { putInventoryTransfer } from "../api/inventoryClient";
import { LARGE_LIST_PROPS } from "../constants/listPerformance";
import { ErrorBanner } from "../components/ErrorBanner";
import { PrimaryButton } from "../components/PrimaryButton";
import { ProductListItem } from "../components/ProductListItem";
import { useKeyboardWedgeScan } from "../hooks/useKeyboardWedgeScan";
import { useInventoryStore } from "../store/useInventoryStore";
import { theme } from "../theme/theme";
import type { TransferListRow } from "../utils/reportFlatListRows";
import { transferReportToFlatListRows } from "../utils/reportFlatListRows";
import {
  buildTransferScanReport,
  filterExpectedTransferItems,
  type TransferScanReport,
} from "../utils/transferScan";
import { uniqueBinLocationsFromProducts } from "../utils/bins";

type Step = 1 | 2 | 3;

export function TransferScreen() {
  const { items, loadDashboard, refreshMasterList, error } = useInventoryStore();
  const isFocused = useIsFocused();

  const [step, setStep] = useState<Step>(1);
  const [sourceBin, setSourceBin] = useState("");
  const [destinationBin, setDestinationBin] = useState("");
  const [itemNameFilter, setItemNameFilter] = useState("");
  const [styleCodeFilter, setStyleCodeFilter] = useState("");
  const [skuFilter, setSkuFilter] = useState("");
  const [report, setReport] = useState<TransferScanReport | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);

  const bins = useMemo(
    () => uniqueBinLocationsFromProducts(items),
    [items],
  );

  const itemNameTrim = itemNameFilter.trim() || undefined;
  const styleTrim = styleCodeFilter.trim() || undefined;
  const skuTrim = skuFilter.trim() || undefined;

  const expectedProducts = useMemo(
    () =>
      sourceBin
        ? filterExpectedTransferItems(items, sourceBin, {
            itemNameTrim,
            styleCodeTrim: styleTrim,
            skuTrim,
          })
        : [],
    [items, sourceBin, itemNameTrim, styleTrim, skuTrim],
  );

  const wedgeEnabled = isFocused && step === 2;
  const {
    inputRef: wedgeInputRef,
    count: wedgeCount,
    reset: resetWedge,
    getScanned: getWedgeScanned,
    wedgeInputProps,
  } = useKeyboardWedgeScan(wedgeEnabled);

  useEffect(() => {
    if (step === 2) {
      resetWedge();
    }
  }, [step, resetWedge]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  useEffect(() => {
    if (sourceBin) return;
    if (bins.length === 0) return;
    setSourceBin(bins[0]!);
  }, [bins, sourceBin]);

  useEffect(() => {
    if (destinationBin) return;
    if (bins.length < 2) return;
    const alt = bins.find((b) => b !== sourceBin);
    if (alt) setDestinationBin(alt);
  }, [bins, destinationBin, sourceBin]);

  const resetWizard = useCallback(() => {
    resetWedge();
    setStep(1);
    setReport(null);
  }, [resetWedge]);

  const onStartSession = () => {
    const dest = destinationBin.trim();
    if (!sourceBin || !dest) {
      Alert.alert(
        "Bins required",
        "Choose a source bin and enter a destination bin.",
      );
      return;
    }
    if (sourceBin === dest) {
      Alert.alert(
        "Invalid destination",
        "Source and destination bins must be different.",
      );
      return;
    }
    setReport(null);
    setStep(2);
  };

  const onFinishTransferScan = () => {
    if (!sourceBin) {
      Alert.alert("Source required", "Go back and select a source bin.");
      return;
    }
    const scanned = getWedgeScanned();
    if (scanned.length === 0) {
      Alert.alert(
        "No barcodes yet",
        "Scan at least one 8-digit barcode with the hardware trigger, then finish.",
      );
      return;
    }
    const next = buildTransferScanReport(
      sourceBin,
      expectedProducts,
      scanned,
      items,
    );
    setReport(next);
    resetWedge();
    setStep(3);
  };

  const onConfirmTransfer = useCallback(async () => {
    const dest = destinationBin.trim();
    if (!report || !dest) return;
    const barcodes = report.ready.map((p) => p.barcode);
    if (barcodes.length === 0) {
      Alert.alert(
        "Nothing to move",
        "There are no valid items in “Ready to transfer”. Scan again or adjust filters.",
      );
      return;
    }

    setTransferLoading(true);
    try {
      const result = await putInventoryTransfer({
        barcodes,
        newBinLocation: dest,
      });
      await refreshMasterList();
      await loadDashboard();
      Alert.alert(
        "Transfer complete",
        `${result.updatedCount} item(s) moved to bin “${dest}”.`,
      );
      resetWizard();
    } catch (e) {
      Alert.alert(
        "Transfer failed",
        e instanceof Error ? e.message : "Something went wrong",
      );
    } finally {
      setTransferLoading(false);
    }
  }, [
    report,
    destinationBin,
    refreshMasterList,
    loadDashboard,
    resetWizard,
  ]);

  const destLabel = destinationBin.trim() || "—";
  const sourceLabel = sourceBin || "—";

  const transferListRows = useMemo(
    () => (report ? transferReportToFlatListRows(report) : []),
    [report],
  );

  const renderTransferRow = useCallback(
    ({ item }: { item: TransferListRow }) => {
      switch (item.kind) {
        case "header":
          return (
            <Text style={[styles.sectionTitle, styles.sectionTitleInList]}>
              {item.title}
            </Text>
          );
        case "empty":
          return <Text style={styles.empty}>{item.label}</Text>;
        case "product":
          return (
            <ProductListItem product={item.product} tone={item.tone} />
          );
        case "invalid":
          if (item.row.knownProduct) {
            return (
              <View style={styles.invalidBlock}>
                <ProductListItem
                  product={item.row.knownProduct}
                  tone="danger"
                />
                <Text style={styles.invalidReasonInline}>{item.row.reason}</Text>
              </View>
            );
          }
          return (
            <View style={styles.invalidUnknown}>
              <Text style={styles.invalidBarcode}>{item.row.barcode}</Text>
              <Text style={styles.invalidReason}>{item.row.reason}</Text>
            </View>
          );
        default:
          return null;
      }
    },
    [],
  );

  const transferReviewHeader = useMemo(
    () =>
      report ? (
        <>
          <View style={styles.stepRow} accessibilityRole="header">
            {([1, 2, 3] as const).map((s) => (
              <View key={s} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    s < step && styles.stepDotDone,
                    step === s && styles.stepDotCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNum,
                      s < step && styles.stepNumDone,
                      s > step && styles.stepNumFuture,
                      step === s && styles.stepNumCurrent,
                    ]}
                  >
                    {s}
                  </Text>
                </View>
                <Text style={styles.stepCap} numberOfLines={1}>
                  {s === 1 ? "Setup" : s === 2 ? "Scan" : "Review"}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.review}>
            <Text style={styles.reviewTitle}>Review & report</Text>
            <Text style={styles.reviewSub}>
              Move to bin <Text style={styles.em}>{destLabel}</Text>. Confirm
              only when the “Ready” list matches what you physically have.
            </Text>

            <View style={styles.summaryGrid}>
              <MetricSummary
                label="Ready to transfer"
                value={report.ready.length}
                subtitle="Valid scans in scope"
                accent={theme.colors.success}
                bg={theme.colors.successBg}
                border={theme.colors.successBorder}
              />
              <MetricSummary
                label="Missing from filter"
                value={report.missing.length}
                subtitle="Expected but not scanned"
                accent={theme.colors.warning}
                bg={theme.colors.warningBg}
                border={theme.colors.warningBorder}
              />
              <MetricSummary
                label="Invalid scan"
                value={report.invalidTags.length}
                subtitle="Wrong tag or out of scope"
                accent={theme.colors.danger}
                bg={theme.colors.dangerBg}
                border={theme.colors.dangerBorder}
              />
            </View>
          </View>
        </>
      ) : null,
    [report, destLabel, step],
  );

  const transferReviewFooter = useMemo(
    () =>
      report ? (
        <View style={styles.actions}>
          <PrimaryButton
            label="Cancel"
            onPress={resetWizard}
            variant="outline"
            disabled={transferLoading}
          />
          <PrimaryButton
            label="Confirm transfer"
            onPress={() => void onConfirmTransfer()}
            variant="primary"
            loading={transferLoading}
            disabled={report.ready.length === 0}
            accessibilityHint="PUT /inventory/transfer for scanned barcodes"
            icon={
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={theme.colors.onPrimary}
              />
            }
          />
        </View>
      ) : null,
    [report, transferLoading, resetWizard, onConfirmTransfer],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      {error ? (
        <View style={styles.syncBanner}>
          <ErrorBanner
            title="Could not sync catalog"
            message={error}
            onRetry={() => void loadDashboard()}
          />
        </View>
      ) : null}
      <TextInput
        ref={wedgeInputRef}
        {...wedgeInputProps}
        style={styles.wedgeInput}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {step === 3 && report ? (
          <FlatList
            style={styles.flex}
            data={transferListRows}
            keyExtractor={(item) => item.key}
            renderItem={renderTransferRow}
            ListHeaderComponent={transferReviewHeader}
            ListFooterComponent={transferReviewFooter}
            contentContainerStyle={styles.flatListContent}
            keyboardShouldPersistTaps="handled"
            {...LARGE_LIST_PROPS}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.stepRow} accessibilityRole="header">
            {([1, 2, 3] as const).map((s) => (
              <View key={s} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    s < step && styles.stepDotDone,
                    step === s && styles.stepDotCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNum,
                      s < step && styles.stepNumDone,
                      s > step && styles.stepNumFuture,
                      step === s && styles.stepNumCurrent,
                    ]}
                  >
                    {s}
                  </Text>
                </View>
                <Text style={styles.stepCap} numberOfLines={1}>
                  {s === 1 ? "Setup" : s === 2 ? "Scan" : "Review"}
                </Text>
              </View>
            ))}
          </View>

          {step === 1 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Session setup</Text>
              <Text style={styles.cardSub}>
                Pick the source bin and where stock should move. Optional filters
                narrow which rows are in scope (aligned with the server master
                list).
              </Text>

              <Text style={styles.fieldLabel}>Source bin</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={sourceBin}
                  onValueChange={(v) => setSourceBin(String(v))}
                  mode="dropdown"
                  style={styles.picker}
                  dropdownIconColor={theme.colors.text}
                >
                  {bins.length === 0 ? (
                    <Picker.Item label="No bins in catalog" value="" />
                  ) : null}
                  {bins.map((bin) => (
                    <Picker.Item key={bin} label={bin} value={bin} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.fieldLabel}>Destination bin</Text>
              <TextInput
                value={destinationBin}
                onChangeText={setDestinationBin}
                placeholder="Type bin code (e.g. VAULT-A2)"
                placeholderTextColor={theme.colors.textMuted}
                autoCorrect={false}
                autoCapitalize="characters"
                style={styles.input}
                accessibilityLabel="Destination bin code"
              />

              <Text style={styles.fieldLabel}>Item name (optional)</Text>
              <TextInput
                value={itemNameFilter}
                onChangeText={setItemNameFilter}
                placeholder="Contains, case-insensitive"
                placeholderTextColor={theme.colors.textMuted}
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.input}
                accessibilityLabel="Filter by item name"
              />

              <Text style={styles.fieldLabel}>Style code (optional)</Text>
              <TextInput
                value={styleCodeFilter}
                onChangeText={setStyleCodeFilter}
                placeholder="Contains, case-insensitive"
                placeholderTextColor={theme.colors.textMuted}
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.input}
                accessibilityLabel="Filter by style code"
              />

              <Text style={styles.fieldLabel}>SKU (optional)</Text>
              <TextInput
                value={skuFilter}
                onChangeText={setSkuFilter}
                placeholder="Exact match, case-insensitive"
                placeholderTextColor={theme.colors.textMuted}
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.input}
                accessibilityLabel="Filter by SKU"
              />

              <View style={styles.hintBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color={theme.colors.primary}
                />
                <Text style={styles.hintText}>
                  {expectedProducts.length} available item(s) match this scope in{" "}
                  {sourceLabel}.
                </Text>
              </View>

              <PrimaryButton
                label="Start scanning session"
                onPress={onStartSession}
                disabled={
                  bins.length === 0 ||
                  !sourceBin ||
                  !destinationBin.trim() ||
                  sourceBin === destinationBin.trim()
                }
                variant="primary"
                accessibilityHint="Begins step 2: hardware RFID scan"
                icon={
                  <Ionicons
                    name="play"
                    size={22}
                    color={theme.colors.onPrimary}
                  />
                }
              />
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Active scan</Text>
              <Text style={styles.cardSub}>
                From <Text style={styles.em}>{sourceLabel}</Text>
                {itemNameTrim || styleTrim || skuTrim ? (
                  <>
                    {" "}
                    · filtered
                    {itemNameTrim ? (
                      <Text style={styles.em}> · item “{itemNameTrim}”</Text>
                    ) : null}
                    {styleTrim ? (
                      <Text style={styles.em}> · style “{styleTrim}”</Text>
                    ) : null}
                    {skuTrim ? (
                      <Text style={styles.em}> · SKU {skuTrim}</Text>
                    ) : null}
                  </>
                ) : null}
                . Use the RFID gun — each read sends an 8-digit barcode and
                Enter. The hidden field stays focused to catch every read.
              </Text>

              <View style={styles.counterCard} accessibilityRole="summary">
                <Text style={styles.counterLabel}>Barcodes scanned</Text>
                <Text style={styles.counterValue}>{wedgeCount}</Text>
                <Text style={styles.counterHint}>
                  When you are done sweeping, finish to build the transfer
                  report.
                </Text>
              </View>

              <PrimaryButton
                label="Finish scan & view report"
                onPress={onFinishTransferScan}
                variant="primary"
                accessibilityHint="Builds review from scanned barcodes"
                icon={
                  <Ionicons
                    name="checkmark-done"
                    size={24}
                    color={theme.colors.onPrimary}
                  />
                }
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to setup"
                onPress={() => {
                  resetWedge();
                  setStep(1);
                }}
                style={({ pressed }) => [
                  styles.textLink,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.textLinkLabel}>← Edit setup</Text>
              </Pressable>
            </View>
          ) : null}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MetricSummary({
  label,
  value,
  subtitle,
  accent,
  bg,
  border,
}: {
  label: string;
  value: number;
  subtitle: string;
  accent: string;
  bg: string;
  border: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: bg, borderColor: border }]}>
      <View style={[styles.metricAccentBar, { backgroundColor: accent }]} />
      <View style={styles.metricInner}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
        <Text style={styles.metricSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  syncBanner: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.xs,
  },
  wedgeInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
    zIndex: -1,
  },
  scroll: {
    padding: theme.space.lg,
    paddingBottom: theme.space.xxl,
    gap: theme.space.md,
  },
  flatListContent: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.xxl,
    flexGrow: 1,
    gap: theme.space.sm,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.space.sm,
    paddingHorizontal: theme.space.xs,
  },
  stepItem: { alignItems: "center", flex: 1 },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  stepDotDone: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  stepDotCurrent: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stepNum: {
    fontSize: theme.type.label,
    fontWeight: "900",
    color: theme.colors.textMuted,
  },
  stepNumDone: {
    color: theme.colors.primary,
  },
  stepNumFuture: {
    color: theme.colors.textMuted,
  },
  stepNumCurrent: {
    color: theme.colors.onPrimary,
  },
  stepCap: {
    marginTop: theme.space.xs,
    fontSize: theme.type.caption,
    fontWeight: "700",
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.lg,
    gap: theme.space.sm,
    ...theme.shadow.card,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.type.section,
    fontWeight: "900",
  },
  cardSub: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.body,
    lineHeight: 26,
    fontWeight: "600",
    marginBottom: theme.space.sm,
  },
  em: { fontWeight: "900", color: theme.colors.text },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.label,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: theme.space.sm,
    marginBottom: theme.space.xs,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
    ...theme.shadow.card,
  },
  picker: {
    color: theme.colors.text,
    minHeight: theme.touchMin,
    fontSize: theme.type.body,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.md,
    minHeight: theme.touchMin - 4,
    fontSize: theme.type.body,
    color: theme.colors.text,
    fontWeight: "600",
    backgroundColor: theme.colors.surface,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.space.sm,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.md,
    marginTop: theme.space.sm,
  },
  hintText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: theme.type.body,
    lineHeight: 24,
    fontWeight: "600",
  },
  textLink: {
    alignSelf: "center",
    paddingVertical: theme.space.md,
    minHeight: 48,
    justifyContent: "center",
  },
  textLinkLabel: {
    color: theme.colors.primary,
    fontSize: theme.type.body,
    fontWeight: "800",
  },
  counterCard: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.space.xl,
    paddingHorizontal: theme.space.lg,
    alignItems: "center",
    marginTop: theme.space.sm,
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
  review: { gap: theme.space.sm },
  reviewTitle: {
    color: theme.colors.text,
    fontSize: theme.type.section,
    fontWeight: "900",
  },
  reviewSub: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.body,
    lineHeight: 26,
    fontWeight: "600",
    marginBottom: theme.space.sm,
  },
  summaryGrid: { gap: theme.space.md, marginBottom: theme.space.md },
  metricCard: {
    flexDirection: "row",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...theme.shadow.card,
  },
  metricAccentBar: { width: 6 },
  metricInner: {
    flex: 1,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.lg,
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.type.label,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: theme.type.stat,
    fontWeight: "900",
    marginTop: theme.space.xs,
  },
  metricSub: {
    color: theme.colors.textMuted,
    fontSize: theme.type.caption,
    marginTop: theme.space.xs,
    fontWeight: "600",
  },
  sectionTitle: {
    marginTop: theme.space.md,
    color: theme.colors.textSecondary,
    fontSize: theme.type.label,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sectionTitleInList: {
    marginTop: theme.space.lg,
  },
  empty: {
    color: theme.colors.textMuted,
    fontSize: theme.type.body,
    fontWeight: "600",
    paddingVertical: theme.space.xs,
  },
  invalidUnknown: {
    backgroundColor: theme.colors.dangerBg,
    borderColor: theme.colors.dangerBorder,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    marginBottom: theme.space.sm,
  },
  invalidBarcode: {
    color: theme.colors.danger,
    fontSize: theme.type.bodyLarge,
    fontWeight: "900",
  },
  invalidReason: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.label,
    marginTop: theme.space.xs,
    fontWeight: "600",
  },
  invalidBlock: {
    marginBottom: theme.space.sm,
  },
  invalidReasonInline: {
    color: theme.colors.danger,
    fontSize: theme.type.caption,
    fontWeight: "700",
    marginTop: -theme.space.xs,
    marginBottom: theme.space.sm,
    marginLeft: theme.space.sm,
  },
  actions: {
    gap: theme.space.md,
    marginTop: theme.space.lg,
    paddingBottom: theme.space.md,
  },
});
