import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { LARGE_LIST_PROPS } from "../constants/listPerformance";
import { PrimaryButton } from "../components/PrimaryButton";
import type { RootTabParamList } from "../navigation/RootTabs";
import {
  deleteAuditSession,
  listAuditSessions,
  type AuditSessionRecord,
} from "../storage/auditSessionStorage";
import { theme } from "../theme/theme";
import { formatShortDateTime } from "../utils/formatTime";

export function HistoryScreen() {
  const navigation =
    useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [sessions, setSessions] = useState<AuditSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setSessions(await listAuditSessions());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const onResume = useCallback(
    (id: string) => {
      navigation.navigate("StockAudit", { resumeSessionId: id });
    },
    [navigation],
  );

  const onDelete = useCallback((session: AuditSessionRecord) => {
    Alert.alert(
      "Delete session",
      `Remove ${session.scannedBarcodes.length} scanned barcode(s) from ${formatShortDateTime(session.updatedAt)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await deleteAuditSession(session.id);
              await load();
            })();
          },
        },
      ],
    );
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <View style={styles.intro}>
        <Text style={styles.introTitle}>Saved audit sessions</Text>
        <Text style={styles.introBody}>
          Resume a session to append more barcodes on the Audit tab. Saved on
          this device only.
        </Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.empty}>Loading…</Text>
          ) : (
            <Text style={styles.empty}>
              No saved sessions yet. Save from the Audit tab after scanning.
            </Text>
          )
        }
        {...LARGE_LIST_PROPS}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardMeta}>
                <Text style={styles.cardTime}>
                  {formatShortDateTime(item.updatedAt)}
                </Text>
                <Text style={styles.cardCount}>
                  {item.scannedBarcodes.length} barcode
                  {item.scannedBarcodes.length === 1 ? "" : "s"}
                </Text>
              </View>
              <Text style={styles.cardId} numberOfLines={1}>
                {item.id}
              </Text>
            </View>
            <View style={styles.actions}>
              <View style={styles.resumeWrap}>
                <PrimaryButton
                  label="Resume"
                  onPress={() => onResume(item.id)}
                  variant="primary"
                  icon={
                    <Ionicons
                      name="play-forward"
                      size={20}
                      color={theme.colors.onPrimary}
                    />
                  }
                />
              </View>
              <Pressable
                onPress={() => onDelete(item)}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  pressed && { opacity: 0.88 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Delete session"
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={theme.colors.danger}
                />
                <Text style={styles.deleteLabel}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  intro: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.sm,
  },
  introTitle: {
    fontSize: theme.type.section,
    fontWeight: "900",
    color: theme.colors.text,
  },
  introBody: {
    marginTop: theme.space.xs,
    fontSize: theme.type.body,
    lineHeight: 24,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  list: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.xxl,
    gap: theme.space.md,
  },
  empty: {
    textAlign: "center",
    marginTop: theme.space.xxl,
    color: theme.colors.textMuted,
    fontSize: theme.type.body,
    fontWeight: "600",
    paddingHorizontal: theme.space.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.lg,
    ...theme.shadow.card,
  },
  cardTop: { marginBottom: theme.space.md },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.space.md,
  },
  cardTime: {
    fontSize: theme.type.bodyLarge,
    fontWeight: "900",
    color: theme.colors.text,
  },
  cardCount: {
    fontSize: theme.type.label,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  cardId: {
    marginTop: theme.space.xs,
    fontSize: theme.type.caption,
    color: theme.colors.textMuted,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  actions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: theme.space.md,
  },
  resumeWrap: { flex: 1, minWidth: 120 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.xs,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
    backgroundColor: theme.colors.dangerBg,
  },
  deleteLabel: {
    fontSize: theme.type.label,
    fontWeight: "800",
    color: theme.colors.danger,
  },
});
