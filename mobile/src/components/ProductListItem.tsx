import { StyleSheet, Text, View } from "react-native";
import type { ProductDto } from "../types/inventory";
import { theme } from "../theme/theme";
import { formatStockLabel } from "../utils/formatStockLabel";
import {
  displayBin,
  displayGrossWt,
  displayItemName,
  displaySku,
  displayStyleCode,
} from "../utils/productDisplay";

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
        {displayItemName(product)}
      </Text>
      <Text style={styles.lineDense} numberOfLines={1}>
        SKU {displaySku(product)} · {formatStockLabel(product.isSold)}
      </Text>
      <Text style={styles.barcode} numberOfLines={1}>
        {product.barcode}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        Style {displayStyleCode(product)} · {displayGrossWt(product)} g
      </Text>
      <Text style={styles.loc} numberOfLines={1}>
        Bin {displayBin(product)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 5,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    marginBottom: theme.space.sm,
    ...theme.shadow.card,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.type.bodyLarge,
    fontWeight: "800",
    marginBottom: theme.space.xs,
    lineHeight: 24,
  },
  lineDense: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.label,
    fontWeight: "700",
    lineHeight: 22,
  },
  barcode: {
    color: theme.colors.textMuted,
    fontSize: theme.type.caption,
    fontWeight: "600",
    marginTop: 4,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: theme.type.caption,
    fontWeight: "600",
    marginTop: 2,
  },
  loc: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.caption,
    fontWeight: "600",
    marginTop: 2,
  },
});
