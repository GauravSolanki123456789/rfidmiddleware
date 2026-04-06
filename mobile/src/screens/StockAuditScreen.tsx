import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { PrimaryButton } from "../components/PrimaryButton";
import { ProductListItem } from "../components/ProductListItem";
import { useKeyboardWedgeScan } from "../hooks/useKeyboardWedgeScan";
import { useInventoryStore } from "../store/useInventoryStore";
import { theme } from "../theme/theme";
import { uniqueLocationsFromProducts } from "../utils/locations";

export function StockAuditScreen() {
  const {
    items,
    loadDashboard,
    runAudit,
    auditLoading,
    auditError,
    auditResult,
    clearAudit,
  } = useInventoryStore();

  const isFocused = useIsFocused();

  const locations = useMemo(
    () => uniqueLocationsFromProducts(items),
    [items],
  );

  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  const wedgeEnabled =
    isFocused && !auditResult && !!selectedLocationId && locations.length > 0;

  const {
    inputRef,
    count,
    reset: resetWedge,
    getScanned,
    wedgeInputProps,
  } = useKeyboardWedgeScan(wedgeEnabled);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  useEffect(() => {
    if (selectedLocationId) return;
    if (locations.length === 0) return;
    setSelectedLocationId(locations[0].id);
  }, [locations, selectedLocationId]);

  useEffect(() => {
    resetWedge();
  }, [selectedLocationId, resetWedge]);

  const onFinishScan = () => {
    if (!selectedLocationId) {
      Alert.alert("Location required", "Choose a store location first.");
      return;
    }
    const scannedEpcs = getScanned();
    if (scannedEpcs.length === 0) {
      Alert.alert(
        "No tags yet",
        "Scan at least one EPC with the hardware trigger, then finish.",
      );
      return;
    }

    const atLocation = items.filter((p) => p.locationId === selectedLocationId);
    if (atLocation.length === 0) {
      Alert.alert(
        "No stock expected",
        "This location has no in-stock items in the catalog.",
      );
      return;
    }

    void runAudit({ locationId: selectedLocationId, scannedEpcs });
  };

  const onClearResults = () => {
    clearAudit();
    resetWedge();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <TextInput
        ref={inputRef}
        {...wedgeInputProps}
        style={styles.wedgeInput}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.fieldLabel}>Location</Text>
        <View style={styles.pickerWrap} accessibilityLabel="Store location">
          <Picker
            selectedValue={selectedLocationId}
            onValueChange={(v) => setSelectedLocationId(String(v))}
            mode="dropdown"
            style={styles.picker}
            dropdownIconColor={theme.colors.text}
          >
            {locations.length === 0 ? (
              <Picker.Item label="No locations available" value="" />
            ) : null}
            {locations.map((loc) => (
              <Picker.Item
                key={loc.id}
                label={`${loc.name} · ${loc.floorLabel}`}
                value={loc.id}
              />
            ))}
          </Picker>
        </View>

        {!auditResult ? (
          <View style={styles.scanPanel}>
            <View style={styles.counterCard} accessibilityRole="summary">
              <Text style={styles.counterLabel}>Tags scanned</Text>
              <Text style={styles.counterValue}>{count}</Text>
              <Text style={styles.counterHint}>
                Pull the RFID trigger — each tag ends with Enter. This field
                stays focused for the gun.
              </Text>
            </View>

            <PrimaryButton
              label="Finish scan & view report"
              onPress={onFinishScan}
              loading={auditLoading}
              disabled={!selectedLocationId || locations.length === 0}
              variant="primary"
              accessibilityHint="Runs stock audit with scanned EPCs"
              icon={
                <Ionicons
                  name="checkmark-done"
                  size={24}
                  color={theme.colors.onPrimary}
                />
              }
            />
          </View>
        ) : null}

        {auditError ? (
          <View style={styles.banner} accessibilityRole="alert">
            <Text style={styles.bannerText}>{auditError}</Text>
          </View>
        ) : null}

        {auditResult ? (
          <View style={styles.results}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Scan results</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear results"
                onPress={onClearResults}
                style={({ pressed }) => [
                  styles.clearBtn,
                  pressed && { opacity: 0.88 },
                ]}
                hitSlop={12}
              >
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Found</Text>
            {auditResult.found_items.length === 0 ? (
              <Text style={styles.empty}>None</Text>
            ) : (
              auditResult.found_items.map((p) => (
                <ProductListItem key={p.id} product={p} tone="success" />
              ))
            )}

            <Text style={styles.sectionTitle}>Missing</Text>
            {auditResult.missing_items.length === 0 ? (
              <Text style={styles.empty}>None</Text>
            ) : (
              auditResult.missing_items.map((p) => (
                <ProductListItem key={p.id} product={p} tone="danger" />
              ))
            )}

            <Text style={styles.sectionTitle}>Unknown tags</Text>
            {auditResult.unknown_items.length === 0 ? (
              <Text style={styles.empty}>None</Text>
            ) : (
              auditResult.unknown_items.map((epc) => (
                <View key={epc} style={styles.unknownRow}>
                  <Text style={styles.unknownEpc}>{epc}</Text>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
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
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.label,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
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
  scanPanel: { gap: theme.space.lg },
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
  banner: {
    backgroundColor: theme.colors.dangerBg,
    borderColor: theme.colors.dangerBorder,
    borderWidth: 1,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
  },
  bannerText: {
    color: theme.colors.danger,
    fontSize: theme.type.body,
    fontWeight: "600",
    lineHeight: 26,
  },
  results: {
    marginTop: theme.space.sm,
    paddingTop: theme.space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    gap: theme.space.sm,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.space.sm,
  },
  clearBtn: {
    minHeight: 48,
    minWidth: 88,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
  clearText: {
    color: theme.colors.text,
    fontSize: theme.type.label,
    fontWeight: "800",
  },
  resultsTitle: {
    color: theme.colors.text,
    fontSize: theme.type.section,
    fontWeight: "900",
    flex: 1,
  },
  sectionTitle: {
    marginTop: theme.space.md,
    color: theme.colors.textSecondary,
    fontSize: theme.type.label,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  empty: {
    color: theme.colors.textMuted,
    fontSize: theme.type.body,
    fontWeight: "600",
    paddingVertical: theme.space.xs,
  },
  unknownRow: {
    backgroundColor: theme.colors.warningBg,
    borderColor: theme.colors.warningBorder,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    marginBottom: theme.space.sm,
  },
  unknownEpc: {
    color: theme.colors.warning,
    fontSize: theme.type.bodyLarge,
    fontWeight: "800",
  },
});
