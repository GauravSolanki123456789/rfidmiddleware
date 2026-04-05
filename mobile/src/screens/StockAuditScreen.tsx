import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { PrimaryButton } from "../components/PrimaryButton";
import { ProductListItem } from "../components/ProductListItem";
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

  const locations = useMemo(
    () => uniqueLocationsFromProducts(items),
    [items],
  );

  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

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

  const onMockScan = () => {
    if (!selectedLocationId) {
      Alert.alert("Location required", "Choose a store location first.");
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

    const take = Math.min(2, atLocation.length);
    const real = atLocation.slice(0, take).map((p) => p.epcTagId);
    const scannedEpcs = [...real, "DEADBEEF0000000000000001"];

    void runAudit({ locationId: selectedLocationId, scannedEpcs });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
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

        <PrimaryButton
          label="MOCK SCAN"
          onPress={onMockScan}
          loading={auditLoading}
          disabled={!selectedLocationId || locations.length === 0}
          variant="primary"
          accessibilityHint="Runs a simulated RFID scan for this location"
          icon={
            <Ionicons
              name="scan-outline"
              size={24}
              color={theme.colors.onPrimary}
            />
          }
        />

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
                onPress={clearAudit}
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
        ) : (
          <View style={styles.placeholder}>
            <Ionicons
              name="scan-circle-outline"
              size={48}
              color={theme.colors.textMuted}
            />
            <Text style={styles.placeholderText}>
              Choose a location, then tap scan.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
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
  placeholder: {
    alignItems: "center",
    paddingVertical: theme.space.xl,
    paddingHorizontal: theme.space.md,
    gap: theme.space.md,
  },
  placeholderText: {
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: theme.type.body,
    lineHeight: 26,
    fontWeight: "600",
    maxWidth: 320,
  },
});
