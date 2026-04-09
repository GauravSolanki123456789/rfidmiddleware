import { StyleSheet, Text, View } from "react-native";
import type { ProductDto } from "../types/inventory";
import { theme } from "../theme/theme";
import {
  displayGrossWt,
  displaySku,
  displayStyleCode,
} from "../utils/productDisplay";

type Tone = "success" | "danger" | "neutral";

const border = {
  success: theme.colors.success,
  danger: theme.colors.danger,
  neutral: theme.colors.borderStrong,
} as const;

/**
 * Single-line audit row: [Barcode] | Style - SKU | Wtg
 */
export function AuditProductLine({
  product,
  tone,
}: {
  product: ProductDto;
  tone: Tone;
}) {
  const wt = displayGrossWt(product);
  return (
    <View
      style={[
        styles.row,
        { borderLeftColor: border[tone] },
      ]}
    >
      <Text style={styles.text} numberOfLines={2}>
        [{product.barcode}] | {displayStyleCode(product)} - {displaySku(product)}{" "}
        | {wt}g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderLeftWidth: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    marginBottom: theme.space.xs,
  },
  text: {
    fontSize: theme.type.label,
    fontWeight: "700",
    color: theme.colors.text,
    lineHeight: 22,
  },
});
