import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useInventoryStore } from "../store/useInventoryStore";
import type { ProductDto } from "../types/inventory";
import { theme } from "../theme/theme";

export function LocateItemScreen() {
  const { items, loadDashboard } = useInventoryStore();
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter(
      (p) =>
        p.designName.toLowerCase().includes(q) ||
        p.skuCode.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <View style={styles.searchRow}>
        <Ionicons
          name="search"
          size={24}
          color={theme.colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Design name or SKU"
          placeholderTextColor={theme.colors.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          underlineColorAndroid="transparent"
          style={styles.input}
          accessibilityLabel="Search inventory"
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="location-outline"
              size={44}
              color={theme.colors.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {query.trim().length === 0
                ? "Search to find an item"
                : "No items match"}
            </Text>
            <Text style={styles.emptySub}>
              {query.trim().length === 0
                ? "Enter a design name or SKU code."
                : "Try another keyword or check spelling."}
            </Text>
          </View>
        }
        renderItem={({ item }) => <LocateCard product={item} />}
      />
    </SafeAreaView>
  );
}

function LocateCard({ product }: { product: ProductDto }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={3}>
        {product.designName}
      </Text>
      <Text style={styles.cardSku}>SKU · {product.skuCode}</Text>
      <View style={styles.row}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Location</Text>
          <Text style={styles.pillValue}>{product.location.name}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Floor</Text>
          <Text style={styles.pillValue}>{product.location.floorLabel}</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        EPC {product.epcTagId} · {product.status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.space.lg,
    marginTop: theme.space.sm,
    marginBottom: theme.space.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.space.md,
    minHeight: theme.touchMin + 4,
    ...theme.shadow.card,
  },
  searchIcon: { marginRight: theme.space.sm },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.type.bodyLarge,
    paddingVertical: theme.space.sm,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.xxl,
    flexGrow: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.lg,
    marginBottom: theme.space.md,
    ...theme.shadow.card,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.type.section,
    fontWeight: "900",
    marginBottom: theme.space.xs,
    lineHeight: 28,
  },
  cardSku: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.label,
    fontWeight: "700",
    marginBottom: theme.space.md,
  },
  row: { flexDirection: "row", gap: theme.space.sm, flexWrap: "wrap" },
  pill: {
    flexGrow: 1,
    minWidth: "45%",
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.md,
  },
  pillLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.type.caption,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: theme.space.xs,
  },
  pillValue: {
    color: theme.colors.text,
    fontSize: theme.type.bodyLarge,
    fontWeight: "900",
  },
  meta: {
    marginTop: theme.space.md,
    color: theme.colors.textMuted,
    fontSize: theme.type.label,
    fontWeight: "600",
  },
  empty: {
    paddingTop: theme.space.xxl,
    alignItems: "center",
    paddingHorizontal: theme.space.lg,
    gap: theme.space.sm,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.type.section,
    fontWeight: "900",
    textAlign: "center",
    marginTop: theme.space.sm,
  },
  emptySub: {
    color: theme.colors.textMuted,
    fontSize: theme.type.body,
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "600",
    maxWidth: 300,
  },
});
