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
import { LARGE_LIST_PROPS } from "../constants/listPerformance";
import { ErrorBanner } from "../components/ErrorBanner";
import { useInventoryStore } from "../store/useInventoryStore";
import type { ProductDto } from "../types/inventory";
import { theme } from "../theme/theme";
import { formatProductStatus } from "../utils/formatProductStatus";

export function LocateItemScreen() {
  const { items, loadDashboard, error } = useInventoryStore();
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

  const listHeader = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return (
      <View style={styles.resultBar}>
        <Text style={styles.resultBarText} accessibilityLiveRegion="polite">
          {results.length === 0
            ? "No matches"
            : `${results.length} ${results.length === 1 ? "item" : "items"}`}
        </Text>
      </View>
    );
  }, [query, results.length]);

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
        ListHeaderComponent={listHeader}
        {...LARGE_LIST_PROPS}
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
      <Text style={styles.cardTitle} numberOfLines={2}>
        {product.designName}
      </Text>
      <Text style={styles.cardSku}>SKU · {product.skuCode}</Text>
      <Text style={styles.locLine} numberOfLines={1}>
        {product.location.name} · {product.location.floorLabel}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        EPC {product.epcTagId} · {formatProductStatus(product.status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  syncBanner: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.xs,
  },
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
  resultBar: {
    paddingBottom: theme.space.sm,
    marginBottom: theme.space.xs,
  },
  resultBarText: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.label,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.lg,
    marginBottom: theme.space.sm,
    ...theme.shadow.card,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.type.bodyLarge,
    fontWeight: "900",
    marginBottom: theme.space.xs,
    lineHeight: 24,
  },
  cardSku: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.label,
    fontWeight: "700",
    marginBottom: theme.space.sm,
  },
  locLine: {
    color: theme.colors.text,
    fontSize: theme.type.body,
    fontWeight: "700",
    marginBottom: theme.space.xs,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: theme.type.caption,
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
