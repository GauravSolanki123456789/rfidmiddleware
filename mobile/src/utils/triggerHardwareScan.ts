import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

export type HardwareScanMode = "start" | "stop";

/**
 * Best-effort Android intents to wake the RFID / barcode laser. Vendors differ
 * (Zebra DataWedge, Chainway, etc.); this never throws to the UI layer.
 */
export async function triggerHardwareScanIntent(
  mode: HardwareScanMode,
): Promise<void> {
  if (Platform.OS !== "android") return;

  try {
    const cmd = mode === "start" ? "start" : "stop";

    const attempts: {
      action: string;
      params?: IntentLauncher.IntentLauncherParams;
    }[] = [
      { action: "com.rfid.SCAN_CMD", params: { extra: { cmd } } },
      {
        action: "com.rfid.SCAN_CMD",
        params: { extra: { "com.rfid.cmd": cmd } },
      },
      { action: "android.intent.action.BARCODE_SCAN" },
      {
        action: "android.intent.action.BARCODE_SCAN",
        params: { extra: { "android.intent.extra.ACTION": cmd } },
      },
    ];

    for (const attempt of attempts) {
      try {
        await Promise.race([
          IntentLauncher.startActivityAsync(attempt.action, attempt.params),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("intent-timeout")), 450),
          ),
        ]);
        return;
      } catch {
        /* try next profile */
      }
    }
  } catch {
    /* module / unexpected — never propagate */
  }
}
