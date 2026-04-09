import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInventoryStore } from "../store/useInventoryStore";
import { theme } from "../theme/theme";
import type { ProductDto } from "../types/inventory";
import { buildStyleSkuTree } from "../utils/styleSkuTree";

type Props = {
  visible: boolean;
  onClose: () => void;
  items: ProductDto[];
};

function CheckboxBox({
  checked,
  indeterminate,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) {
  return (
    <View
      style={[
        styles.box,
        checked && styles.boxOn,
        indeterminate && styles.boxIndeterminate,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{
        checked: indeterminate ? "mixed" : checked,
      }}
    >
      {indeterminate ? (
        <Ionicons name="remove" size={16} color={theme.colors.primary} />
      ) : checked ? (
        <Ionicons name="checkmark" size={18} color={theme.colors.onPrimary} />
      ) : null}
    </View>
  );
}

export function AdvancedFilterModal({ visible, onClose, items }: Props) {
  const selectedSkus = useInventoryStore((s) => s.selectedSkus);
  const setSkusForStyle = useInventoryStore((s) => s.setSkusForStyle);
  const toggleSku = useInventoryStore((s) => s.toggleSku);
  const clearSelectedSkus = useInventoryStore((s) => s.clearSelectedSkus);

  const tree = useMemo(() => buildStyleSkuTree(items), [items]);
  const selectedSet = useMemo(() => new Set(selectedSkus), [selectedSkus]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = useCallback((styleCode: string) => {
    setExpanded((e) => ({ ...e, [styleCode]: !e[styleCode] }));
  }, []);

  const onToggleStyle = useCallback(
    (styleCode: string, skuList: string[]) => {
      const allOn = skuList.every((s) => selectedSet.has(s));
      setSkusForStyle(skuList, !allOn);
    },
    [selectedSet, setSkusForStyle],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>SKU scope</Text>
            <Text style={styles.sub}>
              Choose one or more SKUs. Empty selection = full catalog. Bin filter
              is separate.
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.doneBtn,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.doneLabel}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.toolbar}>
          <Text style={styles.toolbarMeta}>
            {selectedSkus.length === 0
              ? "No SKU filter — all items in scope"
              : `${selectedSkus.length} SKU${
                  selectedSkus.length === 1 ? "" : "s"
                } selected`}
          </Text>
          <Pressable
            onPress={clearSelectedSkus}
            style={({ pressed }) => [
              styles.clearBtn,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Clear SKU selection"
          >
            <Text style={styles.clearLabel}>Clear</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {tree.map((node) => {
            const skuStrings = node.skus.map((s) => s.sku);
            const allOn = skuStrings.every((s) => selectedSet.has(s));
            const noneOn = skuStrings.every((s) => !selectedSet.has(s));
            const indeterminate = !allOn && !noneOn;
            const isOpen = expanded[node.styleCode] ?? false;

            return (
              <View key={node.styleCode} style={styles.styleBlock}>
                <TouchableStyleRow
                  styleCode={node.styleCode}
                  skuStrings={skuStrings}
                  allOn={allOn}
                  indeterminate={indeterminate}
                  isOpen={isOpen}
                  onToggleExpand={() => toggleExpand(node.styleCode)}
                  onToggleStyle={() => onToggleStyle(node.styleCode, skuStrings)}
                />
                {isOpen ? (
                  <View style={styles.skuList}>
                    {node.skus.map(({ sku, count }) => {
                      const on = selectedSet.has(sku);
                      return (
                        <Pressable
                          key={sku}
                          onPress={() => toggleSku(sku)}
                          style={({ pressed }) => [
                            styles.skuRow,
                            pressed && { opacity: 0.9 },
                          ]}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: on }}
                        >
                          <CheckboxBox checked={on} />
                          <Text style={styles.skuLabel} numberOfLines={2}>
                            {sku}
                          </Text>
                          <Text style={styles.skuCount}>{count}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function TouchableStyleRow({
  styleCode,
  skuStrings,
  allOn,
  indeterminate,
  isOpen,
  onToggleExpand,
  onToggleStyle,
}: {
  styleCode: string;
  skuStrings: string[];
  allOn: boolean;
  indeterminate: boolean;
  isOpen: boolean;
  onToggleExpand: () => void;
  onToggleStyle: () => void;
}) {
  return (
    <View style={styles.styleRow}>
      <Pressable
        onPress={onToggleStyle}
        style={({ pressed }) => [
          styles.styleCheckWrap,
          pressed && { opacity: 0.9 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Select all SKUs for ${styleCode}`}
      >
        <CheckboxBox
          checked={allOn}
          indeterminate={indeterminate}
        />
      </Pressable>
      <Pressable
        onPress={onToggleExpand}
        style={({ pressed }) => [
          styles.styleLabelWrap,
          pressed && { backgroundColor: theme.colors.surfaceMuted },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${isOpen ? "Collapse" : "Expand"} ${styleCode}`}
      >
        <Text style={styles.styleTitle} numberOfLines={2}>
          {styleCode}
        </Text>
        <Text style={styles.styleHint}>
          {skuStrings.length} SKU{skuStrings.length === 1 ? "" : "s"}
        </Text>
      </Pressable>
      <Pressable
        onPress={onToggleExpand}
        style={styles.chevronBtn}
        accessibilityRole="button"
      >
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={22}
          color={theme.colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.space.md,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: theme.type.title,
    fontWeight: "900",
    color: theme.colors.text,
  },
  sub: {
    marginTop: theme.space.xs,
    fontSize: theme.type.body,
    lineHeight: 24,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  doneBtn: {
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    minHeight: theme.touchMin - 8,
    justifyContent: "center",
  },
  doneLabel: {
    fontSize: theme.type.label,
    fontWeight: "800",
    color: theme.colors.onPrimary,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
    backgroundColor: theme.colors.surfaceMuted,
  },
  toolbarMeta: {
    flex: 1,
    fontSize: theme.type.caption,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  clearBtn: {
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.xs,
  },
  clearLabel: {
    fontSize: theme.type.label,
    fontWeight: "800",
    color: theme.colors.danger,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.xxl,
  },
  styleBlock: {
    marginTop: theme.space.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
    ...theme.shadow.card,
  },
  styleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    paddingRight: theme.space.xs,
  },
  styleCheckWrap: {
    paddingLeft: theme.space.md,
    paddingVertical: theme.space.md,
  },
  styleLabelWrap: {
    flex: 1,
    paddingVertical: theme.space.md,
    paddingRight: theme.space.sm,
    borderRadius: theme.radius.sm,
  },
  styleTitle: {
    fontSize: theme.type.section,
    fontWeight: "900",
    color: theme.colors.text,
  },
  styleHint: {
    marginTop: 4,
    fontSize: theme.type.caption,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },
  chevronBtn: {
    padding: theme.space.md,
  },
  skuList: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: theme.space.xs,
  },
  skuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    marginHorizontal: theme.space.xs,
    marginBottom: 4,
    borderRadius: theme.radius.sm,
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
  box: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  boxOn: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  boxIndeterminate: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
});
