import { StyleSheet, Text, View } from "react-native";
import type { ProductDto } from "../types/inventory";
import { theme } from "../theme/theme";

type Props = {
  product: ProductDto;
  tone: "success" | "danger" | "warning" | "neutral";
};

const toneBorder = {
  success: theme.colors.success,
  danger: theme.colors.danger,
  warning: theme.colors.warning,
  neutral: theme.colors.borderStrong,
} as const;

const toneBg = {
  success: theme.colors.successBg,
  danger: theme.colors.dangerBg,
  warning: theme.colors.warningBg,
  neutral: theme.colors.surfaceMuted,
} as const;

export function ProductListItem({ product, tone }: Props) {
  return (
    <View
      style={[
        styles.card,
        {
          borderLeftColor: toneBorder[tone],
          backgroundColor: toneBg[tone],
        },
      ]}
    >
      <Text style={styles.title} numberOfLines={2}>
        {product.designName}
      </Text>
      <Text style={styles.meta}>SKU: {product.skuCode}</Text>
      <Text style={styles.meta}>EPC: {product.epcTagId}</Text>
      <Text style={styles.meta}>
        {product.location.name} · Floor {product.location.floorLabel}
      </Text>
      <Text style={styles.meta}>Status: {product.status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 5,
    padding: theme.space.md,
    marginBottom: theme.space.sm,
    ...theme.shadow.card,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.type.bodyLarge,
    fontWeight: "800",
    marginBottom: theme.space.xs,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.label,
    marginTop: 4,
    lineHeight: 22,
  },
});
