import { Alert, Platform, Share } from "react-native";

/**
 * Opens the system share sheet with graceful fallbacks (web / unsupported).
 */
export async function shareText(
  text: string,
  opts?: { title?: string; subject?: string },
): Promise<void> {
  const title = opts?.title ?? "Audit report";
  const trimmed = text.trim();
  if (!trimmed) {
    Alert.alert("Nothing to share", "Build a report with data first.");
    return;
  }

  if (Platform.OS === "web") {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(trimmed);
        Alert.alert("Copied", "Report copied to the clipboard.");
        return;
      }
    } catch {
      /* fall through */
    }
    Alert.alert(
      title,
      trimmed.length > 4000 ? `${trimmed.slice(0, 4000)}…` : trimmed,
    );
    return;
  }

  try {
    await Share.share({
      title,
      message: trimmed,
      ...(Platform.OS === "ios" ? { subject: opts?.subject ?? title } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not open share sheet.";
    Alert.alert("Share failed", msg);
  }
}
